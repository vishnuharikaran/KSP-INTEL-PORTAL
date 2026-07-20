import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, CartesianGrid 
} from 'recharts';
import { 
  ShieldAlert, FileText, CheckCircle, Clock, 
  AlertTriangle, Users, TrendingUp, Target, Eye, Lock, Shield 
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

function DistrictStats() {
  const [selectedDistrict, setSelectedDistrict] = useState("Bengaluru Urban");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Prime Time Alert Modal state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertPassword, setAlertPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [greenFlash, setGreenFlash] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [shakeInput, setShakeInput] = useState(false);

  // Suspect Dossier Modal State
  const [selectedOffenderId, setSelectedOffenderId] = useState(null);
  const [offenderDossier, setOffenderDossier] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const fetchDistrictStats = async (districtName) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/district-stats?district=${encodeURIComponent(districtName)}`);
      if (!res.ok) throw new Error("Failed to fetch district statistics.");
      const json = await res.json();
      setData(json);
      
      // Auto open prime time alert modal on load
      setAlertPassword("");
      setPasswordError("");
      setGreenFlash(false);
      setShowAlertModal(true);
    } catch (err) {
      setError(err.message || "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistrictStats(selectedDistrict);
  }, [selectedDistrict]);

  // Modals Escape Listener
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setShowAlertModal(false);
        setSelectedOffenderId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
  };

  const handleExport = () => {
    window.print();
  };

  const handleAcknowledgeAlert = (e) => {
    e.preventDefault();
    if (alertPassword === "KSP2026") {
      setGreenFlash(true);
      setToastMsg("Alert acknowledged — logged");
      setTimeout(() => {
        setShowAlertModal(false);
        setGreenFlash(false);
        setToastMsg("");
      }, 1000);
    } else {
      setPasswordError("INVALID AUTHORIZATION CODE");
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 400);
    }
  };

  // Open Dossier Modal
  const openDossier = async (offenderId) => {
    setSelectedOffenderId(offenderId);
    setLoadingDossier(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/suspects/search?q=${encodeURIComponent(offenderId)}`);
      if (res.ok) {
        const suspects = await res.json();
        if (suspects && suspects.length > 0) {
          setOffenderDossier(suspects[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDossier(false);
    }
  };

  const closeDossier = () => {
    setSelectedOffenderId(null);
    setOffenderDossier(null);
  };

  if (loading && !data) {
    return (
      <div style={styles.centeredState}>
        <div style={styles.loader}></div>
        <div style={{ color: '#00e5ff', fontFamily: 'monospace', fontSize: '11px', marginTop: '12px' }}>
          FETCHING DISTRICT STATS...
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

  const { overview, monthly_chart, temporal_hour, peak_hour, temporal_day, hotspots, age_chart, repeat_chart, top_offenders, comparison, mom_table } = data;

  // Day of week peak color styling
  const maxDayCount = Math.max(...temporal_day.map(d => d.count));
  const peakDayName = temporal_day.sort((a,b) => b.count - a.count)[0]?.day || "Wednesday";
  const peakHourStr = temporal_hour[peak_hour]?.hour || "12:00";
  const topCrimeType = data.crime_mix && data.crime_mix.length > 0
    ? [...data.crime_mix].sort((a,b) => b.value - a.value)[0]?.name
    : "UPI Fraud";

  // Calculate next hour for risk window
  const startH = parseInt(peakHourStr.split(":")[0]);
  const endH = (startH + 2) % 24;
  const endHourStr = `${String(endH).padStart(2, '0')}:00`;

  // Custom Bar for Day of week distribution to highlight peak day in red
  const CustomDayBar = (props) => {
    const { fill, x, y, width, height, count } = props;
    const isPeak = count === maxDayCount;
    return <rect x={x} y={y} width={width} height={height} fill={isPeak ? '#ff2d55' : '#00e5ff'} />;
  };

  return (
    <div style={styles.container}>
      {toastMsg && (
        <div style={styles.toast}>
          <CheckCircle size={14} style={{ marginRight: '6px' }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Print-only stylesheet */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .sidebar, .top-bar, .breadcrumb, .app-footer, .no-print {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .print-header {
            display: block !important;
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .chart-card {
            background: #ffffff !important;
            border: 1px solid #cccccc !important;
            page-break-inside: avoid;
            margin-bottom: 20px !important;
            box-shadow: none !important;
          }
          .stat-card {
            background: #f9f9f9 !important;
            border: 1px solid #cccccc !important;
            color: #000000 !important;
          }
          .stat-value {
            color: #000000 !important;
          }
          .cyber-table th {
            background: #f0f0f0 !important;
            color: #000000 !important;
          }
          .cyber-table td {
            color: #000000 !important;
            border-bottom: 1px solid #dddddd !important;
          }
        }
        .print-header {
          display: none;
        }
      `}</style>

      {/* PRINT HEADER */}
      <div className="print-header">
        <h2 style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>KARNATAKA STATE POLICE</h2>
        <h3 style={{ fontFamily: 'monospace', color: '#555' }}>KSP DISTRICT INTELLIGENCE REPORT — {selectedDistrict.toUpperCase()}</h3>
        <p style={{ fontSize: '10px', color: '#777' }}>Generated: {new Date().toLocaleString()} IST</p>
      </div>

      {/* TOP — DISTRICT SELECTOR */}
      <div className="chart-card no-print" style={styles.selectorCard}>
        <div style={styles.selectorGrid}>
          <div style={styles.selectCol}>
            <label style={styles.selectorLabel}>SELECT DISTRICT TO ANALYSE</label>
            <select 
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="cyber-input"
              style={{ width: '100%', height: '38px', background: '#070a12', border: '1px solid #1e2d3d', color: '#fff', padding: '0 8px' }}
            >
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={styles.actionCol}>
            <button className="cyber-btn" onClick={handleExport} style={{ height: '38px', width: '100%', marginTop: '18px' }}>
              <FileText size={14} style={{ marginRight: '6px' }} />
              <span>EXPORT DISTRICT REPORT</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION A — DISTRICT OVERVIEW STRIP */}
      <div className="stats-grid">
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">TOTAL CASES REGISTERED</div>
          <div className="stat-value">{overview.total_cases.toLocaleString()}</div>
          <div className="stat-subtitle">District Complaints Registry</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">CASES RESOLVED</div>
          <div className="stat-value" style={{ color: '#00ff88' }}>{overview.resolved.toLocaleString()}</div>
          <div className="stat-subtitle">Status: Closed / Arrested</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">ACTIVE INVESTIGATIONS</div>
          <div className="stat-value" style={{ color: '#ffaa00' }}>{overview.active.toLocaleString()}</div>
          <div className="stat-subtitle">Under active investigation</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">REPEAT OFFENDERS COUNT</div>
          <div className="stat-value" style={{ color: '#ff2d55' }}>{overview.repeat_offenders.toLocaleString()}</div>
          <div className="stat-subtitle">Suspects with priors &gt; 1</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">AVERAGE LOSS AMOUNT</div>
          <div className="stat-value" style={{ color: '#00e5ff' }}>₹{overview.avg_loss.toLocaleString()}</div>
          <div className="stat-subtitle">Cybercrime & fraud cases</div>
        </div>
      </div>

      {/* SECTION B — CRIME BREAKDOWN (Monthly logs taking full-width now) */}
      <div className="chart-card" style={styles.fullWidthCard}>
        <div className="chart-header">
          <span className="chart-title">MONTHLY INCIDENT LOGS (LAST 12 MONTHS)</span>
        </div>
        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly_chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="month" stroke="#8a9ba8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#8a9ba8" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={styles.chartTooltip} />
              <Bar dataKey="cases" fill="#00e5ff" barSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION C — TEMPORAL ANALYSIS */}
      <div className="chart-card" style={styles.fullWidthCard}>
        <div className="chart-header">
          <span className="chart-title">TEMPORAL INCIDENT DISTRIBUTION</span>
        </div>
        <div style={styles.chartRow}>
          <div style={styles.halfWidthCard}>
            <div style={styles.subChartTitle}>INCIDENT DENSITY BY TIME OF DAY</div>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={temporal_hour} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                  <XAxis dataKey="hour" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={styles.chartTooltip} />
                  <Area type="monotone" dataKey="count" stroke="#00e5ff" fill="rgba(0, 229, 255, 0.15)" />
                  <ReferenceLine x={temporal_hour[peak_hour]?.hour} stroke="#ff2d55" label={{ value: `PEAK: ${temporal_hour[peak_hour]?.hour}`, fill: '#ff2d55', position: 'top', fontSize: 9 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.halfWidthCard}>
            <div style={styles.subChartTitle}>RISK PROFILE BY DAY OF WEEK</div>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={temporal_day} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                  <XAxis dataKey="day" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={styles.chartTooltip} />
                  <Bar dataKey="count" shape={<CustomDayBar />} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION D — CRIME HOTSPOT POLICE STATIONS */}
      <div className="chart-card" style={styles.fullWidthCard}>
        <div className="chart-header">
          <span className="chart-title">CRIME HOTSPOT POLICE STATIONS (TOP 5)</span>
        </div>
        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>STATION NAME</th>
                <th>TOTAL CASES</th>
                <th>UNRESOLVED</th>
                <th>TOP CRIME TYPE</th>
                <th>RESOLVED</th>
                <th>DEPLOYMENT STATUS</th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map((row, idx) => {
                const badgeColor = row.status === "OVERLOADED" ? "#ff2d55" : row.status === "ACTIVE" ? "#ffaa00" : "#00ff88";
                const unresolvedCount = row.cases - row.resolved;
                const unresolvedPct = row.cases > 0 ? Math.round((unresolvedCount / row.cases) * 100) : 0;
                const unresolvedColor = unresolvedCount > 20 ? '#ff2d55' : unresolvedCount >= 10 ? '#ffaa00' : '#ffffff';

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 'bold' }}>{row.station}</td>
                    <td className="mono">{row.cases}</td>
                    <td className="mono" style={{ color: unresolvedColor, fontWeight: 'bold' }}>
                      {unresolvedCount}
                      <span style={{ fontSize: '9px', color: '#8a9ba8', marginLeft: '4px', fontWeight: 'normal' }}>({unresolvedPct}%)</span>
                    </td>
                    <td>{row.top_crime}</td>
                    <td className="mono">{row.resolved}</td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: `${badgeColor}15`, 
                          color: badgeColor, 
                          borderColor: `${badgeColor}30` 
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION E — OFFENDER PROFILE SUMMARY */}
      <div style={styles.chartRow}>
        <div className="chart-card" style={styles.halfWidthCard}>
          <div className="chart-header">
            <span className="chart-title">OFFENDER AGE DISTRIBUTION</span>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={age_chart} margin={{ left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                <XAxis dataKey="group" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                <YAxis stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={styles.chartTooltip} />
                <Bar dataKey="count" fill="#bf5af2" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card" style={styles.halfWidthCard}>
          <div className="chart-header">
            <span className="chart-title">REPEAT OFFENDER BREAKDOWN</span>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repeat_chart} margin={{ left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
                <XAxis dataKey="name" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                <YAxis stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={styles.chartTooltip} />
                <Bar dataKey="value" fill="#00ff88" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION F — TOP 5 ACTIVE OFFENDERS IN DISTRICT */}
      <div className="chart-card" style={styles.fullWidthCard}>
        <div className="chart-header">
          <span className="chart-title">TOP 5 ACTIVE OFFENDERS IN DISTRICT</span>
        </div>
        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>OFFENDER ID</th>
                <th>PRIMARY CRIME TYPE</th>
                <th>MODUS OPERANDI</th>
                <th>PRIOR CONVICTIONS</th>
                <th>CASE STATUS</th>
                <th style={{ textAlign: 'right' }}>DOSSIER ACTION</th>
              </tr>
            </thead>
            <tbody>
              {top_offenders.map((offender, idx) => (
                <tr key={idx}>
                  <td className="mono" style={{ color: '#00e5ff', fontWeight: 'bold' }}>{offender.offender_id}</td>
                  <td>{offender.crime_type}</td>
                  <td style={{ fontSize: '11px', color: '#8a9ba8' }}>{offender.mo}</td>
                  <td className="mono">{offender.prior_convictions}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'rgba(255, 45, 85, 0.1)', color: '#ff2d55', borderColor: 'rgba(255, 45, 85, 0.2)' }}>
                      {offender.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="cyber-btn-outline" onClick={() => openDossier(offender.offender_id)} style={{ padding: '3px 8px', fontSize: '9px' }}>
                      <Eye size={10} style={{ marginRight: '4px' }} />
                      <span>VIEW DOSSIER</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION G — DISTRICT COMPARISON */}
      <div className="chart-card" style={styles.fullWidthCard}>
        <div className="chart-header">
          <span className="chart-title">HOW DOES THIS DISTRICT COMPARE (STATE AVERAGE)?</span>
        </div>
        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparison}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis type="number" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
              <YAxis dataKey="metric" type="category" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={styles.chartTooltip} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="district_val" name="District" fill="#00e5ff" />
              <Bar dataKey="state_avg" name="State Avg" fill="#ffaa00" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SUSPECT DOSSIER MODAL */}
      {selectedOffenderId && offenderDossier && (
        <div style={styles.modalOverlay}>
          <div className="chart-card" style={styles.modalContainer}>
            <div className="chart-header" style={{ borderBottom: '1px solid #1e2d3d', paddingBottom: '10px' }}>
              <span className="chart-title" style={{ color: '#00e5ff' }}>SUSPECT DOSSIER — {selectedOffenderId}</span>
              <button className="cyber-btn-outline" onClick={closeDossier} style={{ padding: '3px 8px', fontSize: '9px' }}>
                CLOSE
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                <div style={styles.modalLeftCol}>
                  <div style={styles.modalInfoGroup}>
                    <span style={styles.modalInfoLabel}>SUSPECT NAME</span>
                    <span style={styles.modalInfoValue}>{offenderDossier.Name}</span>
                  </div>
                  <div style={styles.modalInfoGroup}>
                    <span style={styles.modalInfoLabel}>PHONE NUMBER</span>
                    <span style={styles.modalInfoValue} className="mono">{offenderDossier.AccusedPhone}</span>
                  </div>
                  <div style={styles.modalInfoGroup}>
                    <span style={styles.modalInfoLabel}>THREAT RISK LEVEL</span>
                    <span className="badge" style={{ backgroundColor: 'rgba(255, 45, 85, 0.15)', color: '#ff2d55' }}>
                      {offenderDossier.RiskLevel} (SCORE: {offenderDossier.RiskScore})
                    </span>
                  </div>
                  <div style={styles.modalInfoGroup}>
                    <span style={styles.modalInfoLabel}>MODUS OPERANDI</span>
                    <p style={{ color: '#8a9ba8', fontSize: '11px', margin: '4px 0' }}>{offenderDossier.MO}</p>
                  </div>
                </div>
                <div style={styles.modalRightCol}>
                  <div style={styles.modalInfoGroup}>
                    <span style={styles.modalInfoLabel}>PRIOR CONVICTIONS</span>
                    <span style={styles.modalInfoValue}>{offenderDossier.PriorConvictions} Cases</span>
                  </div>
                  <div style={styles.modalInfoGroup}>
                    <span style={styles.modalInfoLabel}>ACTIVE JURISDICTIONS</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {offenderDossier.Districts.map(d => (
                        <span key={d} className="badge" style={{ backgroundColor: 'rgba(0,229,255,0.08)', color: '#00e5ff' }}>{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRIME TIME ALERTS POPUP MODAL */}
      {showAlertModal && (
        <div style={styles.modalOverlay}>
          <div 
            className="chart-card" 
            style={{ 
              ...styles.alertModalContainer,
              borderTop: greenFlash ? '3px solid #00ff88' : '3px solid #ff2d55',
              position: 'relative'
            }}
          >
            {/* Close button Escape and manual */}
            <button 
              onClick={() => setShowAlertModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontSize: '16px',
                outline: 'none'
              }}
              title="Close modal (Esc)"
            >
              ✕
            </button>

            <Shield size={32} color={greenFlash ? "#00ff88" : "#ff2d55"} style={{ display: 'block', margin: '0 auto 12px auto' }} />
            
            <div style={styles.alertHeader}>
              <AlertTriangle size={18} color={greenFlash ? "#00ff88" : "#ff2d55"} />
              <span style={styles.alertTitle}>PRIME TIME INTELLIGENCE ALERT</span>
            </div>
            <h3 style={styles.alertDistrictName}>{selectedDistrict.toUpperCase()}</h3>
            
            <div style={styles.alertDivider}></div>
            
            <div style={styles.alertDetailsGrid}>
              <div style={styles.alertDetailRow}>
                <span style={styles.alertLabel}>PEAK CRIME DAY:</span>
                <span style={styles.alertVal}>{peakDayName.toUpperCase()}</span>
              </div>
              <div style={styles.alertDetailRow}>
                <span style={styles.alertLabel}>PEAK CRIME HOUR:</span>
                <span style={styles.alertVal}>{peakHourStr} – {endHourStr}</span>
              </div>
              <div style={styles.alertDetailRow}>
                <span style={styles.alertLabel}>CRIME TYPE PEAK:</span>
                <span style={styles.alertVal}>{topCrimeType.toUpperCase()}</span>
              </div>
              <div style={styles.alertDetailRow}>
                <span style={styles.alertLabel}>RISK WINDOW:</span>
                <span style={{ ...styles.alertVal, color: '#ff2d55' }}>
                  {peakDayName.toUpperCase()} {peakHourStr}–{endHourStr}
                </span>
              </div>
            </div>

            <div style={styles.alertDivider}></div>

            <p style={styles.alertWarningText}>
              This intelligence is CONFIDENTIAL. Enter authorization code to acknowledge.
            </p>

            <form onSubmit={handleAcknowledgeAlert} style={styles.alertForm}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input 
                  type="password"
                  value={alertPassword}
                  onChange={e => {
                    setAlertPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="ENTER ACCESS AUTH CODE..."
                  className={`cyber-input ${shakeInput ? 'shake-input' : ''}`}
                  style={{
                    ...styles.alertInput,
                    fontFamily: 'var(--font-mono)',
                    borderColor: passwordError ? '#ff2d55' : greenFlash ? '#00ff88' : '#1e2d3d'
                  }}
                />
                {passwordError && <span style={styles.errorText}>{passwordError}</span>}
              </div>

              <button type="submit" className="cyber-btn" style={styles.alertBtn}>
                ACKNOWLEDGE & CLOSE
              </button>
            </form>
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
  selectorCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    padding: '16px 20px',
  },
  selectorGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '20px',
    alignItems: 'center',
  },
  selectCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  actionCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  selectorLabel: {
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#8a9ba8',
    letterSpacing: '0.5px',
  },
  statCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
  },
  chartRow: {
    display: 'flex',
    gap: '20px',
    width: '100%',
  },
  halfWidthCard: {
    flex: 1,
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    padding: '16px',
    minWidth: 0,
  },
  fullWidthCard: {
    width: '100%',
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    padding: '20px',
  },
  subChartTitle: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#ffffff',
    marginBottom: '10px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  chartTooltip: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    fontSize: '10px',
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
    width: '540px',
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    borderTop: '2px solid #00e5ff',
    padding: '20px',
  },
  modalBody: {
    marginTop: '15px',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  modalLeftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  modalRightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  modalInfoGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  modalInfoLabel: {
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#4f616d',
    letterSpacing: '0.5px',
  },
  modalInfoValue: {
    fontSize: '12px',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  alertModalContainer: {
    width: '480px',
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    padding: '24px',
    boxShadow: '0 0 30px rgba(255, 45, 85, 0.1)',
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#ff2d55',
  },
  alertTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  alertDistrictName: {
    fontSize: '18px',
    color: '#ffffff',
    margin: '10px 0 0 0',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 'bold',
  },
  alertDivider: {
    height: '1px',
    background: '#1e2d3d',
    margin: '14px 0',
  },
  alertDetailsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  alertDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  alertLabel: {
    color: '#8a9ba8',
  },
  alertVal: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  alertWarningText: {
    fontSize: '10px',
    color: '#4f616d',
    fontFamily: 'monospace',
    textAlign: 'center',
    margin: '16px 0 8px 0',
  },
  alertForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  alertInput: {
    height: '36px',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: '12px',
    outline: 'none',
    width: '100%',
  },
  alertBtn: {
    height: '36px',
    background: '#ff2d55',
    border: '1px solid #ff2d55',
    color: '#0d1117',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    cursor: 'pointer',
    fontSize: '11px',
  },
  errorText: {
    fontSize: '9px',
    color: '#ff2d55',
    fontFamily: 'monospace',
    textAlign: 'center',
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
    boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
    zIndex: 9999
  }
};

export default DistrictStats;
