import React, { useState, useEffect } from 'react';
import { ShieldAlert, Award, ClipboardList, Check, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import printExport from '../utils/printExport';

function CrimeBriefing() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [stats, setStats] = useState({ incidents24h: 0, highestActivity: 'N/A', activeAlerts: 0 });
  const [districtsBoard, setDistrictsBoard] = useState([]);
  const [topIncidents, setTopIncidents] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [expandedIncident, setExpandedIncident] = useState(null);

  // Time & Date strings
  const [currentTime, setCurrentTime] = useState('');
  const [todayDate, setTodayDate] = useState('');

  const fetchBriefingData = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewRes, districtsRes, trendsRes, complaintsRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/overview'),
        fetch('http://127.0.0.1:8000/api/districts'),
        fetch('http://127.0.0.1:8000/api/trends/emerging'),
        fetch('http://127.0.0.1:8000/api/complaints?page=1&limit=300')
      ]);

      if (!overviewRes.ok || !districtsRes.ok || !trendsRes.ok || !complaintsRes.ok) {
        throw new Error('Failed to load intelligence components.');
      }

      const overviewData = await overviewRes.json();
      const districtsData = await districtsRes.json();
      const trendsData = await trendsRes.json();
      const complaintsData = await complaintsRes.json();

      // Time and Date settings
      const now = new Date();
      setTodayDate(now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));

      // 1. Calculate stats
      const total24h = Math.floor(overviewData.stats.total_complaints * 0.009) + 12; // Synthesized 24h count
      const sortedDists = [...districtsData].sort((a, b) => b.cases - a.cases);
      const topDist = sortedDists[0] ? sortedDists[0].name : 'Bengaluru Urban';

      setStats({
        incidents24h: total24h,
        highestActivity: topDist,
        activeAlerts: trendsData.length
      });

      // 2. Districts status board
      // Map 31 districts with synthesized 24h counts
      let seed = 42;
      const r = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280.0;
      };

      const board = districtsData.map((d, index) => {
        // Synthesize 24h count relative to total district cases
        const cases24h = Math.max(1, Math.floor(d.cases * 0.05 + r() * 10));
        
        // Status logic
        let status = 'NORMAL';
        if (cases24h > 15) status = 'ELEVATED';
        else if (cases24h >= 10) status = 'WATCH';

        // Vs Yesterday comparison
        const diff = Math.floor((r() * 6) - 3);
        const vsYesterday = diff >= 0 ? `+${diff}` : `${diff}`;

        return {
          district: d.name,
          cases24h,
          status,
          vsYesterday
        };
      });
      // Sort by 24H cases descending
      board.sort((a, b) => b.cases24h - a.cases24h);
      setDistrictsBoard(board);

      // 3. Expansion: Expandable top 5 cases
      const sortedCases = [...complaintsData.records]
        .sort((a, b) => b.loss_amount_inr - a.loss_amount_inr)
        .slice(0, 5);
      setTopIncidents(sortedCases);

      // 4. Alerts
      setActiveAlerts(trendsData);

    } catch (err) {
      setError(err.message || 'Error fetching intelligence briefings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefingData();
  }, []);

  const handleExport = () => {
    const outerStats = stats;
    const statsMapped = {
      incidents_24h: outerStats.incidents24h,
      top_district: outerStats.highestActivity
    };
    const statsObj = statsMapped;

    const districtData = districtsBoard.map(d => {
      const val = parseInt(d.vsYesterday);
      return {
        district: d.district,
        cases_24h: d.cases24h,
        status: d.status,
        change_pct: isNaN(val) ? 0 : val
      };
    });

    const emergingTrends = activeAlerts.map(a => ({
      crime_type: a.crime_type || a.threat_type || 'Cyber Fraud',
      district: a.district || 'State-wide',
      alert_text: a.alert_text || a.reason || 'Spike in incident volume',
      spike_percentage: a.spike_percentage ?? a.percentage_increase ?? 0
    }));

    const scrbEscalations = JSON.parse(localStorage.getItem('ksp_scrb_escalations') || '[]');

    const districtRows = districtData
      .slice(0, 31)
      .map(d => `
        <tr>
          <td>${d.district || '—'}</td>
          <td>${d.cases_24h ?? 0}</td>
          <td class="${
            d.status === 'ELEVATED' ? 'status-high' :
            d.status === 'WATCH'    ? 'status-med'  :
            'status-low'
          }">
            ${d.status || 'NORMAL'}
          </td>
          <td>${d.change_pct > 0 
            ? '↑ ' + d.change_pct + '%' 
            : '↓ ' + Math.abs(d.change_pct) + '%'}
          </td>
        </tr>
      `).join('');

    const alertCards = (emergingTrends || [])
      .slice(0, 5)
      .map(t => `
        <div class="alert-card">
          <div class="alert-card-title">
            ▲ ALERT — ${t.crime_type} 
            in ${t.district}
          </div>
          <div class="alert-card-body">
            ${t.alert_text}. 
            Spike: ↑${t.spike_percentage}% 
            vs 90-day average.
          </div>
        </div>
      `).join('');

    const recommendations = [
      { p: 'HIGH', c: 'rec-high',
        t: 'Deploy additional units to highest-risk districts immediately' },
      { p: 'HIGH', c: 'rec-high',
        t: 'Alert cybercrime response teams — fraud spike detected' },
      { p: 'MED',  c: 'rec-med',
        t: 'Increase patrol frequency in WATCH-status districts' },
      { p: 'MED',  c: 'rec-med',
        t: 'Issue BOC notices for repeat offenders flagged this week' },
      { p: 'LOW',  c: 'rec-low',
        t: 'Schedule inter-district coordination meeting within 72 hours' }
    ].map((r, i) => `
      <div class="rec-item">
        <span class="rec-priority ${r.c}">${r.p}</span>
        <span class="rec-text">
          ${i + 1}. ${r.t}
        </span>
      </div>
    `).join('');

    printExport({
      title: 'DAILY CRIME INTELLIGENCE BRIEFING',
      subtitle: `State-wide summary — 
        ${new Date().toLocaleDateString('en-IN', {
          dateStyle: 'long'
        })}`,
      filename: `KSP_Crime_Briefing_${
        new Date().toISOString().split('T')[0]
      }`,
      content: `

        <!-- SECTION A: SUMMARY STATS -->
        <div class="section-heading">
          A — Executive Summary
        </div>
        <div class="stat-row">
          <div class="stat-box">
            <div class="stat-box-label">
              24H Incidents
            </div>
            <div class="stat-box-value">
              ${statsObj?.incidents_24h ?? 47}
            </div>
            <div class="stat-box-trend 
              status-high">↑ vs yesterday</div>
          </div>
          <div class="stat-box">
            <div class="stat-box-label">
              Highest Activity
            </div>
            <div class="stat-box-value" 
              style="font-size:14px; padding-top:4px">
              ${statsObj?.top_district ?? 
                'Bengaluru Urban'}
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-box-label">
              Active Alerts
            </div>
            <div class="stat-box-value">
              ${emergingTrends?.length ?? 0}
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-box-label">
              SCRB Escalations
            </div>
            <div class="stat-box-value">
              ${scrbEscalations?.length ?? 0}
            </div>
          </div>
        </div>

        <!-- SECTION B: DISTRICT STATUS -->
        <div class="section-heading">
          B — District Status Board
        </div>
        <table>
          <thead>
            <tr>
              <th>District</th>
              <th>24H Cases</th>
              <th>Status</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            ${districtRows || '<tr><td colspan="4">No data available</td></tr>'}
          </tbody>
        </table>

        <!-- SECTION C: ACTIVE ALERTS -->
        <div class="section-heading">
          C — Active Intelligence Alerts
        </div>
        ${alertCards || 
          '<p style="color:#64748b;font-size:12px">No active alerts at this time.</p>'}

        <!-- SECTION D: RECOMMENDATIONS -->
        <div class="section-heading">
          D — Recommended Actions
        </div>
        ${recommendations}
      `
    });
  };

  const toggleIncident = (id) => {
    if (expandedIncident === id) {
      setExpandedIncident(null);
    } else {
      setExpandedIncident(id);
    }
  };

  return (
    <div style={styles.container}>

      {/* Export Action Button */}
      {!loading && !error && (
        <div className="export-btn-container" style={styles.exportContainer}>
          <button className="cyber-btn" onClick={handleExport}>
            <FileText size={14} />
            <span>EXPORT BRIEFING (PRINT)</span>
          </button>
        </div>
      )}

      {loading ? (
        <div style={styles.centeredState}>
          <div style={styles.loader}></div>
          <div style={{ color: 'var(--cyan)', fontFamily: 'monospace', fontSize: '11px', marginTop: '12px' }}>RETRIEVING LATEST BRIEFINGS...</div>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      ) : (
        <div className="briefing-report" style={styles.briefingPaper}>
          {/* HEADER BLOCK */}
          <div style={styles.headerBlock}>
            <div style={styles.logoLabel}>KSP INTELLIGENCE BRIEFING</div>
            <div style={styles.subHeader}>
              <span>DATE: {todayDate}</span>
              <span>//</span>
              <span style={{ color: '#ff3b30' }}>CONFIDENTIAL</span>
              <span>//</span>
              <span>SCRB DISTRIBUTION</span>
            </div>
            <div style={styles.timeLabel}>AUTO-GENERATED: {currentTime} IST</div>
          </div>

          {/* SECTION A — EXECUTIVE SUMMARY */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>SECTION A — EXECUTIVE SUMMARY</h3>
            <div className="stats-grid" style={{ marginBottom: 0 }}>
              <div className="stat-card" style={styles.statCard}>
                <div className="stat-label">24H INCIDENTS</div>
                <div className="stat-value">{stats.incidents24h}</div>
                <div className="stat-subtitle">Logged Across Districts</div>
              </div>
              <div className="stat-card" style={styles.statCard}>
                <div className="stat-label">HIGHEST ACTIVITY</div>
                <div className="stat-value" style={{ fontSize: '20px', lineHeight: '28px' }}>{stats.highestActivity.toUpperCase()}</div>
                <div className="stat-subtitle">Leads incident volume</div>
              </div>
              <div className="stat-card" style={styles.statCard}>
                <div className="stat-label">ACTIVE ALERTS</div>
                <div className="stat-value" style={{ color: '#ff9500' }}>{stats.activeAlerts}</div>
                <div className="stat-subtitle">Emerging threats detected</div>
              </div>
            </div>
          </div>

          {/* SECTION B — DISTRICT STATUS BOARD */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>SECTION B — DISTRICT STATUS BOARD</h3>
            <div className="cyber-table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>DISTRICT</th>
                    <th>24H CASES</th>
                    <th>STATUS</th>
                    <th>VS YESTERDAY</th>
                  </tr>
                </thead>
                <tbody>
                  {districtsBoard.map((row, index) => {
                    const isElevated = row.status === 'ELEVATED';
                    const isWatch = row.status === 'WATCH';
                    const statusColor = isElevated ? '#ff3b30' : isWatch ? '#ffcc00' : '#34c759';
                    
                    return (
                      <tr 
                        key={row.district} 
                        className={isElevated ? "elevated-row" : ""}
                        style={isElevated ? styles.elevatedRow : {}}
                      >
                        <td style={{ fontWeight: 'bold' }}>{row.district}</td>
                        <td className="mono">{row.cases24h}</td>
                        <td style={{ color: statusColor, fontWeight: 'bold', fontFamily: 'monospace' }}>{row.status}</td>
                        <td className="mono" style={{ color: row.vsYesterday.startsWith('+') ? '#ff3b30' : '#34c759' }}>
                          {row.vsYesterday}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION C — TOP 5 INCIDENTS */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>SECTION C — EXPANDABLE CASE LOGS</h3>
            <div style={styles.expandableList}>
              {topIncidents.map((incident) => {
                const isExpanded = expandedIncident === incident.id;
                return (
                  <div key={incident.id} style={styles.incidentRow}>
                    <div style={styles.incidentHeader} onClick={() => toggleIncident(incident.id)}>
                      <div style={styles.incidentHdrLeft}>
                        <span className="mono" style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>{incident.id}</span>
                        <span className="brief-hdr-text" style={{ color: '#ffffff' }}>{incident.crime_type} in {incident.victim_district}</span>
                      </div>
                      <div style={styles.incidentHdrRight}>
                        <span className="mono" style={{ color: '#ff3b30' }}>₹{incident.loss_amount_inr.toLocaleString()}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={styles.incidentDetails}>
                        <div style={styles.detailsGrid}>
                          <div><span style={styles.detailLbl}>ACCUSED PHONE:</span> <span className="mono">{incident.accused_phone}</span></div>
                          <div><span style={styles.detailLbl}>BANK PATHWAY:</span> <span className="mono">{incident.accused_bank}</span></div>
                          <div><span style={styles.detailLbl}>PLATFORM:</span> <span className="mono">{incident.platform}</span></div>
                          <div><span style={styles.detailLbl}>INVESTIGATION STATUS:</span> <span className="badge court">{incident.status}</span></div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <span style={styles.detailLbl}>INCIDENT CLASSIFIER LOG:</span>
                          <p className="incident-desc" style={styles.incidentDesc}>
                            Synthetic complaint trace logged at {incident.victim_district} Cyber Crime division under case ID {incident.id}. 
                            Targeted account trail maps to the pathway {incident.accused_bank} with potential IP address anomalies.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION D — ACTIVE INTELLIGENCE ALERTS */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>SECTION D — ACTIVE INTELLIGENCE ALERTS</h3>
            <div style={styles.alertsContainer}>
              {activeAlerts.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#4f616d', fontFamily: 'monospace', padding: '10px' }}>NO ACTIVE INTELLIGENCE ALERTS LOGGED.</div>
              ) : (
                activeAlerts.map((alert, index) => {
                  const crimeLabel = (alert.crime_type || alert.threat_type || 'CYBERCRIME').toUpperCase();
                  const percentage = alert.spike_percentage ?? alert.percentage_increase ?? 0;
                  return (
                    <div key={index} className="alert-strip" style={styles.alertStrip}>
                      <AlertTriangle size={14} color="#ff9500" style={{ flexShrink: 0 }} />
                      <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                        ▲ ALERT {index + 1}: {crimeLabel} threat spike detected in {alert.district} — 
                        incident volumes are up <span style={{ color: '#ff3b30', fontWeight: 'bold' }}>{percentage}%</span> vs 90-day base average.
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION E — RECOMMENDED ACTIONS */}
          <div style={{ ...styles.section, marginBottom: 0 }}>
            <h3 style={styles.sectionTitle}>SECTION E — ACTION RECOMMENDED</h3>
            <ol style={styles.actionsList}>
              <li>
                <span style={{ color: '#ff3b30', fontWeight: 'bold' }}>[HIGH]</span> Deploy additional cyber patrol units and monitor bank withdrawal nodes in <span style={{ fontWeight: 'bold' }}>{stats.highestActivity}</span>.
              </li>
              <li>
                <span style={{ color: '#ff9500', fontWeight: 'bold' }}>[MEDIUM]</span> Alert cyber fraud response desk. Targeted campaigns targeting financial portals detected.
              </li>
              <li>
                <span style={{ color: '#34c759', fontWeight: 'bold' }}>[LOW]</span> Audit investigation log records for cases categorized as active closed.
              </li>
            </ol>
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
  exportContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  briefingPaper: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  headerBlock: {
    borderBottom: '1px solid var(--border)',
    paddingBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  logoLabel: {
    fontFamily: 'monospace',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: '2px',
    borderTop: '3px solid var(--cyan)',
    paddingTop: '10px',
  },
  subHeader: {
    display: 'flex',
    gap: '10px',
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#8a9ba8',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: '10px',
    fontFamily: 'monospace',
    color: '#4f616d',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: 'var(--cyan)',
    letterSpacing: '1px',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '6px',
  },
  statCard: {
    background: '#070a12',
    border: '1px solid var(--border)',
  },
  elevatedRow: {
    backgroundColor: 'rgba(255, 45, 85, 0.06)',
    borderLeft: '3px solid var(--red)',
  },
  expandableList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  incidentRow: {
    border: '1px solid var(--border)',
    background: '#070a12',
  },
  incidentHeader: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  incidentHdrLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  incidentHdrRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  incidentDetails: {
    padding: '16px',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-panel)',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    fontSize: '11px',
  },
  detailLbl: {
    color: '#4f616d',
    fontFamily: 'monospace',
    marginRight: '6px',
  },
  incidentDesc: {
    fontSize: '11px',
    color: '#8a9ba8',
    lineHeight: '1.5',
    marginTop: '6px',
  },
  alertsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  alertStrip: {
    background: 'rgba(255, 149, 0, 0.04)',
    border: '1px solid rgba(255, 149, 0, 0.15)',
    borderLeft: '3px solid #ff9500',
    padding: '10px 14px',
    color: '#ff9500',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  actionsList: {
    paddingLeft: '20px',
    fontSize: '12px',
    color: '#8a9ba8',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    lineHeight: '1.4',
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
  }
};

export default CrimeBriefing;
