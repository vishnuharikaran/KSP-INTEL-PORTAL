import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Award, ClipboardList, MapPin, Check, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

function SuspectSearch() {
  const [query, setQuery] = useState('');
  const [suspects, setSuspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal dossier state
  const [selectedSuspect, setSelectedSuspect] = useState(null);
  
  // Toast notifications
  const [successToast, setSuccessToast] = useState('');

  const fetchSuspects = async (searchTerm = '') => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/suspects/search?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        throw new Error('Failed to load suspects records.');
      }
      const data = await response.json();
      setSuspects(data);
    } catch (err) {
      setError(err.message || 'Error connecting to database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuspects();
  }, []);

  // Modals Escape Listener
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setSelectedSuspect(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSuspects(query);
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'CRITICAL': return '#ff3b30';
      case 'HIGH': return '#ff9500';
      case 'MEDIUM': return '#ffcc00';
      case 'LOW': return '#34c759';
      default: return '#8a9ba8';
    }
  };

  const getSeverityColor = (crimeType) => {
    if (["Murder"].includes(crimeType)) return '#ff3b30'; // Critical Red
    if (["Robbery", "Theft", "Vehicle Theft"].includes(crimeType)) return '#ff9500'; // High Orange
    if (["Cybercrime", "Fraud"].includes(crimeType)) return '#ffcc00'; // Medium Amber
    return '#34c759'; // Low Green
  };

  // Compute active districts chart data
  const getDistrictChartData = (suspect) => {
    if (!suspect || !suspect.Timeline) return [];
    
    const counts = {};
    suspect.Timeline.forEach(event => {
      counts[event.district] = (counts[event.district] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));
  };

  return (
    <div style={styles.container}>
      {/* Toast */}
      {successToast && (
        <div style={styles.toast}>
          <Check size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Search bar */}
      <form onSubmit={handleSearchSubmit} style={styles.searchBarForm}>
        <input
          type="text"
          className="cyber-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by Name / Phone / Case ID / MO..."
          style={styles.searchInput}
        />
        <button type="submit" className="cyber-btn" style={styles.searchBtn}>
          <Search size={14} />
          <span>QUERY</span>
        </button>
      </form>

      {/* Main suspect listing */}
      {loading ? (
        <div style={styles.centeredState}>
          <div style={styles.loader}></div>
          <div style={{ color: 'var(--cyan)', fontFamily: 'monospace', fontSize: '11px', marginTop: '12px' }}>RETRIEVING SUSPECT INDEX...</div>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      ) : suspects.length === 0 ? (
        <div style={styles.centeredState}>
          <span style={{ color: '#4f616d', fontFamily: 'monospace', fontSize: '11px' }}>NO DATA AVAILABLE. NO MATCHING SUSPECT RECORD IN DATABASE.</span>
        </div>
      ) : (
        <div style={styles.grid}>
          {suspects.map(s => {
            const riskColor = getRiskColor(s.RiskLevel);
            return (
              <div key={s.OffenderID} className="chart-card" style={styles.suspectCard}>
                {/* Header */}
                <div style={styles.cardHeader}>
                  <span style={styles.offenderId}>{s.OffenderID}</span>
                  <span 
                    className="badge" 
                    style={{ 
                      backgroundColor: `${riskColor}15`, 
                      color: riskColor, 
                      borderColor: `${riskColor}30`,
                      fontSize: '9px',
                      padding: '1px 6px'
                    }}
                  >
                    {s.RiskLevel}
                  </span>
                </div>

                {/* Avatar & Name */}
                <div style={styles.avatarRow}>
                  <div style={styles.avatarCircle}>
                    {getInitials(s.Name)}
                  </div>
                  <div style={styles.nameCol}>
                    <div style={styles.nameText}>{s.Name}</div>
                    <div style={styles.phoneText}>{s.AccusedPhone}</div>
                  </div>
                </div>

                {/* Stats */}
                <div style={styles.statsRow}>
                  <div style={styles.statBox}>
                    <div style={styles.statVal}>{s.PriorConvictions}</div>
                    <div style={styles.statLbl}>PRIOR CONVICT</div>
                  </div>
                  <div style={styles.statBox}>
                    <div style={styles.statVal} style={{ color: 'var(--cyan)' }}>{s.ActiveCases}</div>
                    <div style={styles.statLbl}>ACTIVE CASES</div>
                  </div>
                </div>

                {/* Districts tags */}
                <div style={styles.districtTags}>
                  {s.Districts.slice(0, 3).map(d => (
                    <span key={d} style={styles.tagDist}><MapPin size={10} style={{ marginRight: '2px' }} />{d}</span>
                  ))}
                  {s.Districts.length > 3 && <span style={styles.tagMore}>+{s.Districts.length - 3} MORE</span>}
                </div>

                {/* MO Summary */}
                <div style={styles.moSummary}>
                  <span style={{ color: '#4f616d', fontWeight: 'bold' }}>MO: </span>
                  {s.MO.length > 80 ? s.MO.substring(0, 80) + '...' : s.MO}
                </div>

                <button 
                  className="cyber-btn" 
                  style={{ width: '100%', padding: '8px', fontSize: '11px', marginTop: '12px' }}
                  onClick={() => setSelectedSuspect(s)}
                >
                  VIEW DOSSIER
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* SUSPECT DOSSIER MODAL */}
      {selectedSuspect && (
        <div className="modal-overlay" onClick={() => setSelectedSuspect(null)}>
          <div className="cyber-modal" style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="modal-title" style={{ color: 'var(--cyan)' }}>OFFENDER DOSSIER</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                  CLASSIFIED // TOP SECRET
                </span>
                <button className="modal-close-btn" onClick={() => setSelectedSuspect(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-label)', padding: 0 }}><X size={20} /></button>
              </div>
            </div>

            <div className="modal-content" style={styles.modalContent}>
              <div style={styles.modalGrid}>
                {/* LEFT COLUMN */}
                <div style={styles.modalLeft}>
                  {/* Large avatar */}
                  <div 
                    style={{ 
                      ...styles.largeAvatar, 
                      borderColor: getRiskColor(selectedSuspect.RiskLevel),
                      boxShadow: `0 0 15px ${getRiskColor(selectedSuspect.RiskLevel)}15`
                    }}
                  >
                    {getInitials(selectedSuspect.Name)}
                  </div>

                  <h3 style={styles.modalName}>{selectedSuspect.Name}</h3>
                  <div style={styles.modalSubId}>{selectedSuspect.OffenderID}  |  {selectedSuspect.AccusedPhone}</div>

                  <div style={styles.modalBadgeRow}>
                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: `${getRiskColor(selectedSuspect.RiskLevel)}15`, 
                        color: getRiskColor(selectedSuspect.RiskLevel), 
                        borderColor: `${getRiskColor(selectedSuspect.RiskLevel)}30` 
                      }}
                    >
                      {selectedSuspect.RiskLevel} THREAT
                    </span>
                  </div>

                  {/* Threat assessment score */}
                  <div style={styles.threatMeterContainer}>
                    <div style={styles.threatMeterHeader}>
                      <span>THREAT ASSESSMENT SCORE</span>
                      <span style={{ color: getRiskColor(selectedSuspect.RiskLevel), fontWeight: 'bold' }}>{selectedSuspect.RiskScore}/100</span>
                    </div>
                    <div className="gauge-track" style={{ height: '8px', background: 'linear-gradient(90deg, var(--green), var(--amber), var(--red))', borderRadius: '4px', position: 'relative', overflow: 'visible', margin: '8px 0' }}>
                      <div 
                        style={{ 
                          position: 'absolute',
                          left: `${selectedSuspect.RiskScore}%`,
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '14px',
                          height: '14px',
                          backgroundColor: '#ffffff',
                          borderRadius: '50%',
                          boxShadow: '0 0 8px rgba(0,0,0,0.8)',
                          border: '2px solid var(--bg-card)',
                          transition: 'left 0.3s ease'
                        }}
                      />
                    </div>
                    <div style={styles.gaugeLabels}>
                      <span>0 (LOW)</span>
                      <span>50 (HIGH)</span>
                      <span>100 (CRITICAL)</span>
                    </div>
                  </div>

                  {/* Quick counts */}
                  <div style={styles.quickCounts}>
                    <div style={styles.quickCountBox}>
                      <div style={styles.quickCountVal}>{selectedSuspect.PriorConvictions}</div>
                      <div style={styles.quickCountLbl}>CONVICTIONS</div>
                    </div>
                    <div style={styles.quickCountBox}>
                      <div style={styles.quickCountVal} style={{ color: 'var(--cyan)' }}>{selectedSuspect.ActiveCases}</div>
                      <div style={styles.quickCountLbl}>ACTIVE CASES</div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={styles.modalRight}>
                  {/* Timeline section */}
                  <h4 style={styles.sectionHeader}>CRIMINAL INCIDENT TIMELINE</h4>
                  <div style={styles.timelineContainer}>
                    {selectedSuspect.Timeline.map((item, idx) => {
                      const sevColor = getSeverityColor(item.crime_type);
                      return (
                        <div key={idx} style={styles.timelineItem}>
                          {/* Dot indicator */}
                          <div style={{ ...styles.timelineDot, backgroundColor: sevColor }}></div>
                          
                          {/* Line to next */}
                          {idx < selectedSuspect.Timeline.length - 1 && (
                            <div style={styles.timelineLine}></div>
                          )}
                          
                          {/* Event Text */}
                          <div style={styles.timelineText}>
                            <span style={styles.timelineDate}>{item.date}</span>
                            <span style={{ ...styles.timelineType, color: sevColor }}>{item.crime_type}</span>
                            <span style={styles.timelineDist}>{item.district}</span>
                            <span style={styles.timelineStatus}>{item.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Modus operandi list */}
                  <h4 style={styles.sectionHeader} style={{ marginTop: '20px', ...styles.sectionHeader }}>MODUS OPERANDI (MO)</h4>
                  <div style={styles.moTagsList}>
                    {selectedSuspect.MO.split('; ').map((mo, i) => (
                      <span key={i} style={styles.moTag}>{mo}</span>
                    ))}
                  </div>

                  {/* Active Districts charts */}
                  <h4 style={styles.sectionHeader} style={{ marginTop: '20px', ...styles.sectionHeader }}>ACTIVE INCIDENT RATIOS</h4>
                  <div style={{ height: '100px', width: '100%', background: '#070a12', padding: '10px', border: '1px solid var(--border)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={getDistrictChartData(selectedSuspect)}>
                        <XAxis type="number" stroke="#8a9ba8" fontSize={9} hide />
                        <YAxis dataKey="name" type="category" stroke="#8a9ba8" fontSize={8} width={70} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', fontSize: 10 }} />
                        <Bar dataKey="count" fill="var(--cyan)" barSize={8} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Action buttons */}
                  <div style={styles.modalActionButtons}>
                    <button className="cyber-btn" style={{ padding: '8px 12px', fontSize: '10px' }} onClick={() => showToast(`Lookout notice issued for ${selectedSuspect.Name}.`)}>
                      ISSUE LOOKOUT NOTICE
                    </button>
                    <button className="cyber-btn" style={{ padding: '8px 12px', fontSize: '10px', background: '#ff3b30', borderColor: '#ff3b30', color: '#fff' }} onClick={() => showToast(`${selectedSuspect.Name} flagged as wanted.`)}>
                      FLAG AS WANTED
                    </button>
                    <button className="cyber-btn-outline" style={{ padding: '8px 12px', fontSize: '10px' }} onClick={() => showToast(`Dossier shared with SCRB.`)}>
                      SHARE WITH SCRB
                    </button>
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
  searchBarForm: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  searchInput: {
    flexGrow: 1,
  },
  searchBtn: {
    padding: '0 24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  suspectCard: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '8px',
  },
  offenderId: {
    fontFamily: 'monospace',
    color: 'var(--cyan)',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: 'var(--border)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'monospace',
    border: '1px solid var(--border)',
  },
  nameCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  nameText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '13px',
  },
  phoneText: {
    fontFamily: 'monospace',
    color: '#8a9ba8',
    fontSize: '11px',
    marginTop: '2px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    background: '#070a12',
    padding: '10px',
    border: '1px solid var(--border)',
    textAlign: 'center',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
  },
  statVal: {
    fontFamily: 'monospace',
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
  },
  statLbl: {
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#4f616d',
    marginTop: '2px',
  },
  districtTags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  tagDist: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#121822',
    color: '#8a9ba8',
    border: '1px solid var(--border)',
    fontSize: '9px',
    padding: '2px 6px',
    fontFamily: 'monospace',
  },
  tagMore: {
    background: 'transparent',
    color: 'var(--cyan)',
    fontSize: '9px',
    padding: '2px',
    fontFamily: 'monospace',
    alignSelf: 'center',
  },
  moSummary: {
    fontSize: '11px',
    color: '#8a9ba8',
    lineHeight: '1.4',
    flexGrow: 1,
  },
  modalBox: {
    maxWidth: '800px',
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
  modalLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRight: '1px solid var(--border)',
    paddingRight: '20px',
  },
  largeAvatar: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    backgroundColor: 'var(--border)',
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid',
    marginBottom: '16px',
  },
  modalName: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '4px',
  },
  modalSubId: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#8a9ba8',
    textAlign: 'center',
    marginBottom: '12px',
  },
  modalBadgeRow: {
    marginBottom: '20px',
  },
  threatMeterContainer: {
    width: '100%',
    background: '#070a12',
    padding: '12px',
    border: '1px solid var(--border)',
    marginBottom: '20px',
  },
  threatMeterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#8a9ba8',
    marginBottom: '6px',
  },
  gaugeTrack: {
    height: '10px',
    background: '#121822',
    border: '1px solid var(--border)',
    position: 'relative',
    marginBottom: '6px',
  },
  quickCounts: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    width: '100%',
    textAlign: 'center',
  },
  quickCountBox: {
    background: '#070a12',
    border: '1px solid var(--border)',
    padding: '8px',
  },
  quickCountVal: {
    fontFamily: 'monospace',
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
  },
  quickCountLbl: {
    fontFamily: 'monospace',
    fontSize: '8px',
    color: '#4f616d',
  },
  modalRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeader: {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#8a9ba8',
    letterSpacing: '1px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '4px',
    textTransform: 'uppercase',
  },
  timelineContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    position: 'relative',
    paddingLeft: '16px',
    marginTop: '6px',
    maxHeight: '160px',
    overflowY: 'auto',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  timelineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    position: 'absolute',
    left: '-16px',
    zIndex: 2,
  },
  timelineLine: {
    width: '2px',
    position: 'absolute',
    left: '-13px',
    top: '8px',
    bottom: '-22px',
    backgroundColor: 'var(--border)',
    zIndex: 1,
  },
  timelineText: {
    display: 'flex',
    gap: '8px',
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#ffffff',
    flexWrap: 'wrap',
  },
  timelineDate: {
    color: '#8a9ba8',
  },
  timelineType: {
    fontWeight: 'bold',
  },
  timelineDist: {
    color: '#4f616d',
  },
  timelineStatus: {
    fontSize: '9px',
    background: '#121822',
    padding: '0 4px',
    border: '1px solid var(--border)',
  },
  moTagsList: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  moTag: {
    fontSize: '9px',
    color: '#8a9ba8',
    border: '1px solid var(--border)',
    background: '#070a12',
    padding: '3px 8px',
    fontFamily: 'monospace',
  },
  modalActionButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px',
    flexWrap: 'wrap',
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
    border: '2px solid var(--border)',
    borderTop: '2px solid var(--cyan)',
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
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--green)',
    borderLeft: '4px solid var(--green)',
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

export default SuspectSearch;
