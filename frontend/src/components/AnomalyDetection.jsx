import React, { useEffect, useState } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis,
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  ResponsiveContainer 
} from 'recharts';
import { ShieldAlert, AlertOctagon, HelpCircle, FileText, CheckCircle, ArrowRight, UserCheck } from 'lucide-react';

function AnomalyDetection({ flaggedCases = [], addFlaggedCase, scrbEscalations = [], addScrbEscalation }) {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal & Toast States
  const [selectedCase, setSelectedCase] = useState(null);
  const [similarCases, setSimilarCases] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Banners
  const [flaggedBanner, setFlaggedBanner] = useState("");
  const [escalatedBanner, setEscalatedBanner] = useState("");

  // Fetch anomalies
  useEffect(() => {
    const fetchAnomalyData = async () => {
      try {
        const anomalyRes = await fetch('http://127.0.0.1:8000/api/anomaly/flagged');
        if (!anomalyRes.ok) {
          throw new Error('Failed to query scikit-learn anomaly logs.');
        }
        const anomalyData = await anomalyRes.json();
        setAnomalies(anomalyData);
      } catch (err) {
        setError(err.message || 'Error communicating with anomaly engine.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalyData();
  }, []);

  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Find 3 similar past cases in the dataset (same crime_type + district)
  const loadCaseDetails = async (c) => {
    setSelectedCase(c);
    setSimilarCases([]);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/complaints?district=${encodeURIComponent(c.district)}&crime_type=${encodeURIComponent(c.crime_type)}&limit=4`
      );
      if (response.ok) {
        const data = await response.json();
        // Filter out current case if in list
        const filtered = data.records.filter((r) => r.id !== c.case_id).slice(0, 3);
        setSimilarCases(filtered);
      }
    } catch (err) {
      console.error("Failed to load similar cases", err);
    }
  };

  const getAlertColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return '#8b0000'; // Dark Red
      case 'HIGH': return '#ff9500'; // Orange
      case 'MEDIUM': return '#34c759'; // Green
      default: return '#8a9ba8';
    }
  };

  const handleFlagForReview = () => {
    if (!selectedCase) return;
    const caseToFlag = {
      id: selectedCase.case_id,
      crime_type: selectedCase.crime_type,
      district: selectedCase.district,
      reason: selectedCase.reason,
      flaggedAt: new Date().toLocaleTimeString()
    };
    addFlaggedCase(caseToFlag);
    setFlaggedBanner(`CASE ${selectedCase.case_id} FLAGGED FOR REGIONAL REVIEW — LOGGED IN STATE`);
    showToast(`Case ${selectedCase.case_id} flagged for review.`);
    setSelectedCase(null);
  };

  const handleEscalateToSCRB = () => {
    if (!selectedCase) return;
    const autoId = Math.floor(100000 + Math.random() * 900000);
    const refNo = `SCRB/2026/${autoId}`;
    const caseToEscalate = {
      id: selectedCase.case_id,
      scrbRef: refNo,
      crime_type: selectedCase.crime_type,
      district: selectedCase.district,
      reason: selectedCase.reason,
      escalatedAt: new Date().toLocaleTimeString()
    };
    addScrbEscalation(caseToEscalate);
    setEscalatedBanner(`CRITICAL ANOMALY ESCALATED TO SCRB. REF: ${refNo}`);
    showToast(`Escalated case ${selectedCase.case_id} to State Crime Records Bureau.`);
    setSelectedCase(null);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <div style={styles.loadingText}>RESOLVING ISOLATION FOREST MULTIVARIATE OUTLIERS...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorHeader}>ANOMALY CONVERGENCE REJECTED</div>
        <p>{error}</p>
      </div>
    );
  }

  const anomaliesPlot = anomalies.map(a => {
    const hr = parseInt(a.time_of_day.split(':')[0]);
    let size = 45;
    if (a.alert_level === 'CRITICAL') size = 120;
    else if (a.alert_level === 'HIGH') size = 80;
    else if (a.alert_level === 'MEDIUM') size = 45;

    return {
      x: hr,
      y: a.offender_age,
      z: size,
      label: a.case_id,
      level: a.alert_level
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '15px' }}>
      {/* SUCCESS NOTIFICATION BANNERS */}
      {flaggedBanner && (
        <div style={{ padding: '12px 20px', background: 'rgba(255, 170, 0, 0.15)', border: '1px solid #ffaa00', color: '#ffaa00', fontSize: '11px', fontFamily: 'monospace' }}>
          ⚠️ {flaggedBanner}
        </div>
      )}
      {escalatedBanner && (
        <div style={{ padding: '12px 20px', background: 'rgba(255, 45, 85, 0.15)', border: '1px solid #ff2d55', color: '#ff2d55', fontSize: '11px', fontFamily: 'monospace' }}>
          🚨 {escalatedBanner}
        </div>
      )}

      <div style={styles.container}>
        {/* Toast Notifications */}
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className="toast-notification">
              <CheckCircle size={16} />
              <span>{t.message}</span>
            </div>
          ))}
        </div>

        {/* Column 1: Live feed */}
        <div style={styles.leftCol}>
          <div className="chart-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="chart-header">
              <span className="chart-title">ISOLATION FOREST ANOMALY FEED</span>
              <span style={{ fontSize: '10px', color: '#ff2d55', fontFamily: 'monospace' }}>
                ● OUTLIER FILTER
              </span>
            </div>

            <div style={styles.scrollList}>
              {anomalies.map((a) => {
                const color = getAlertColor(a.alert_level);
                return (
                  <div key={a.case_id} style={styles.feedRow}>
                    {/* Left Badge */}
                    <div style={styles.badgeCol}>
                      {a.alert_level === 'CRITICAL' ? (
                        <span className="pulse-dot" style={{ backgroundColor: '#8b0000', boxShadow: '0 0 8px #8b0000' }}></span>
                      ) : (
                        <span style={{ ...styles.dot, backgroundColor: color }}></span>
                      )}
                      <span style={{ ...styles.badgeText, color: color }}>{a.alert_level}</span>
                    </div>

                    {/* Center Details */}
                    <div style={styles.feedDetails}>
                      <div className="mono" style={{ color: '#00e5ff', fontWeight: 'bold' }}>{a.case_id}</div>
                      <div style={styles.feedSummary}>
                        {a.crime_type} | {a.district} | {a.time_of_day}
                      </div>
                      <div style={styles.feedReason} className="mono">
                        MO: {a.reason}
                      </div>
                    </div>

                    {/* Right Button */}
                    <button 
                      className="cyber-btn-outline" 
                      style={styles.investBtn}
                      onClick={() => loadCaseDetails(a)}
                    >
                      INVESTIGATE
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Column 2: Scatter Plot */}
        <div style={styles.rightCol}>
          <div className="chart-card" style={{ height: '100%' }}>
            <div className="chart-header">
              <span className="chart-title">BEHAVIORAL MULTIVARIATE SCATTER PLOT</span>
            </div>

            <div style={{ height: '340px', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke="#1a2a3a" strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Time of Day" 
                    unit="h" 
                    domain={[0, 24]} 
                    stroke="#00e5ff"
                    style={{ fontFamily: 'monospace', fontSize: '10px' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Offender Age" 
                    unit="y" 
                    domain={[15, 70]} 
                    stroke="#00e5ff"
                    style={{ fontFamily: 'monospace', fontSize: '10px' }}
                  />
                  <ZAxis 
                    type="number" 
                    dataKey="z" 
                    range={[45, 120]} 
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    contentStyle={{
                      backgroundColor: '#0a0d14',
                      border: '1px solid #1a2a3a',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  
                  {/* Critical anomalies series */}
                  <Scatter 
                    name="Critical Outlier" 
                    data={anomaliesPlot.filter(a => a.level === 'CRITICAL')} 
                    fill="#8b0000" 
                    shape="circle" 
                  />

                  {/* High anomalies series */}
                  <Scatter 
                    name="High Outlier" 
                    data={anomaliesPlot.filter(a => a.level === 'HIGH')} 
                    fill="#ff9500" 
                    shape="circle" 
                  />

                  {/* Medium anomalies series */}
                  <Scatter 
                    name="Medium Outlier" 
                    data={anomaliesPlot.filter(a => a.level === 'MEDIUM')} 
                    fill="#34c759" 
                    shape="circle" 
                  />

                  {/* Guidelines */}
                  <ReferenceLine x={22} stroke="#ff2d55" strokeDasharray="3 3" label={{ value: "Night Hours", fill: "#ff2d55", fontSize: 9, position: 'top' }} />
                  <ReferenceLine y={25} stroke="#ff9500" strokeDasharray="3 3" label={{ value: "Youth Range", fill: "#ff9500", fontSize: 9, position: 'right' }} />
                  
                  <Legend style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            
            <div style={styles.chartInstructions} className="mono">
              * Reference lines highlight critical vectors: Late-night operations (X &gt;= 22h) and young offender clusters (Y &lt;= 25y).
            </div>
          </div>
        </div>

        {/* Case Details Modal */}
        {selectedCase && (
          <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
            <div className="cyber-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">ANOMALOUS DOSSIER DECRYPTION // {selectedCase.case_id}</span>
                <button className="modal-close-btn" onClick={() => setSelectedCase(null)}>×</button>
              </div>

              <div className="modal-content">
                {/* Anomaly score gauge */}
                <div className="gauge-container">
                  <span className="stat-label" style={{ color: '#ff2d55', fontWeight: 'bold' }}>
                    ANOMALY INTENSITY SCORE: {selectedCase.anomaly_score}
                  </span>
                  <div className="gauge-track">
                    <div 
                      className="gauge-bar" 
                      style={{ 
                        width: `${Math.abs(selectedCase.anomaly_score) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="gauge-labels">
                    <span>0.0 (NORMAL)</span>
                    <span>-0.5 (MEDIUM RISK)</span>
                    <span>-1.0 (EXTREME OUTLIER)</span>
                  </div>
                </div>

                {/* AI Explanation Box */}
                <div className="ai-explanation-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00e5ff', marginBottom: '8px', fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace' }}>
                    <AlertOctagon size={14} />
                    <span>NEURAL ALIGNMENT REASONING LOG</span>
                  </div>
                  This case deviates significantly from baseline behavioral models because: 
                  <b style={{ color: '#00e5ff', marginLeft: '4px' }}>{selectedCase.reason}</b>.
                </div>

                {/* Full details grid */}
                <div style={styles.modalDetailsGrid} className="mono">
                  <div style={styles.gridRow}>
                    <span>VICTIM DISTRICT:</span>
                    <span>{selectedCase.district}</span>
                  </div>
                  <div style={styles.gridRow}>
                    <span>CRIME VECTOR:</span>
                    <span>{selectedCase.crime_type}</span>
                  </div>
                  <div style={styles.gridRow}>
                    <span>TIME OF LOGGING:</span>
                    <span>{selectedCase.time_of_day} HRS</span>
                  </div>
                  <div style={styles.gridRow}>
                    <span>OFFENDER PROFILE AGE:</span>
                    <span>{selectedCase.offender_age} YRS</span>
                  </div>
                </div>

                {/* 3 Similar Past Cases */}
                <div style={{ marginTop: '20px' }}>
                  <div style={styles.subHeader}>HISTORICAL RELATIONSHIPS (SAME TYPE + DISTRICT)</div>
                  {similarCases.length === 0 ? (
                    <div style={styles.emptySimilar}>No similar cases located in search parameters.</div>
                  ) : (
                    <table className="cyber-table" style={{ fontSize: '11px' }}>
                      <thead>
                        <tr>
                          <th>CASE ID</th>
                          <th>DATE</th>
                          <th>PHONE</th>
                          <th style={{ textAlign: 'right' }}>LOSS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {similarCases.map((sc) => (
                          <tr key={sc.id}>
                            <td style={{ color: '#00e5ff', fontWeight: 'bold' }}>{sc.id}</td>
                            <td>{sc.date_of_incident}</td>
                            <td className="mono">{sc.accused_phone}</td>
                            <td className="mono" style={{ textAlign: 'right' }}>₹{sc.loss_amount_inr.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={styles.modalActions}>
                  <button 
                    className="cyber-btn-outline" 
                    onClick={handleFlagForReview}
                  >
                    FLAG FOR REVIEW
                  </button>
                  <button 
                    className="cyber-btn-outline"
                    style={{ color: '#ff9500', borderColor: '#ff9500' }}
                    onClick={handleEscalateToSCRB}
                  >
                    ESCALATE TO SCRB
                  </button>
                  <button 
                    className="cyber-btn"
                    style={{ backgroundColor: 'transparent', color: '#ff3b30', border: '1px solid #ff3b30' }}
                    onClick={() => {
                      showToast(`Dismissed anomaly alert for ${selectedCase.case_id}.`);
                      setSelectedCase(null);
                    }}
                  >
                    DISMISS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
  },
  loader: {
    width: '40px',
    height: '40px',
    border: '2px solid #1a2a3a',
    borderTop: '2px solid #00e5ff',
    marginBottom: '20px',
  },
  loadingText: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#8a9ba8',
    letterSpacing: '1.5px',
  },
  errorContainer: {
    padding: '24px',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    border: '1px solid #ff3b30',
    color: '#ff3b30',
    fontFamily: 'monospace',
    fontSize: '13px',
  },
  errorHeader: {
    fontWeight: 'bold',
    fontSize: '14px',
    marginBottom: '10px',
  },
  container: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '20px',
    height: 'calc(100vh - 128px)',
  },
  leftCol: {
    height: '100%',
    minHeight: 0,
  },
  scrollList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    flexGrow: 1,
  },
  feedRow: {
    backgroundColor: '#0a0d14',
    border: '1px solid #14202d',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
  },
  badgeCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '70px',
    flexShrink: 0,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  badgeText: {
    fontSize: '9px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  feedDetails: {
    flexGrow: 1,
    minWidth: 0,
  },
  feedSummary: {
    fontSize: '12px',
    color: '#ffffff',
    marginTop: '2px',
  },
  feedReason: {
    fontSize: '10px',
    color: '#8a9ba8',
    marginTop: '4px',
  },
  investBtn: {
    padding: '6px 12px',
    fontSize: '10px',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minHeight: 0,
  },
  chartInstructions: {
    fontSize: '9px',
    color: '#8a9ba8',
    marginTop: '12px',
    lineHeight: '1.4',
  },
  modalDetailsGrid: {
    backgroundColor: '#0a0d14',
    border: '1px solid #14202d',
    padding: '16px',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  gridRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#ffffff',
  },
  subHeader: {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#8a9ba8',
    textTransform: 'uppercase',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  emptySimilar: {
    padding: '16px',
    textAlign: 'center',
    backgroundColor: '#0a0d14',
    border: '1px solid #14202d',
    color: '#4f616d',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    justifyContent: 'flex-end',
  },
};

export default AnomalyDetection;
