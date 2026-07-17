import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Search, ShieldAlert, Check, X, Clipboard, Shield, 
  MapPin, Clock, RefreshCw, AlertTriangle, Scale 
} from 'lucide-react';

const DISTRICTS = [
  "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", 
  "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", 
  "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", 
  "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", 
  "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", 
  "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir", 
  "Vijayanagara"
];

const EVIDENCE_TYPES = [
  "CCTV Footage", "Weapon", "Document", "Digital Device", 
  "DNA Sample", "Witness Statement", "Financial Records", 
  "Photographs", "Audio Recording", "Vehicle"
];

function EvidenceLocker() {
  const [evidenceList, setEvidenceList] = useState([]);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedAnalysis, setSelectedAnalysis] = useState("All Statuses");
  const [selectedAdmissible, setSelectedAdmissible] = useState("All Admissibility");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");

  // Selected Item Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [successToast, setSuccessToast] = useState("");
  const [updating, setUpdating] = useState(false);

  // Transfer Custody Form State
  const [transferOfficer, setTransferOfficer] = useState("");
  const [transferLocation, setTransferLocation] = useState("");
  const [transferPurpose, setTransferPurpose] = useState("Transfer");
  const [showTransferForm, setShowTransferForm] = useState(false);

  const fetchEvidenceData = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "http://127.0.0.1:8000/api/evidence?";
      const params = [];
      if (searchQuery) params.push(`q=${encodeURIComponent(searchQuery)}`);
      if (selectedType !== "All Types") params.push(`type=${encodeURIComponent(selectedType)}`);
      if (selectedAnalysis !== "All Statuses") params.push(`analysis_status=${encodeURIComponent(selectedAnalysis)}`);
      if (selectedDistrict !== "All Districts") params.push(`district=${encodeURIComponent(selectedDistrict)}`);
      if (selectedAdmissible !== "All Admissibility") {
        params.push(`court_admissible=${selectedAdmissible === "Admissible" ? "true" : "false"}`);
      }
      
      const res = await fetch(url + params.join("&"));
      if (!res.ok) throw new Error("Failed to fetch evidence locker data.");
      const json = await res.json();
      setEvidenceList(json.records);
      setStats(json.stats);
      setChartData(json.type_chart);
    } catch (err) {
      setError(err.message || "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceData();
  }, [selectedType, selectedAnalysis, selectedAdmissible, selectedDistrict]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchEvidenceData();
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !transferOfficer.trim() || !transferLocation.trim()) return;
    setUpdating(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/evidence/${selectedItem.EvidenceID}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transfer_to: transferOfficer,
          location: transferLocation,
          purpose: transferPurpose
        })
      });
      if (!res.ok) throw new Error("Failed to transfer custody.");
      const json = await res.json();
      setSelectedItem(json.record);
      showToast(`Custody transferred to ${transferOfficer}`);
      setShowTransferForm(false);
      setTransferOfficer("");
      setTransferLocation("");
      fetchEvidenceData(); // Refresh main list
    } catch (err) {
      showToast("Error transferring custody.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleIntegrityToggle = async () => {
    if (!selectedItem) return;
    const currentIntegrity = selectedItem.IntegrityStatus;
    const newIntegrity = currentIntegrity === "Intact" ? "Compromised" : "Intact";
    
    setUpdating(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/evidence/${selectedItem.EvidenceID}/integrity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrity_status: newIntegrity })
      });
      if (!res.ok) throw new Error("Failed to update integrity status.");
      const json = await res.json();
      setSelectedItem(json.record);
      showToast(`Integrity status updated to: ${newIntegrity}`);
      fetchEvidenceData();
    } catch (err) {
      showToast("Error updating integrity status.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3000);
  };

  const getPurposeColor = (purpose) => {
    switch (purpose) {
      case "Collection": return "#00e5ff"; // cyan
      case "Transfer": return "#ffaa00"; // amber
      case "Analysis": return "#bf5af2"; // purple
      default: return "#00ff88"; // Court (green)
    }
  };

  const getIntegrityBadgeStyles = (status) => {
    if (status === "Intact") {
      return { backgroundColor: 'rgba(0, 255, 136, 0.08)', color: '#00ff88', borderColor: 'rgba(0, 255, 136, 0.2)' };
    }
    if (status === "Compromised") {
      return { 
        backgroundColor: 'rgba(255, 45, 85, 0.1)', 
        color: '#ff2d55', 
        borderColor: 'rgba(255, 45, 85, 0.2)',
        animation: 'pulse 1.5s infinite' 
      };
    }
    return { backgroundColor: 'rgba(255, 170, 0, 0.08)', color: '#ffaa00', borderColor: 'rgba(255, 170, 0, 0.2)' };
  };

  const pieColors = ['#00e5ff', '#bf5af2', '#ffaa00', '#ff6b35', '#ff2d55', '#00ff88', '#34c759', '#007aff', '#ff9500', '#af52de'];

  if (loading && !stats) {
    return (
      <div style={styles.centeredState}>
        <div style={styles.loader}></div>
        <div style={{ color: '#00e5ff', fontFamily: 'monospace', fontSize: '11px', marginTop: '12px' }}>
          FETCHING INTELLIGENCE DATA...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <ShieldAlert size={16} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      {successToast && (
        <div style={styles.toast}>
          <Check size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* STATS ROW */}
      <div className="stats-grid">
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">TOTAL EVIDENCE ITEMS</div>
          <div className="stat-value">{stats.total_items}</div>
          <div className="stat-subtitle">Digital & Physical Locker</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">PENDING ANALYSIS</div>
          <div className="stat-value" style={{ color: '#ffaa00' }}>{stats.pending_analysis}</div>
          <div className="stat-subtitle">Awaiting forensic queue</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">COURT ADMISSIBLE</div>
          <div className="stat-value" style={{ color: '#00ff88' }}>{stats.court_admissible}</div>
          <div className="stat-subtitle">Admissible in trial benched</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">INTEGRITY COMPROMISED</div>
          <div className="stat-value" style={{ color: stats.compromised > 0 ? '#ff2d55' : '#8a9ba8' }}>
            {stats.compromised}
          </div>
          <div className="stat-subtitle">Alert: Seal breaches</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="chart-card" style={styles.filterCard}>
        <form onSubmit={handleSearchSubmit} style={styles.filterForm}>
          <div style={styles.searchBox}>
            <Search size={14} color="#8a9ba8" />
            <input 
              type="text" 
              placeholder="Search by Evidence ID / Case ID..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="cyber-input-plain"
              style={styles.searchInput}
            />
          </div>

          <div style={styles.dropdownsRow}>
            <select 
              value={selectedType} 
              onChange={e => setSelectedType(e.target.value)}
              className="cyber-input"
              style={styles.filterDropdown}
            >
              <option>All Types</option>
              {EVIDENCE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>

            <select 
              value={selectedAnalysis} 
              onChange={e => setSelectedAnalysis(e.target.value)}
              className="cyber-input"
              style={styles.filterDropdown}
            >
              <option>All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Analysis">In Analysis</option>
              <option value="Completed">Completed</option>
            </select>

            <select 
              value={selectedAdmissible} 
              onChange={e => setSelectedAdmissible(e.target.value)}
              className="cyber-input"
              style={styles.filterDropdown}
            >
              <option>All Admissibility</option>
              <option value="Admissible">Admissible</option>
              <option value="Inadmissible">Inadmissible</option>
            </select>

            <select 
              value={selectedDistrict} 
              onChange={e => setSelectedDistrict(e.target.value)}
              className="cyber-input"
              style={styles.filterDropdown}
            >
              <option>All Districts</option>
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>

            <button type="submit" className="cyber-btn" style={{ padding: '0 20px', height: '34px' }}>
              <span>APPLY</span>
            </button>
          </div>
        </form>
      </div>

      {/* EVIDENCE TABLE */}
      <div className="chart-card" style={styles.tableCard}>
        {evidenceList.length === 0 ? (
          <div style={styles.emptyState}>NO RECORDS FOUND</div>
        ) : (
          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>EVIDENCE ID</th>
                  <th>CASE ID</th>
                  <th>EVIDENCE TYPE</th>
                  <th>COLLECTED DATE</th>
                  <th>ANALYSIS STATUS</th>
                  <th>INTEGRITY STATUS</th>
                  <th>COURT ADMISSIBLE</th>
                  <th style={{ textAlign: 'right' }}>CHAIN CONTROL</th>
                </tr>
              </thead>
              <tbody>
                {evidenceList.map(e => (
                  <tr key={e.EvidenceID}>
                    <td className="mono" style={{ color: '#00e5ff', fontWeight: 'bold' }}>{e.EvidenceID}</td>
                    <td className="mono">{e.CaseID}</td>
                    <td>{e.EvidenceType}</td>
                    <td className="mono">{e.CollectionDate}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(0,229,255,0.05)', color: '#00e5ff' }}>
                        {e.AnalysisStatus}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="badge" 
                        style={getIntegrityBadgeStyles(e.IntegrityStatus)}
                      >
                        {e.IntegrityStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: e.CourtAdmissible ? '#00ff88' : '#ff2d55', fontWeight: 'bold' }}>
                        {e.CourtAdmissible ? "YES" : "NO"}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="cyber-btn-outline" 
                        onClick={() => setSelectedItem(e)}
                        style={{ padding: '3px 8px', fontSize: '9px' }}
                      >
                        <span>VIEW CHAIN</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EVIDENCE TYPE BREAKDOWN (Pie Chart) */}
      <div className="chart-card" style={styles.chartCard}>
        <div className="chart-header">
          <span className="chart-title">EVIDENCE TYPE BREAKDOWN (LOCKER DISTRIBUTION)</span>
        </div>
        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={75}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={true}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={styles.chartTooltip} />
              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETAIL CHAIN MODAL */}
      {selectedItem && (
        <div style={styles.modalOverlay}>
          <div className="chart-card" style={styles.modalContainer}>
            <div className="chart-header" style={{ borderBottom: '1px solid #1e2d3d', paddingBottom: '10px' }}>
              <span className="chart-title" style={{ color: '#00e5ff' }}>CHAIN OF CUSTODY — {selectedItem.EvidenceID}</span>
              <button className="cyber-btn-outline" onClick={() => { setSelectedItem(null); setShowTransferForm(false); }} style={{ padding: '3px 8px', fontSize: '9px' }}>
                CLOSE
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                {/* Left Side Details */}
                <div style={styles.modalLeftCol}>
                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>EVIDENCE ID</span>
                    <span style={styles.infoValue} className="mono" style={{ color: '#00e5ff' }}>{selectedItem.EvidenceID}</span>
                  </div>

                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>CASE COMPLAINT ID</span>
                    <span style={styles.infoValue} className="mono">{selectedItem.CaseID}</span>
                  </div>

                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>EVIDENCE CATEGORY</span>
                    <span style={styles.infoValue}>{selectedItem.EvidenceType}</span>
                  </div>

                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>ANALYSIS STATUS</span>
                    <span className="badge" style={{ backgroundColor: 'rgba(0, 229, 255, 0.05)', color: '#00e5ff', width: 'fit-content', marginTop: '4px' }}>
                      {selectedItem.AnalysisStatus}
                    </span>
                  </div>

                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>COURT ADMISSIBILITY</span>
                    <span 
                      style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: selectedItem.CourtAdmissible ? '#00ff88' : '#ff2d55',
                        marginTop: '4px' 
                      }}
                    >
                      COURT ADMISSIBLE: {selectedItem.CourtAdmissible ? "YES" : "NO"}
                    </span>
                  </div>

                  {/* INTEGRITY ALERTS */}
                  <div style={{ marginTop: '10px' }}>
                    <span style={styles.infoLabel}>SEAL INTEGRITY</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <span className="badge" style={getIntegrityBadgeStyles(selectedItem.IntegrityStatus)}>
                        {selectedItem.IntegrityStatus}
                      </span>
                      <button 
                        className="cyber-btn-outline" 
                        disabled={updating}
                        onClick={handleIntegrityToggle}
                        style={{ padding: '3px 8px', fontSize: '9px' }}
                      >
                        TOGGLE INTEGRITY
                      </button>
                    </div>
                    {selectedItem.IntegrityStatus === "Compromised" && (
                      <div style={styles.compromisedAlert}>
                        <AlertTriangle size={14} color="#ff2d55" />
                        <div style={{ fontSize: '9px', lineHeight: '1.3' }}>
                          <strong>⚠ INTEGRITY BREACH DETECTED</strong>
                          <br />This evidence may not be court admissible. Contact supervising officer immediately.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side Custody Timeline */}
                <div style={styles.modalRightCol}>
                  <span style={styles.infoLabel}>CHAIN OF CUSTODY LOGS</span>
                  
                  {/* VERTICAL TIMELINE */}
                  <div style={styles.timeline}>
                    <div style={styles.timelineLine} />
                    {selectedItem.ChainOfCustody.map((step, idx) => {
                      const isCurrent = idx === selectedItem.ChainOfCustody.length - 1;
                      return (
                        <div key={idx} style={styles.timelineStep}>
                          {/* Dot Node */}
                          <div 
                            style={{ 
                              ...styles.timelineDot, 
                              backgroundColor: getPurposeColor(step.purpose),
                              boxShadow: isCurrent ? `0 0 10px ${getPurposeColor(step.purpose)}` : 'none'
                            }} 
                          >
                            {isCurrent && <div style={styles.pulsingDot} />}
                          </div>

                          {/* Content */}
                          <div style={styles.timelineContent}>
                            <div style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>
                              {step.officer} <span style={{ color: '#4f616d', fontWeight: 'normal' }}>({step.purpose})</span>
                            </div>
                            <div style={{ fontSize: '9px', color: '#8a9ba8', marginTop: '2px' }}>
                              {step.location} &nbsp;|&nbsp; <span className="mono">{step.date_time}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CUSTODY TRANSFER ACTION */}
                  {!showTransferForm ? (
                    <button 
                      className="cyber-btn"
                      onClick={() => setShowTransferForm(true)}
                      style={{ width: '100%', marginTop: '12px', padding: '6px' }}
                    >
                      TRANSFER CUSTODY
                    </button>
                  ) : (
                    <form onSubmit={handleTransferSubmit} style={styles.transferForm}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={styles.infoLabel}>TRANSFER TO (OFFICER NAME)</label>
                        <input 
                          type="text"
                          required
                          value={transferOfficer}
                          onChange={e => setTransferOfficer(e.target.value)}
                          placeholder="e.g. SI Naveen Kumar"
                          className="cyber-input"
                          style={{ height: '30px', fontSize: '11px', padding: '0 8px' }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={styles.infoLabel}>TRANSFER LOCATION</label>
                        <input 
                          type="text"
                          required
                          value={transferLocation}
                          onChange={e => setTransferLocation(e.target.value)}
                          placeholder="e.g. Forensic Lab Bengaluru"
                          className="cyber-input"
                          style={{ height: '30px', fontSize: '11px', padding: '0 8px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={styles.infoLabel}>PURPOSE</label>
                        <select 
                          value={transferPurpose}
                          onChange={e => setTransferPurpose(e.target.value)}
                          className="cyber-input"
                          style={{ height: '30px', fontSize: '11px', padding: '0 8px' }}
                        >
                          <option value="Transfer">Transfer</option>
                          <option value="Analysis">Analysis</option>
                          <option value="Court">Court Presentment</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button type="submit" disabled={updating} className="cyber-btn" style={{ flexGrow: 1, padding: '5px', fontSize: '10px' }}>
                          CONFIRM TRANSFER
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setShowTransferForm(false)} 
                          className="cyber-btn-outline" 
                          style={{ padding: '5px 12px', fontSize: '10px' }}
                        >
                          CANCEL
                        </button>
                      </div>
                    </form>
                  )}
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
    padding: '12px 20px',
  },
  filterForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    height: '36px',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    padding: '0 10px',
    borderRadius: '4px',
  },
  searchInput: {
    flexGrow: 1,
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
  },
  dropdownsRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterDropdown: {
    height: '34px',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    color: '#fff',
    fontSize: '11px',
    padding: '0 8px',
    flexGrow: 1,
    minWidth: '120px',
  },
  tableCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
  },
  chartCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    padding: '20px',
  },
  chartTooltip: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    fontSize: '10px',
  },
  emptyState: {
    textAlign: 'center',
    color: '#4f616d',
    fontFamily: 'monospace',
    fontSize: '11px',
    padding: '40px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 4, 9, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalContainer: {
    width: '640px',
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    borderTop: '2px solid #00e5ff',
    padding: '20px',
  },
  modalBody: {
    marginTop: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.1fr',
    gap: '24px',
  },
  modalLeftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderRight: '1px solid #1e2d3d',
    paddingRight: '16px',
  },
  modalRightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#4f616d',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: '12px',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  compromisedAlert: {
    marginTop: '12px',
    background: 'rgba(255, 45, 85, 0.1)',
    border: '1px solid #ff2d55',
    color: '#ff2d55',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '18px',
    marginTop: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '180px',
    overflowY: 'auto',
  },
  timelineLine: {
    position: 'absolute',
    left: '4px',
    top: '4px',
    bottom: '4px',
    width: '2px',
    background: '#1e2d3d',
  },
  timelineStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    position: 'relative',
  },
  timelineDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    position: 'absolute',
    left: '-18px',
    top: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  pulsingDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#070a12',
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  transferForm: {
    background: '#070a12',
    border: '1px solid #1e2d3d',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '10px',
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
    boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
    zIndex: 9999,
  }
};

export default EvidenceLocker;
