import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer 
} from 'recharts';
import { 
  ShieldAlert, Check, X, Shield, TrendingUp, AlertTriangle, Users, BookOpen 
} from 'lucide-react';

const CRIME_COLORS = {
  "UPI Fraud": "var(--cyan)",
  "Phishing": "#ff9500",
  "Sextortion": "#ffcc00",
  "OLX Scam": "#ff3b30",
  "Romance Scam": "var(--purple)"
};

function OverviewOfficial({ scrbEscalations, removeScrbEscalation }) {
  const [districts, setDistricts] = useState([]);
  const [overviewStats, setOverviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Sorting state for matrix
  const [sortField, setSortField] = useState('cases');
  const [sortAsc, setSortAsc] = useState(false);

  // Review Case modal state
  const [selectedCase, setSelectedCase] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Fetch districts data to aggregate performance matrix
  useEffect(() => {
    const fetchMatrixData = async () => {
      try {
        const [overviewRes, distRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/overview'),
          fetch('http://127.0.0.1:8000/api/districts')
        ]);
        if (!overviewRes.ok || !distRes.ok) throw new Error('Failed to fetch SCRB statistics.');
        
        const overviewData = await overviewRes.json();
        const distData = await distRes.json();

        // Process matrix entries
        const processed = distData.map(d => {
          const resolved = (d.statuses["Closed"] || 0) + (d.statuses["Arrested"] || 0);
          const resRate = d.cases > 0 ? parseFloat((resolved / d.cases * 100).toFixed(1)) : 0;
          
          // Deterministic risk score: higher cases & lower resolution rate increases risk
          let riskScore = Math.min(100, Math.max(10, Math.round((d.cases / 8) + (100 - resRate) * 0.4)));
          
          let trend = "Stable";
          if (riskScore > 65) trend = "▲ Rising";
          else if (riskScore < 35) trend = "▼ Dropping";

          let status = "Medium";
          if (riskScore > 60) status = "Critical";
          else if (riskScore > 40) status = "High";

          return {
            name: d.name,
            cases: d.cases,
            resolved,
            resRate,
            riskScore,
            trend,
            status
          };
        });

        setDistricts(processed);
        setOverviewStats(overviewData.stats);
      } catch (err) {
        setError(err.message || 'Error connecting to database.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatrixData();
  }, [scrbEscalations]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getSortedDistricts = () => {
    const sorted = [...districts];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
    return sorted;
  };

  // Generate stable monthly line trend data for 2022-2026
  const getLineTrendData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const years = [2022, 2023, 2024, 2025, 2026];
    const trend = [];
    
    // Generate deterministic curves per crime type
    years.forEach((yr, yrIdx) => {
      months.forEach((mo, moIdx) => {
        const step = yrIdx * 12 + moIdx;
        trend.push({
          name: `${yr} ${mo}`,
          "UPI Fraud": Math.round(150 + step * 4.5 + Math.sin(step) * 15),
          "Phishing": Math.round(120 + step * 3.8 + Math.cos(step) * 12),
          "Sextortion": Math.round(80 + step * 2.5 + Math.sin(step * 1.5) * 20),
          "OLX Scam": Math.round(90 + step * 2.0 + Math.cos(step * 0.8) * 10),
          "Romance Scam": Math.round(60 + step * 1.8 + Math.sin(step * 0.5) * 8)
        });
      });
    });
    return trend;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCloseEscalation = (caseId, ref) => {
    removeScrbEscalation(caseId);
    showToast(`Escalation ${ref} closed and archived.`);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <div style={styles.loadingText}>SYNCHRONIZING EXECUTIVE INTELLIGENCE DATABASE...</div>
      </div>
    );
  }

  const sortedList = getSortedDistricts();
  const stateTrend = getLineTrendData();

  // Stats derived
  const totalArrests = overviewStats?.arrested || 0;
  const totalCases = overviewStats?.total_complaints || 0;
  const pendingTrials = Math.round(totalCases * 0.15); // Synthetic constant for trials
  const highestRiskDist = districts.length > 0 ? districts.sort((a,b) => b.riskScore - a.riskScore)[0]?.name : "Bengaluru Urban";

  return (
    <div style={styles.container}>
      {toastMessage && (
        <div style={styles.toast}>
          <Check size={14} style={{ marginRight: '6px' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Row 1 & 2 Cards */}
      <div style={styles.statsGrid}>
        <div className="stat-card" style={styles.statCard}>
          <span style={styles.statLabel}>TOTAL CASES (ALL KARNATAKA)</span>
          <span style={styles.statValue}>{totalCases.toLocaleString()}</span>
          <span style={styles.statSubtitle}>State-wide Complaint registry</span>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <span style={styles.statLabel}>TOTAL ARRESTS</span>
          <span style={{ ...styles.statValue, color: '#34c759' }}>{totalArrests.toLocaleString()}</span>
          <span style={styles.statSubtitle}>{((totalArrests/totalCases)*100).toFixed(1)}% Apprehension Rate</span>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <span style={styles.statLabel}>PENDING TRIALS</span>
          <span style={{ ...styles.statValue, color: 'var(--amber)' }}>{pendingTrials.toLocaleString()}</span>
          <span style={styles.statSubtitle}>Active in judicial special courts</span>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <span style={styles.statLabel}>HIGHEST RISK DISTRICT</span>
          <span style={{ ...styles.statValue, color: '#ff3b30' }}>{highestRiskDist.toUpperCase()}</span>
          <span style={styles.statSubtitle}>Requires tactical reinforcements</span>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <span style={styles.statLabel}>ACTIVE EMERGING THREATS</span>
          <span style={{ ...styles.statValue, color: 'var(--purple)' }}>3</span>
          <span style={styles.statSubtitle}>Telegram job scam spikes</span>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <span style={styles.statLabel}>SCRB ESCALATIONS PENDING</span>
          <span style={{ ...styles.statValue, color: scrbEscalations.length > 0 ? '#ff3b30' : '#8a9ba8' }}>
            {scrbEscalations.length}
          </span>
          <span style={styles.statSubtitle}>Awaiting executive review board</span>
        </div>
      </div>

      {/* SECTION 2 — DISTRICT PERFORMANCE MATRIX */}
      <div className="chart-card" style={styles.sectionCard}>
        <div className="chart-header">
          <span className="chart-title">DISTRICT PERFORMANCE MATRIX</span>
        </div>
        <div className="cyber-table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <table className="cyber-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>DISTRICT {sortField === 'name' && (sortAsc ? '▲' : '▼')}</th>
                <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('cases')}>CASES {sortField === 'cases' && (sortAsc ? '▲' : '▼')}</th>
                <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('resolved')}>RESOLVED {sortField === 'resolved' && (sortAsc ? '▲' : '▼')}</th>
                <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('resRate')}>RESOLUTION % {sortField === 'resRate' && (sortAsc ? '▲' : '▼')}</th>
                <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('riskScore')}>RISK SCORE {sortField === 'riskScore' && (sortAsc ? '▲' : '▼')}</th>
                <th style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('trend')}>TREND {sortField === 'trend' && (sortAsc ? '▲' : '▼')}</th>
                <th style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('status')}>STATUS {sortField === 'status' && (sortAsc ? '▲' : '▼')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedList.map(d => {
                const isCrit = d.riskScore > 60;
                const isHigh = d.riskScore > 40 && d.riskScore <= 60;
                let rowBg = 'transparent';
                let textColor = '#ffffff';
                if (isCrit) { rowBg = 'rgba(255, 45, 85, 0.05)'; textColor = 'var(--red)'; }
                else if (isHigh) { rowBg = 'rgba(255, 170, 0, 0.03)'; textColor = 'var(--amber)'; }

                return (
                  <tr key={d.name} style={{ backgroundColor: rowBg }}>
                    <td style={{ fontWeight: 'bold', color: textColor }}>{d.name}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{d.cases}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{d.resolved}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{d.resRate}%</td>
                    <td className="mono" style={{ textAlign: 'right', color: textColor, fontWeight: 'bold' }}>{d.riskScore}</td>
                    <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{d.trend}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{
                        backgroundColor: isCrit ? 'var(--red-bg)' : isHigh ? 'var(--amber-bg)' : 'var(--green-bg)',
                        color: isCrit ? 'var(--red)' : isHigh ? 'var(--amber)' : 'var(--green)'
                      }}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3 — STATE CRIME TREND */}
      <div className="chart-card" style={styles.sectionCard}>
        <div className="chart-header">
          <span className="chart-title">STATE CYBER CRIME TREND INDEX (2022 - 2026)</span>
        </div>
        <div style={{ height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stateTrend} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#8a9ba8" style={{ fontFamily: 'monospace', fontSize: '9px' }} />
              <YAxis stroke="#8a9ba8" style={{ fontFamily: 'monospace', fontSize: '9px' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {Object.entries(CRIME_COLORS).map(([crime, color]) => (
                <Line 
                  key={crime}
                  type="monotone"
                  dataKey={crime}
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 4 — SCRB ESCALATIONS INBOX */}
      <div className="chart-card" style={styles.sectionCard}>
        <div className="chart-header">
          <span className="chart-title" style={{ color: 'var(--red)' }}>STATE CRIME RECORD BOARD (SCRB) ESCALATIONS INBOX</span>
        </div>
        {scrbEscalations.length === 0 ? (
          <div style={styles.emptyInbox}>NO ESCALATED INCIDENTS AWAITING REVIEW.</div>
        ) : (
          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>SCRB REF NO</th>
                  <th>CASE ID</th>
                  <th>DISTRICT</th>
                  <th>CRIME TYPE</th>
                  <th>ESCALATED AT</th>
                  <th style={{ textAlign: 'right' }}>EXECUTIVE CONTROLS</th>
                </tr>
              </thead>
              <tbody>
                {scrbEscalations.map(esc => (
                  <tr key={esc.id}>
                    <td className="mono" style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{esc.scrbRef}</td>
                    <td className="mono" style={{ color: 'var(--cyan)' }}>{esc.id}</td>
                    <td>{esc.victim_district || esc.district}</td>
                    <td>{esc.crime_type}</td>
                    <td className="mono">{esc.escalatedAt}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button className="cyber-btn" onClick={() => setSelectedCase(esc)} style={{ padding: '3px 8px', fontSize: '9px' }}>
                          REVIEW
                        </button>
                        <button className="cyber-btn-outline" onClick={() => handleCloseEscalation(esc.id, esc.scrbRef)} style={{ padding: '3px 8px', fontSize: '9px', borderColor: 'var(--red)', color: 'var(--red)' }}>
                          CLOSE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 5 — AI INTELLIGENCE SUMMARY */}
      <div style={styles.intelGrid}>
        <div className="chart-card" style={{ borderLeft: '3px solid var(--red)', padding: '16px' }}>
          <div style={styles.intelHeader}>
            <AlertTriangle size={14} color="var(--red)" />
            <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#fff' }}>STATE RISK ASSESSMENT</span>
          </div>
          <p style={styles.intelText}>
            Karnataka overall threat status is currently flagged as <strong>HIGH</strong>. The dynamic risk engine reports elevated incident clusters in Bengaluru Urban, Davanagere, and Mysuru. High repeat suspect densities require prompt localized search team deployments.
          </p>
        </div>

        <div className="chart-card" style={{ borderLeft: '3px solid var(--cyan)', padding: '16px' }}>
          <div style={styles.intelHeader}>
            <TrendingUp size={14} color="var(--cyan)" />
            <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#fff' }}>TOP EMERGING THREATS</span>
          </div>
          <ul style={{ ...styles.intelText, paddingLeft: '16px', margin: '8px 0 0' }}>
            <li>Spike in Telegram Job Fraud channels targeting young graduates.</li>
            <li>VoIP spoofed callers mimicking electricity board enforcement officers.</li>
            <li>Bulk registry of mule bank accounts in Rural limits.</li>
          </ul>
        </div>

        <div className="chart-card" style={{ borderLeft: '3px solid var(--gold)', padding: '16px' }}>
          <div style={styles.intelHeader}>
            <BookOpen size={14} color="var(--gold)" />
            <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#fff' }}>RECOMMENDED POLICY ACTIONS</span>
          </div>
          <p style={styles.intelText}>
            Establish joint nodal coordination teams with RBI representatives to freeze suspected mule bank accounts. Initiate high-visibility public awareness campaigns focusing on UPI cashback validation codes.
          </p>
        </div>
      </div>

      {/* Case Review Detail Modal */}
      {selectedCase && (
        <div style={styles.modalOverlay}>
          <div className="chart-card" style={styles.modalContainer}>
            <div className="chart-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <span className="chart-title" style={{ color: 'var(--cyan)' }}>EXECUTIVE CASE STUDY — {selectedCase.id}</span>
              <button className="cyber-btn-outline" onClick={() => setSelectedCase(null)} style={{ padding: '3px 8px', fontSize: '9px' }}>
                CLOSE
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                <div style={styles.modalCol}>
                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>CASE COMPLAINT ID</span>
                    <span style={styles.infoValue} className="mono">{selectedCase.id}</span>
                  </div>
                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>CRIME TYPE</span>
                    <span style={styles.infoValue}>{selectedCase.crime_type}</span>
                  </div>
                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>JURISDICTION DISTRICT</span>
                    <span style={styles.infoValue}>{selectedCase.victim_district || selectedCase.district}</span>
                  </div>
                </div>
                <div style={styles.modalCol}>
                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>ANOMALY THREAT REASON</span>
                    <span style={{ ...styles.infoValue, color: 'var(--red)' }}>{selectedCase.reason || "Suspicious transaction frequency matching prior suspect's MO."}</span>
                  </div>
                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>INCIDENT DATE</span>
                    <span style={styles.infoValue} className="mono">{selectedCase.date_of_incident || "2026-06-12"}</span>
                  </div>
                  <div style={styles.infoGroup}>
                    <span style={styles.infoLabel}>INVESTIGATION STATUS</span>
                    <span style={styles.infoValue}>{selectedCase.status}</span>
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
    gap: '20px',
    width: '100%'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px'
  },
  statCard: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statLabel: {
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#8a9ba8',
    letterSpacing: '0.5px'
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace'
  },
  statSubtitle: {
    fontSize: '10px',
    color: '#4f616d'
  },
  sectionCard: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    padding: '20px'
  },
  emptyInbox: {
    textAlign: 'center',
    padding: '40px',
    color: '#4f616d',
    fontFamily: 'monospace',
    fontSize: '11px'
  },
  intelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px'
  },
  intelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'monospace',
    marginBottom: '8px'
  },
  intelText: {
    fontSize: '11px',
    color: '#8a9ba8',
    lineHeight: '1.4'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 4, 9, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modalContainer: {
    width: '540px',
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderTop: '2px solid var(--cyan)',
    padding: '20px'
  },
  modalBody: {
    marginTop: '15px'
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  modalCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  infoGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  infoLabel: {
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#4f616d',
    letterSpacing: '0.5px'
  },
  infoValue: {
    fontSize: '12px',
    color: '#ffffff',
    fontWeight: 'bold'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    width: '100%'
  },
  loader: {
    width: '30px',
    height: '30px',
    border: '2px solid var(--border)',
    borderTop: '2px solid var(--gold)',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: 'var(--gold)',
    fontFamily: 'monospace',
    fontSize: '11px',
    marginTop: '12px'
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
    boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
    zIndex: 9999
  }
};

export default OverviewOfficial;
