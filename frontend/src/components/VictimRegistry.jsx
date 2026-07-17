import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Search, ShieldAlert, Check, X, User, Heart, Scale, 
  AlertCircle, Shield, Briefcase, Plus, RefreshCw 
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

const CRIME_TYPES = [
  "UPI Fraud", "Phishing", "Sextortion", "OLX Scam", 
  "Romance Scam", "Social Media Abuse", "Job Fraud"
];

function VictimRegistry({ onNavigateToCase }) {
  const [victims, setVictims] = useState([]);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCrime, setSelectedCrime] = useState("All Crime Types");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedCompensation, setSelectedCompensation] = useState("All Statuses");
  const [selectedGender, setSelectedGender] = useState("All Genders");

  // Selected Profile Modal State
  const [selectedVictim, setSelectedVictim] = useState(null);
  const [successToast, setSuccessToast] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchVictimsData = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "http://127.0.0.1:8000/api/victims?";
      const params = [];
      if (searchQuery) params.push(`q=${encodeURIComponent(searchQuery)}`);
      if (selectedCrime !== "All Crime Types") params.push(`crime_type=${encodeURIComponent(selectedCrime)}`);
      if (selectedDistrict !== "All Districts") params.push(`district=${encodeURIComponent(selectedDistrict)}`);
      if (selectedCompensation !== "All Statuses") params.push(`compensation_status=${encodeURIComponent(selectedCompensation)}`);
      if (selectedGender !== "All Genders") params.push(`gender=${encodeURIComponent(selectedGender)}`);
      
      const res = await fetch(url + params.join("&"));
      if (!res.ok) throw new Error("Failed to fetch victim registry data.");
      const json = await res.json();
      setVictims(json.records);
      setStats(json.stats);
      setChartData(json.support_chart);
    } catch (err) {
      setError(err.message || "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVictimsData();
  }, [selectedCrime, selectedDistrict, selectedCompensation, selectedGender]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchVictimsData();
  };

  const handleUpdateVictimProfile = async (updatedFields) => {
    if (!selectedVictim) return;
    setUpdating(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/victims/${selectedVictim.VictimID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          support_services: updatedFields.support_services || selectedVictim.SupportServicesAssigned,
          status: updatedFields.status || selectedVictim.VictimStatus,
          compensation_status: updatedFields.compensation_status || selectedVictim.CompensationStatus
        })
      });
      if (!res.ok) throw new Error("Failed to update victim profile.");
      const json = await res.json();
      setSelectedVictim(json.record);
      showToast("Victim profile updated successfully.");
      fetchVictimsData(); // Refresh main list
    } catch (err) {
      showToast("Error updating profile.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3000);
  };

  const getCompensationColor = (status) => {
    switch (status) {
      case "Disbursed": return "#00ff88";
      case "Approved": return "#00e5ff";
      default: return "#ffaa00"; // Pending
    }
  };

  const getInjuryColor = (severity) => {
    switch (severity) {
      case "Critical": return "#ff2d55";
      case "Major": return "#ffaa00";
      case "Minor": return "#00ff88";
      default: return "#8a9ba8";
    }
  };

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
      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">TOTAL VICTIMS LISTED</div>
          <div className="stat-value">{stats.total_victims}</div>
          <div className="stat-subtitle">Victim Support Index</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">CASES CLOSED</div>
          <div className="stat-value" style={{ color: '#00ff88' }}>{stats.cases_closed}</div>
          <div className="stat-subtitle">Completed rehabilitations</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="chart-card" style={styles.filterCard}>
        <form onSubmit={handleSearchSubmit} style={styles.filterForm}>
          <div style={styles.searchBox}>
            <Search size={14} color="#8a9ba8" />
            <input 
              type="text" 
              placeholder="Search by Victim ID / Case ID / Name..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="cyber-input-plain"
              style={styles.searchInput}
            />
          </div>

          <div style={styles.dropdownsRow}>
            <select 
              value={selectedCrime} 
              onChange={e => setSelectedCrime(e.target.value)}
              className="cyber-input"
              style={styles.filterDropdown}
            >
              <option>All Crime Types</option>
              {CRIME_TYPES.map(c => <option key={c}>{c}</option>)}
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

            <select 
              value={selectedCompensation} 
              onChange={e => setSelectedCompensation(e.target.value)}
              className="cyber-input"
              style={styles.filterDropdown}
            >
              <option>All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Disbursed">Disbursed</option>
            </select>

            <select 
              value={selectedGender} 
              onChange={e => setSelectedGender(e.target.value)}
              className="cyber-input"
              style={styles.filterDropdown}
            >
              <option>All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <button type="submit" className="cyber-btn" style={{ padding: '0 20px', height: '34px' }}>
              <span>APPLY</span>
            </button>
          </div>
        </form>
      </div>

      {/* VICTIM TABLE */}
      <div className="chart-card" style={styles.tableCard}>
        {victims.length === 0 ? (
          <div style={styles.emptyState}>NO RECORDS FOUND</div>
        ) : (
          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>VICTIM ID</th>
                  <th>CASE ID</th>
                  <th>CRIME TYPE</th>
                  <th>DISTRICT</th>
                  <th>SEVERITY</th>
                  <th>COMPENSATION</th>
                  <th>FOLLOW UP</th>
                  <th style={{ textAlign: 'right' }}>PROFILE ACTION</th>
                </tr>
              </thead>
              <tbody>
                {victims.map(v => (
                  <tr key={v.VictimID}>
                    <td className="mono" style={{ color: '#00e5ff', fontWeight: 'bold' }}>{v.VictimID}</td>
                    <td className="mono">{v.CaseID}</td>
                    <td>{v.CrimeType}</td>
                    <td>{v.District}</td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: `${getInjuryColor(v.InjurySeverity)}10`,
                          color: getInjuryColor(v.InjurySeverity),
                          borderColor: `${getInjuryColor(v.InjurySeverity)}20`
                        }}
                      >
                        {v.InjurySeverity}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: getCompensationColor(v.CompensationStatus), fontWeight: 'bold' }}>
                        ● {v.CompensationStatus}
                      </span>
                    </td>
                    <td className="mono">{v.FollowUpDate}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="cyber-btn-outline" 
                        onClick={() => setSelectedVictim(v)}
                        style={{ padding: '3px 8px', fontSize: '9px' }}
                      >
                        <span>VIEW PROFILE</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SUMMARY CHART */}
      <div className="chart-card" style={styles.chartCard}>
        <div className="chart-header">
          <span className="chart-title">VICTIM SUPPORT STATUS BY CRIME TYPE</span>
        </div>
        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
              <XAxis dataKey="crime_type" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
              <YAxis stroke="#8a9ba8" tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={styles.chartTooltip} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Disbursed" stackId="a" fill="#00ff88" barSize={35} />
              <Bar dataKey="Approved" stackId="a" fill="#00e5ff" />
              <Bar dataKey="Pending" stackId="a" fill="#ffaa00" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PROFILE DETAILS MODAL */}
      {selectedVictim && (
        <div style={styles.modalOverlay}>
          <div className="chart-card" style={styles.modalContainer}>
            <div className="chart-header" style={{ borderBottom: '1px solid #1e2d3d', paddingBottom: '10px' }}>
              <span className="chart-title" style={{ color: '#00e5ff' }}>VICTIM PROFILE — {selectedVictim.VictimID}</span>
              <button className="cyber-btn-outline" onClick={() => setSelectedVictim(null)} style={{ padding: '3px 8px', fontSize: '9px' }}>
                CLOSE
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                {/* Left side details */}
                <div style={styles.modalLeftCol}>
                  <div style={styles.avatarRow}>
                    <div style={styles.avatarCircle}>
                      <User size={30} color="#00e5ff" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>{selectedVictim.Name}</h4>
                      <span className="mono" style={{ fontSize: '9px', color: '#4f616d' }}>{selectedVictim.VictimID}</span>
                    </div>
                  </div>

                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>AGE & GENDER</span>
                    <span style={styles.infoValue}>{selectedVictim.Age} Years / {selectedVictim.Gender}</span>
                  </div>

                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>DISTRICT JURISDICTION</span>
                    <span style={styles.infoValue}>{selectedVictim.District}</span>
                  </div>

                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>INJURY SEVERITY RATING</span>
                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: `${getInjuryColor(selectedVictim.InjurySeverity)}15`,
                        color: getInjuryColor(selectedVictim.InjurySeverity),
                        display: 'inline-block',
                        marginTop: '4px',
                        width: 'fit-content'
                      }}
                    >
                      {selectedVictim.InjurySeverity.toUpperCase()}
                    </span>
                  </div>

                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>ASSOCIATED CASE COMPLAINT</span>
                    <span 
                      className="mono" 
                      onClick={() => {
                        if (onNavigateToCase) {
                          onNavigateToCase(selectedVictim.CaseID);
                          setSelectedVictim(null);
                        }
                      }}
                      style={{ color: '#00e5ff', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
                    >
                      {selectedVictim.CaseID}
                    </span>
                  </div>
                </div>

                {/* Right side checklist & Stepper */}
                <div style={styles.modalRightCol}>
                  {/* SUPPORT CHECKLIST */}
                  <div style={styles.checklistGroup}>
                    <span style={styles.infoLabel}>SUPPORT SERVICES CHECKLIST</span>
                    <div style={styles.checklist}>
                      {["Medical Assistance", "Legal Aid", "Counselling", "Compensation Filed", "Safe House"].map(srv => {
                        const isAssigned = selectedVictim.SupportServicesAssigned.includes(srv);
                        return (
                          <label key={srv} style={styles.checkLabel}>
                            <input 
                              type="checkbox" 
                              checked={isAssigned}
                              disabled={updating}
                              onChange={() => {
                                const newServices = isAssigned
                                  ? selectedVictim.SupportServicesAssigned.filter(s => s !== srv)
                                  : [...selectedVictim.SupportServicesAssigned, srv];
                                handleUpdateVictimProfile({ support_services: newServices });
                              }}
                              style={{ marginRight: '6px', accentColor: '#00e5ff' }}
                            />
                            {srv}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* COMPENSATION TRACKER */}
                  <div style={styles.trackerGroup}>
                    <span style={styles.infoLabel}>COMPENSATION STATUS STEPPER</span>
                    <div style={styles.stepper}>
                      {["Applied", "Verified", "Approved", "Disbursed"].map((step, idx) => {
                        const statusesMap = { Applied: "Pending", Verified: "Pending", Approved: "Approved", Disbursed: "Disbursed" };
                        const compStatus = selectedVictim.CompensationStatus;
                        
                        let isActive = false;
                        if (compStatus === "Pending" && (step === "Applied" || step === "Verified")) isActive = true;
                        if (compStatus === "Approved" && (step === "Applied" || step === "Verified" || step === "Approved")) isActive = true;
                        if (compStatus === "Disbursed") isActive = true;

                        return (
                          <div 
                            key={step} 
                            style={{ 
                              ...styles.stepNode, 
                              color: isActive ? '#00e5ff' : '#4f616d',
                              fontWeight: compStatus === step ? 'bold' : 'normal'
                            }}
                            onClick={() => {
                              // Map step click to compensation update
                              let newCompStatus = "Pending";
                              if (step === "Approved") newCompStatus = "Approved";
                              if (step === "Disbursed") newCompStatus = "Disbursed";
                              handleUpdateVictimProfile({ compensation_status: newCompStatus });
                            }}
                          >
                            <div style={{
                              ...styles.stepperDot,
                              backgroundColor: isActive ? '#00e5ff' : '#070a12',
                              border: `1px solid ${isActive ? '#00e5ff' : '#1e2d3d'}`
                            }} />
                            <span style={{ fontSize: '9px', marginTop: '4px' }}>{step.toUpperCase()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* FOLLOW UP SCHEDULE */}
                  <div style={styles.followupGroup}>
                    <span style={styles.infoLabel}>FOLLOW-UP SCHEDULE</span>
                    <div style={{ fontSize: '11px', color: '#fff', marginTop: '4px' }}>
                      Next date: <strong>{selectedVictim.FollowUpDate}</strong>
                    </div>
                    <button 
                      className="cyber-btn"
                      disabled={updating || selectedVictim.VictimStatus === "Closed"}
                      onClick={() => handleUpdateVictimProfile({ status: "Closed" })}
                      style={{ width: '100%', padding: '6px', fontSize: '10px', marginTop: '10px' }}
                    >
                      {selectedVictim.VictimStatus === "Closed" ? "FOLLOW-UP COMPLETED" : "MARK FOLLOW-UP COMPLETE"}
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
    width: '620px',
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
    gap: '16px',
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  avatarCircle: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  checklistGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    padding: '10px',
  },
  checkLabel: {
    fontSize: '11px',
    color: '#c4d1db',
    fontFamily: 'monospace',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  trackerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  stepper: {
    display: 'flex',
    justifyContent: 'space-between',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    padding: '10px',
  },
  stepNode: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    flex: 1,
  },
  stepperDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  followupGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
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

export default VictimRegistry;
