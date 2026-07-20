import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, X, Search, Filter, AlertOctagon } from 'lucide-react';

const DISTRICTS = [
  "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", 
  "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", 
  "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", 
  "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", 
  "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", 
  "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir", 
  "Vijayanagara"
];

function MissingPersons() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [sortBy, setSortBy] = useState('Most Recent');

  // Stats
  const [stats, setStats] = useState({ total: 0, found: 0, active: 0, critical: 0 });

  // Modal
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Amber Alert overlay state
  const [amberAlert, setAmberAlert] = useState(null); // holds person object when active
  const [amberAlertsTriggered, setAmberAlertsTriggered] = useState({});
  const [amberCountdown, setAmberCountdown] = useState(3);
  
  // Toast notifications
  const [successToast, setSuccessToast] = useState('');

  const fetchMissingPersons = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (districtFilter) params.append('district', districtFilter);
      params.append('sort', sortBy);

      const response = await fetch(`http://127.0.0.1:8000/api/missing-persons?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load missing persons data.');
      }
      const data = await response.json();
      setPersons(data);

      // Compute stats from the database (unfiltered stats)
      const statsRes = await fetch('http://127.0.0.1:8000/api/missing-persons');
      if (statsRes.ok) {
        const allData = await statsRes.json();
        let total = allData.length;
        let found = allData.filter(p => p.Status === 'Found').length;
        let active = allData.filter(p => p.Status === 'Active Search').length;
        
        // Critical is Status = Critical OR MissingDays > 30 (for active cases)
        let critical = allData.filter(p => {
          if (p.Status === 'Found') return false;
          const days = getMissingDays(p.LastSeenDate);
          return p.Status === 'Critical' || days > 30;
        }).length;

        setStats({ total, found, active, critical });
      }

    } catch (err) {
      setError(err.message || 'Error connecting to database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissingPersons();
  }, [searchTerm, statusFilter, districtFilter, sortBy]);

  // Modals Escape Listener
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setSelectedPerson(null);
        setAmberAlert(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const getMissingDays = (dateStr) => {
    try {
      const seenDate = new Date(dateStr);
      const today = new Date();
      const diffTime = Math.abs(today - seenDate);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'MP';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const getCardBorderColor = (p) => {
    if (p.Status === 'Found') return '#00ff88'; // green
    
    const days = getMissingDays(p.LastSeenDate);
    if (p.Status === 'Critical' || days > 30) return '#ff2d55'; // red critical
    if (days >= 7) return '#ff6b35'; // orange
    return '#ffaa00'; // amber
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/missing-persons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update case status.');
      }

      const updated = await response.json();
      
      // Update local state lists
      setPersons(prev => prev.map(p => p.MissingID === id ? { ...p, Status: newStatus } : p));
      if (selectedPerson && selectedPerson.MissingID === id) {
        setSelectedPerson(prev => ({ ...prev, Status: newStatus }));
      }

      showToast(`Case status updated to ${newStatus}.`);
      fetchMissingPersons(); // reload statistics
    } catch (err) {
      alert(err.message || 'Failed to update record.');
    }
  };

  const triggerAmberAlert = (person) => {
    setAmberAlert(person);
    setAmberAlertsTriggered(prev => ({ ...prev, [person.MissingID]: true }));
    setAmberCountdown(3);
  };

  useEffect(() => {
    if (!amberAlert) return;
    if (amberCountdown <= 0) {
      setAmberAlert(null);
      showToast("Amber alert broadcast initiated");
      return;
    }
    const timer = setTimeout(() => {
      setAmberCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [amberAlert, amberCountdown]);

  return (
    <div style={styles.container}>
      {/* Dynamic pulse CSS injection for Critical cards */}
      <style>{`
        .pulse-border-red {
          animation: pulseBorder 1.5s infinite !important;
        }
        @keyframes pulseBorder {
          0% { border-color: #ff2d55; box-shadow: 0 0 0 0 rgba(255, 45, 85, 0.4); }
          70% { border-color: #ff2d55; box-shadow: 0 0 0 6px rgba(255, 45, 85, 0); }
          100% { border-color: #ff2d55; box-shadow: 0 0 0 0 rgba(255, 45, 85, 0); }
        }
        .amber-alert-flash {
          animation: flashBg 0.5s infinite alternate !important;
        }
        @keyframes flashBg {
          from { background-color: #ffaa00; }
          to { background-color: #ffcc00; }
        }
      `}</style>

      {/* Toast Notification */}
      {successToast && (
        <div style={styles.toast}>
          <Check size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* AMBER ALERT FULLSCREEN OVERLAY */}
      {amberAlert && (
        <div className="amber-alert-flash" style={{ ...styles.amberOverlay, backgroundColor: '#ffaa00', color: '#000000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ ...styles.amberContent, color: '#000000' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: '0 0 10px 0', letterSpacing: '2px', color: '#000000', fontFamily: 'var(--font-mono)' }}>⚠️ AMBER ALERT ISSUED</h1>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 20px 0', color: '#000000' }}>
              {amberAlert.Name.toUpperCase()} — LAST SEEN IN {amberAlert.LastSeenDistrict.toUpperCase()}
            </h2>
            <div style={{ margin: '20px auto', display: 'flex', justifyContent: 'center' }}>
              <Shield size={64} color="#000000" />
            </div>
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', marginTop: '20px', color: '#000000' }}>
              Closing in {amberCountdown}...
            </div>
          </div>
        </div>
      )}

      {/* STATS ROW */}
      <div className="stats-grid">
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">TOTAL REGISTERED MISSING</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-subtitle">KSP Database Registry</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">FOUND SAFE</div>
          <div className="stat-value" style={{ color: '#00ff88' }}>{stats.found}</div>
          <div className="stat-subtitle">Reunited / Closed cases</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">ACTIVE SEARCH</div>
          <div className="stat-value" style={{ color: '#ffaa00' }}>{stats.active}</div>
          <div className="stat-subtitle">Under active investigation</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">CRITICAL STATUS</div>
          <div className="stat-value" style={{ color: '#ff2d55' }}>{stats.critical}</div>
          <div className="stat-subtitle">Missing for &gt; 30 Days</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="chart-card" style={styles.filterCard}>
        <div style={styles.filterGrid}>
          <div style={styles.filterCol}>
            <label style={styles.label}>SEARCH BY NAME</label>
            <div style={styles.searchWrap}>
              <Search size={14} style={styles.searchIcon} />
              <input
                type="text"
                className="cyber-input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search Name..."
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>

          <div style={styles.filterCol}>
            <label style={styles.label}>STATUS FILTER</label>
            <select
              className="cyber-select"
              style={styles.select}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active Search">Active Search</option>
              <option value="Critical">Critical</option>
              <option value="Found">Found</option>
            </select>
          </div>

          <div style={styles.filterCol}>
            <label style={styles.label}>DISTRICT</label>
            <select
              className="cyber-select"
              style={styles.select}
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
            >
              <option value="">All Districts</option>
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterCol}>
            <label style={styles.label}>SORT BY</label>
            <select
              className="cyber-select"
              style={styles.select}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="Most Recent">Most Recent</option>
              <option value="Longest Missing">Longest Missing</option>
            </select>
          </div>
        </div>
      </div>

      {/* CARDS GRID */}
      {loading ? (
        <div style={styles.centeredState}>
          <div style={styles.loader}></div>
          <div style={{ color: '#00e5ff', fontFamily: 'monospace', fontSize: '11px', marginTop: '12px' }}>LOADING CASE DIRECTORY...</div>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      ) : persons.length === 0 ? (
        <div style={styles.centeredState}>
          <span style={{ color: '#4f616d', fontFamily: 'monospace', fontSize: '11px' }}>NO DATA AVAILABLE. NO REGISTERED PERSONS MATCH THE ACTIVE QUERY.</span>
        </div>
      ) : (
        <div style={styles.grid}>
          {persons.map(p => {
            const days = getMissingDays(p.LastSeenDate);
            const borderColor = getCardBorderColor(p);
            const isCritical = p.Status === 'Critical' || (p.Status === 'Active Search' && days > 30);
            
            return (
              <div 
                key={p.MissingID} 
                className={`chart-card ${isCritical ? "pulse-border-red" : ""}`}
                style={{ 
                  ...styles.personCard, 
                  borderColor: borderColor,
                  borderTop: `3px solid ${borderColor}`
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.idText}>{p.MissingID}</span>
                  <span 
                    className="badge" 
                    style={{ 
                      backgroundColor: `${borderColor}15`, 
                      color: borderColor, 
                      borderColor: `${borderColor}30`,
                      fontSize: '9px'
                    }}
                  >
                    {p.Status === 'Active Search' && days > 30 ? 'CRITICAL' : p.Status}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.avatar}>
                    {getInitials(p.Name)}
                  </div>
                  <div style={styles.profileDetails}>
                    <h3 style={styles.personName}>{p.Name}</h3>
                    <p style={styles.metaText}>{p.Age} Yrs  |  {p.Gender}</p>
                  </div>
                </div>

                <div style={styles.durationBox}>
                  {p.Status === 'Found' ? (
                    <span style={{ color: '#00ff88', fontWeight: 'bold' }}>REUNITED SAFE</span>
                  ) : (
                    <>
                      <span style={styles.durationVal}>{days}</span>
                      <span style={styles.durationLbl}>DAYS MISSING</span>
                    </>
                  )}
                </div>

                <div style={styles.locationBox}>
                  <span style={{ color: '#4f616d' }}>LAST SEEN: </span>
                  <span style={{ color: '#ffffff' }}>{p.LastSeenDistrict}</span>
                </div>

                <button 
                  className="cyber-btn" 
                  style={{ width: '100%', padding: '8px', fontSize: '11px', marginTop: '10px' }}
                  onClick={() => setSelectedPerson(p)}
                >
                  VIEW CASE
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* CASE DETAIL MODAL */}
      {selectedPerson && (
        <div className="modal-overlay" onClick={() => setSelectedPerson(null)}>
          <div className="cyber-modal" style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">MISSING PERSON FILE DETAILS</span>
              <button className="modal-close-btn" onClick={() => setSelectedPerson(null)}><X size={20} /></button>
            </div>

            <div className="modal-content" style={styles.modalContent}>
              <div style={styles.modalGrid}>
                {/* Profile panel */}
                <div style={styles.modalProfile}>
                  <div 
                    style={{ 
                      ...styles.modalAvatar, 
                      borderColor: getCardBorderColor(selectedPerson),
                      color: getCardBorderColor(selectedPerson) 
                    }}
                  >
                    {getInitials(selectedPerson.Name)}
                  </div>
                  <h3 style={styles.modalName}>{selectedPerson.Name}</h3>
                  <div style={styles.modalSubText}>FILE: {selectedPerson.MissingID}</div>

                  <div style={styles.modalFields}>
                    <div style={styles.field}><span style={styles.fieldLbl}>AGE:</span> {selectedPerson.Age}</div>
                    <div style={styles.field}><span style={styles.fieldLbl}>GENDER:</span> {selectedPerson.Gender}</div>
                    <div style={styles.field}><span style={styles.fieldLbl}>REPORTING OFFICER:</span> {selectedPerson.ReportingOfficer}</div>
                  </div>
                </div>

                {/* Case timeline and actions */}
                <div style={styles.modalCasePanel}>
                  <div style={styles.field}><span style={styles.fieldLbl}>LAST SEEN DISTRICT:</span> <span style={{ color: '#ffffff' }}>{selectedPerson.LastSeenDistrict}</span></div>
                  <div style={styles.field}><span style={styles.fieldLbl}>LAST SEEN LOCATION:</span> <span style={{ color: '#ffffff' }}>{selectedPerson.LastSeenLocation}</span></div>
                  <div style={styles.field}><span style={styles.fieldLbl}>LAST SEEN DATE:</span> <span className="mono" style={{ color: '#ffffff' }}>{selectedPerson.LastSeenDate} ({getMissingDays(selectedPerson.LastSeenDate)} days ago)</span></div>

                  <h4 style={styles.timelineTitle}>SEARCH OPERATIONS TIMELINE</h4>
                  <div style={styles.opsTimeline}>
                    <div style={styles.opsStep}>
                      <div style={{ ...styles.opsDot, backgroundColor: '#00ff88', color: '#070a12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>✓</div>
                      <div style={styles.opsText}>
                        <div style={styles.opsHdr}>FIR REGISTERED (COMPLETED)</div>
                        <div style={styles.opsDesc}>Missing entry logged at {selectedPerson.LastSeenDistrict} station. File {selectedPerson.MissingID} active.</div>
                      </div>
                    </div>

                    <div style={styles.opsStep}>
                      <div style={{ ...styles.opsDot, backgroundColor: '#00ff88', color: '#070a12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>✓</div>
                      <div style={styles.opsText}>
                        <div style={styles.opsHdr}>LOCAL INVESTIGATION & WITNESS VERIFICATION (COMPLETED)</div>
                        <div style={styles.opsDesc}>Physical patrol dispatched to last seen site: {selectedPerson.LastSeenLocation}. Relatives interviewed.</div>
                      </div>
                    </div>

                    <div style={styles.opsStep}>
                      <div style={{ 
                        ...styles.opsDot, 
                        backgroundColor: amberAlertsTriggered[selectedPerson.MissingID] ? '#00ff88' : '#1e2d3d',
                        color: amberAlertsTriggered[selectedPerson.MissingID] ? '#070a12' : '#8a9ba8',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '9px', 
                        fontWeight: 'bold'
                      }}>
                        {amberAlertsTriggered[selectedPerson.MissingID] ? '✓' : '3'}
                      </div>
                      <div style={styles.opsText}>
                        <div style={{ 
                          ...styles.opsHdr, 
                          color: amberAlertsTriggered[selectedPerson.MissingID] ? '#00ff88' : '#8a9ba8' 
                        }}>
                          STATE-WIDE AMBER ALERT BROADCAST
                        </div>
                        <div style={styles.opsDesc}>
                          {amberAlertsTriggered[selectedPerson.MissingID] 
                            ? 'Amber alert broadcast completed to all regional cells and mobile hubs.' 
                            : 'Pending high official authorization or critical threat level flag.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={styles.actionsRow}>
                    {selectedPerson.Status !== 'Found' && (
                      <>
                        <button className="cyber-btn" style={{ background: '#00ff88', borderColor: '#00ff88', color: '#070a12', fontSize: '10px' }} onClick={() => handleUpdateStatus(selectedPerson.MissingID, 'Found')}>
                          MARK AS FOUND
                        </button>
                        <button className="cyber-btn" style={{ background: '#ff3b30', borderColor: '#ff3b30', color: '#ffffff', fontSize: '10px' }} onClick={() => {
                          showToast("Escalated to State missing cell");
                          setSelectedPerson(null);
                        }}>
                          ESCALATE
                        </button>
                        <button className="cyber-btn" style={{ background: '#ffaa00', borderColor: '#ffaa00', color: '#000000', fontSize: '10px' }} onClick={() => triggerAmberAlert(selectedPerson)}>
                          AMBER ALERT
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '20px',
  },
  statCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
  },
  filterCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    padding: '16px',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
  },
  filterCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#8a9ba8',
    letterSpacing: '1px',
  },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    color: '#4f616d',
  },
  select: {
    height: '38px',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    color: '#ffffff',
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    gap: '20px',
  },
  personCard: {
    background: '#0d1117',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e2d3d',
    paddingBottom: '8px',
  },
  idText: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#8a9ba8',
  },
  cardBody: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#121822',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    border: '1px solid #1e2d3d',
  },
  profileDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  personName: {
    fontSize: '13px',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  metaText: {
    fontSize: '11px',
    color: '#8a9ba8',
  },
  durationBox: {
    background: '#070a12',
    border: '1px solid #1e2d3d',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60px',
  },
  durationVal: {
    fontFamily: 'monospace',
    fontSize: '18px',
    fontWeight: '700',
    color: '#ff2d55',
  },
  durationLbl: {
    fontFamily: 'monospace',
    fontSize: '8px',
    color: '#4f616d',
    marginTop: '2px',
  },
  locationBox: {
    fontSize: '11px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  modalBox: {
    maxWidth: '750px',
    width: '90%',
  },
  modalContent: {
    padding: '20px',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.4fr',
    gap: '24px',
  },
  modalProfile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRight: '1px solid #1e2d3d',
    paddingRight: '20px',
  },
  modalAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#121822',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    border: '2px solid',
    marginBottom: '14px',
  },
  modalName: {
    fontSize: '15px',
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubText: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#8a9ba8',
    marginTop: '2px',
    marginBottom: '20px',
  },
  modalFields: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid #1e2d3d',
    paddingTop: '14px',
  },
  field: {
    fontSize: '11px',
    color: '#8a9ba8',
  },
  fieldLbl: {
    color: '#4f616d',
    fontFamily: 'monospace',
    marginRight: '6px',
  },
  modalCasePanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  timelineTitle: {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#8a9ba8',
    borderBottom: '1px solid #1e2d3d',
    paddingBottom: '4px',
    marginTop: '10px',
    textTransform: 'uppercase',
  },
  opsTimeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingLeft: '12px',
  },
  opsStep: {
    display: 'flex',
    gap: '10px',
    position: 'relative',
  },
  opsDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#00e5ff',
    marginTop: '5px',
    flexShrink: 0,
  },
  opsText: {
    display: 'flex',
    flexDirection: 'column',
  },
  opsHdr: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  opsDesc: {
    fontSize: '10px',
    color: '#8a9ba8',
    marginTop: '2px',
  },
  actionsRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '14px',
  },
  amberOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  amberContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    color: '#000000',
  },
  amberH1: {
    fontSize: '32px',
    fontWeight: '900',
    fontFamily: 'monospace',
    marginBottom: '20px',
  },
  amberDetailsCard: {
    background: '#000000',
    border: '3px solid #000000',
    padding: '30px',
    borderRadius: '8px',
    color: '#ffaa00',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    maxWidth: '500px',
  },
  amberName: {
    fontSize: '24px',
    fontWeight: '900',
    fontFamily: 'monospace',
    marginBottom: '10px',
  },
  amberText: {
    fontSize: '14px',
    fontFamily: 'monospace',
    marginBottom: '6px',
    fontWeight: 'bold',
  },
  amberWarning: {
    fontSize: '11px',
    fontFamily: 'sans-serif',
    marginTop: '20px',
    color: '#ffffff',
    borderTop: '1px solid #ffaa00',
    paddingTop: '14px',
  },
  centeredState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    width: '100%',
  },
  loader: {
    width: '30px',
    height: '30px',
    border: '2px solid #1e2d3d',
    borderTop: '2px solid #00e5ff',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    background: 'rgba(255, 59, 48, 0.1)',
    border: '1px solid #ff3b30',
    color: '#ff3b30',
    padding: '12px 20px',
    fontFamily: 'monospace',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#0d1117',
    border: '1px solid #00ff88',
    borderLeft: '4px solid #00ff88',
    color: '#ffffff',
    padding: '12px 20px',
    fontFamily: 'sans-serif',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
    zIndex: 9999,
  }
};

export default MissingPersons;
