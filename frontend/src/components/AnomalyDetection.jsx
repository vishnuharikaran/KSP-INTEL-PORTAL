import React, { useEffect, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
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

  // Modals Escape Listener
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setSelectedCase(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

  const scatterData = anomalies
    .filter(c => c && c.time_of_day !== undefined 
                 && c.offender_age !== undefined)
    .map(c => {
      let hr = 12;
      if (typeof c.time_of_day === 'string') {
        hr = Number(c.time_of_day.split(':')[0]);
      } else if (typeof c.time_of_day === 'number') {
        hr = c.time_of_day;
      }
      if (isNaN(hr)) hr = 12;

      return {
        x: hr,
        y: Number(c.offender_age),
        alertLevel: c.alert_level || 'MEDIUM',
        caseId: c.case_id,
        district: c.district,
        crimeType: c.crime_type,
        reason: c.reason,
        anomalyScore: Number(c.anomaly_score || 0)
      };
    });

  const getColor = (level) => {
    if (level === 'CRITICAL') return '#8B0000';
    if (level === 'HIGH')     return '#FF6B35';
    return '#00C851';
  };

  const getDotSize = (level) => {
    if (level === 'CRITICAL') return 10;
    if (level === 'HIGH')     return 7;
    return 5;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '15px' }}>
      {/* SUCCESS NOTIFICATION BANNERS */}
      {flaggedBanner && (
        <div style={{ padding: '12px 20px', background: 'var(--amber-bg)', border: '1px solid var(--amber)', color: 'var(--amber)', fontSize: '11px', fontFamily: 'monospace' }}>
          ⚠️ {flaggedBanner}
        </div>
      )}
      {escalatedBanner && (
        <div style={{ padding: '12px 20px', background: 'var(--red-bg)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', fontFamily: 'monospace' }}>
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
              <span style={{ fontSize: '10px', color: 'var(--red)', fontFamily: 'monospace' }}>
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
                      <div className="mono" style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>{a.case_id}</div>
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
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px'
        }}>

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '8px'
          }}>
            <div>
              <div style={{
                fontSize: '11px',
                letterSpacing: '2px',
                color: 'var(--text-label)',
                fontFamily: 'JetBrains Mono',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                BEHAVIORAL MULTIVARIATE SCATTER PLOT
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-dim)'
              }}>
                Anomalous incidents only — 
                {scatterData.length} cases plotted.
                Normal incidents excluded.
              </div>
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              flexShrink: 0
            }}>
              {[
                { level: 'CRITICAL', color: '#8B0000', 
                  label: 'Critical — Immediate Action' },
                { level: 'HIGH',     color: '#FF6B35', 
                  label: 'High — Within 24h' },
                { level: 'MEDIUM',   color: '#00C851', 
                  label: 'Medium — Monitor' }
              ].map(({ color, label }) => (
                <div key={label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: color,
                    flexShrink: 0
                  }} />
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--text-label)',
                    fontFamily: 'JetBrains Mono',
                    whiteSpace: 'nowrap'
                  }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart
              margin={{ top: 20, right: 30, 
                        bottom: 40, left: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
                opacity={0.5}
              />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 23]}
                ticks={[0,3,6,9,12,15,18,21,23]}
                tickFormatter={v => `${v}:00`}
                label={{
                  value: 'TIME OF DAY (HOUR)',
                  position: 'insideBottom',
                  offset: -25,
                  fill: 'var(--chart-text)',
                  fontSize: 10,
                  letterSpacing: 2,
                  fontFamily: 'JetBrains Mono'
                }}
                tick={{
                  fill: 'var(--chart-text)',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[15, 65]}
                label={{
                  value: 'OFFENDER AGE',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  fill: 'var(--chart-text)',
                  fontSize: 10,
                  letterSpacing: 2,
                  fontFamily: 'JetBrains Mono'
                }}
                tick={{
                  fill: 'var(--chart-text)',
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono'
                }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={{ stroke: 'var(--border)' }}
              />

              {/* Night reference line */}
              <ReferenceLine
                x={22}
                stroke="var(--red)"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{
                  value: 'NIGHT',
                  fill: 'var(--red)',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono'
                }}
              />

              {/* Young offender reference line */}
              <ReferenceLine
                y={25}
                stroke="var(--amber)"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{
                  value: 'AGE 25',
                  fill: 'var(--amber)',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono',
                  position: 'right'
                }}
              />

              <Tooltip
                cursor={{ 
                  strokeDasharray: '3 3',
                  stroke: 'var(--border)' 
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  if (!d) return null;
                  return (
                    <div style={{
                      background: 'var(--tooltip-bg)',
                      border: `1px solid ${getColor(d.alertLevel)}`,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '11px',
                      minWidth: '200px',
                      boxShadow: 'var(--shadow-card)'
                    }}>
                      <div style={{
                        color: getColor(d.alertLevel),
                        letterSpacing: '1px',
                        marginBottom: '8px',
                        fontWeight: '700'
                      }}>
                        {d.alertLevel} — {d.caseId}
                      </div>
                      {[
                        ['DISTRICT',    d.district],
                        ['CRIME',       d.crimeType],
                        ['TIME',        `${d.x}:00 hrs`],
                        ['AGE',         `${d.y} years`],
                        ['ANOMALY',     
                          d.anomalyScore?.toFixed(3)],
                        ['REASON',      d.reason]
                      ].map(([label, value]) => (
                        <div key={label} style={{
                          display: 'flex',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            color: 'var(--text-dim)',
                            minWidth: '72px',
                            fontSize: '10px'
                          }}>
                            {label}
                          </span>
                          <span style={{
                            color: 'var(--text-primary)',
                            fontSize: '11px'
                          }}>
                            {value || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />

              {/* CRITICAL dots */}
              <Scatter
                name="CRITICAL"
                data={scatterData.filter(
                  d => d.alertLevel === 'CRITICAL'
                )}
                fill="#8B0000"
                r={10}
                shape={(props) => {
                  const { cx, cy } = props;
                  return (
                    <g key={`${cx}-${cy}`}>
                      <rect
                        x={cx - 14} y={cy - 14} width={28} height={28}
                        fill="rgba(139,0,0,0.15)"
                      />
                      <rect
                        x={cx - 10} y={cy - 10} width={20} height={20}
                        fill="#8B0000"
                        stroke="rgba(139,0,0,0.5)"
                        strokeWidth={2}
                      />
                    </g>
                  );
                }}
              />

              {/* HIGH dots */}
              <Scatter
                name="HIGH"
                data={scatterData.filter(
                  d => d.alertLevel === 'HIGH'
                )}
                fill="#FF6B35"
                r={7}
                shape={(props) => {
                  const { cx, cy } = props;
                  return (
                    <g key={`${cx}-${cy}`}>
                      <rect
                        x={cx - 10} y={cy - 10} width={20} height={20}
                        fill="rgba(255,107,53,0.15)"
                      />
                      <rect
                        x={cx - 7} y={cy - 7} width={14} height={14}
                        fill="#FF6B35"
                        stroke="rgba(255,107,53,0.5)"
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                }}
              />

              {/* MEDIUM dots */}
              <Scatter
                name="MEDIUM"
                data={scatterData.filter(
                  d => d.alertLevel === 'MEDIUM'
                )}
                fill="#00C851"
                r={5}
                shape={(props) => {
                  const { cx, cy } = props;
                  return (
                    <g key={`${cx}-${cy}`}>
                      <rect
                        x={cx - 8} y={cy - 8} width={16} height={16}
                        fill="rgba(0,200,81,0.12)"
                      />
                      <rect
                        x={cx - 5} y={cy - 5} width={10} height={10}
                        fill="#00C851"
                        stroke="rgba(0,200,81,0.4)"
                        strokeWidth={1}
                      />
                    </g>
                  );
                }}
              />

            </ScatterChart>
          </ResponsiveContainer>

          {/* Axis explanation row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            marginTop: '8px'
          }}>
            <span style={{
              fontSize: '10px',
              color: 'var(--text-dim)',
              fontFamily: 'JetBrains Mono'
            }}>
              X — Hour crime occurred (0–23)
            </span>
            <span style={{
              fontSize: '10px',
              color: 'var(--text-dim)',
              fontFamily: 'JetBrains Mono'
            }}>
              Y — Age of offender at time of incident
            </span>
          </div>
        </div>

        {/* Case Details Modal */}
        {selectedCase && (
          <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
            <div className="cyber-modal" style={{ position: 'relative', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
              {/* Classified Watermark */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                fontSize: '80px',
                opacity: 0.03,
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                fontWeight: 'bold',
                zIndex: 0
              }}>
                CLASSIFIED
              </div>
              <div className="modal-header" style={{ position: 'relative', zIndex: 1 }}>
                <span className="modal-title">ANOMALOUS DOSSIER DECRYPTION // {selectedCase.case_id}</span>
                <button className="modal-close-btn" onClick={() => setSelectedCase(null)}>×</button>
              </div>

              <div className="modal-content" style={{ position: 'relative', zIndex: 1 }}>
                {/* Anomaly score gauge */}
                <div className="gauge-container">
                  <span className="stat-label" style={{ color: 'var(--red)', fontWeight: 'bold' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyan)', marginBottom: '8px', fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace' }}>
                    <AlertOctagon size={14} />
                    <span>NEURAL ALIGNMENT REASONING LOG</span>
                  </div>
                  This case deviates significantly from baseline behavioral models because: 
                  <b style={{ color: 'var(--cyan)', marginLeft: '4px' }}>{selectedCase.reason}</b>.
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
                            <td style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>{sc.id}</td>
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
    borderTop: '2px solid var(--cyan)',
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
