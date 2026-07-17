import React, { useState, useEffect, useRef } from 'react';
import { Radio, AlertTriangle, Check, Shield, Pause, Play, Trash2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

function LiveIntelFeed() {
  const [feedItems, setFeedItems] = useState([]);
  const [dbCases, setDbCases] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [eventsCount, setEventsCount] = useState(0);
  
  // Right side stats panel
  const [panelStats, setPanelStats] = useState({
    eventsToday: 0,
    criticalCount: 0,
    districtsActive: 0,
    lastUpdate: ''
  });

  // Success toast
  const [successToast, setSuccessToast] = useState('');

  // Refs for tracking index
  const nextIndexRef = useRef(8);

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'CRITICAL': return '#ff2d55';
      case 'HIGH': return '#ff6b35';
      case 'MEDIUM': return '#ffaa00';
      case 'INFO': return '#00e5ff';
      default: return '#8a9ba8';
    }
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Load database cases on mount
  useEffect(() => {
    const loadDbCases = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/complaints?limit=1000');
        if (response.ok) {
          const resObj = await response.json();
          const data = resObj.records || [];
          // Sort by date descending so we stream fresh cases
          data.sort((a, b) => b.date_of_incident.localeCompare(a.date_of_incident));
          setDbCases(data);
          setEventsCount(resObj.metadata?.total_records || data.length);

          // Build initial items from first 8 cases
          const initialItems = [];
          for (let i = 0; i < Math.min(8, data.length); i++) {
            const caseItem = data[i];
            const timeStr = new Date(Date.now() - (7 - i) * 60000).toLocaleTimeString('en-US', { hour12: false });
            
            let severity = "INFO";
            if (caseItem.loss_amount_inr > 200000) severity = "CRITICAL";
            else if (caseItem.loss_amount_inr > 50000) severity = "HIGH";
            else if (caseItem.loss_amount_inr > 10000) severity = "MEDIUM";

            initialItems.unshift({
              id: caseItem.id,
              time: timeStr,
              district: caseItem.victim_district,
              station: `${caseItem.victim_district} Cyber Cell`,
              crime: caseItem.crime_type,
              severity,
              message: `Intrusion alert: New ${caseItem.crime_type} logged under status ${caseItem.status}. Transaction loss: ₹${caseItem.loss_amount_inr.toLocaleString()}.`
            });
          }
          setFeedItems(initialItems);
          
          const now = new Date();
          const activeDists = new Set(initialItems.map(i => i.district)).size;
          const criticalCount = initialItems.filter(i => i.severity === 'CRITICAL').length;
          
          setPanelStats({
            eventsToday: data.length,
            criticalCount,
            districtsActive: activeDists,
            lastUpdate: now.toLocaleTimeString('en-US', { hour12: false })
          });
        }
      } catch (err) {
        console.error("Failed to load database cases for feed:", err);
      }
    };
    loadDbCases();
  }, []);

  // Interval for adding items every 3 seconds from database list
  useEffect(() => {
    if (isPaused || dbCases.length === 0) return;

    const interval = setInterval(() => {
      let idx = nextIndexRef.current;
      if (idx >= dbCases.length) {
        idx = 0; // loop back
      }
      nextIndexRef.current = idx + 1;

      const caseItem = dbCases[idx];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
      
      let severity = "INFO";
      if (caseItem.loss_amount_inr > 200000) severity = "CRITICAL";
      else if (caseItem.loss_amount_inr > 50000) severity = "HIGH";
      else if (caseItem.loss_amount_inr > 10000) severity = "MEDIUM";

      const newItem = {
        id: caseItem.id,
        time: timeStr,
        district: caseItem.victim_district,
        station: `${caseItem.victim_district} Cyber Cell`,
        crime: caseItem.crime_type,
        severity,
        message: `Intrusion alert: New ${caseItem.crime_type} logged under status ${caseItem.status}. Transaction loss: ₹${caseItem.loss_amount_inr.toLocaleString()}.`
      };

      setFeedItems(prev => {
        const updated = [newItem, ...prev];
        if (updated.length > 50) {
          updated.pop();
        }
        return updated;
      });
      setEventsCount(c => c + 1);

    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, dbCases]);

  // Interval for updating right stats panel every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const activeDists = new Set(feedItems.map(i => i.district)).size;
      const criticalCount = feedItems.filter(i => i.severity === 'CRITICAL').length;

      setPanelStats({
        eventsToday: eventsCount,
        criticalCount,
        districtsActive: activeDists || 14,
        lastUpdate: now.toLocaleTimeString('en-US', { hour12: false })
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [feedItems, eventsCount]);

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
    showToast(isPaused ? 'Live feed resumed.' : 'Live feed paused.');
  };

  const handleClear = () => {
    setFeedItems([]);
    showToast('Feed cleared.');
  };

  // Compute crime types pie chart data
  const getPieChartData = () => {
    const counts = {};
    feedItems.forEach(item => {
      counts[item.crime] = (counts[item.crime] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const pieColors = [
    '#00e5ff', // cyan
    '#ff9500', // orange
    '#ffcc00', // yellow
    '#ff3b30', // red
    '#34c759', // green
    '#bf5af2', // purple
    '#007aff', // blue
  ];

  return (
    <div style={styles.container}>
      {/* Toast */}
      {successToast && (
        <div style={styles.toast}>
          <Check size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Styled slideDown animation class override */}
      <style>{`
        .slide-down-event {
          animation: slideDown 0.3s ease-out !important;
        }
      `}</style>

      <div style={styles.grid}>
        {/* LEFT COLUMN — LIVE FEED */}
        <div className="chart-card" style={styles.feedPanel}>
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="pulse-dot"></span>
              <span className="chart-title" style={{ color: '#00e5ff' }}>LIVE TRANSMISSION FEED</span>
              <span style={{ fontSize: '10px', color: '#8a9ba8', fontFamily: 'monospace' }}>
                | {eventsCount} EVENTS LOGGED IN DATABASE
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="cyber-btn-outline" style={styles.controlBtn} onClick={handlePauseToggle}>
                {isPaused ? <Play size={12} style={{ marginRight: '4px' }} /> : <Pause size={12} style={{ marginRight: '4px' }} />}
                <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
              </button>
              <button className="cyber-btn-outline" style={styles.controlBtn} onClick={handleClear}>
                <Trash2 size={12} style={{ marginRight: '4px' }} />
                <span>CLEAR</span>
              </button>
            </div>
          </div>

          <div style={styles.feedScroll}>
            {feedItems.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={{ color: '#4f616d', fontFamily: 'monospace', fontSize: '11px' }}>NO DATA AVAILABLE. AWAITING LIVE COMMUNICATIONS...</span>
              </div>
            ) : (
              feedItems.map((item) => {
                const borderClr = getSeverityColor(item.severity);
                return (
                  <div 
                    key={item.id} 
                    className="slide-down-event"
                    style={{ 
                      ...styles.feedCard, 
                      borderColor: '#1e2d3d', 
                      borderLeft: `4px solid ${borderClr}` 
                    }}
                  >
                    <div style={styles.feedCardHeader}>
                      <span style={styles.feedTime}>[{item.time}]</span>
                      <span style={styles.feedDistrictTag}>{item.district.toUpperCase()}</span>
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: `${borderClr}15`, 
                          color: borderClr, 
                          borderColor: `${borderClr}30`,
                          fontSize: '8px',
                          padding: '1px 6px'
                        }}
                      >
                        {item.severity}
                      </span>
                    </div>

                    <div style={styles.feedMessage}>{item.message}</div>

                    <div style={styles.feedFooter}>
                      <span style={styles.crimeTag}>#{item.crime.replace(' ', '')}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="cyber-btn-outline" style={styles.cardActionBtn} onClick={() => showToast(`Opening logs for case ${item.id}.`)}>
                          VIEW
                        </button>
                        <button className="cyber-btn" style={{ ...styles.cardActionBtn, background: '#00e5ff', color: '#070a12' }} onClick={() => showToast(`Dispatching patrol unit to ${item.station}.`)}>
                          ASSIGN UNIT
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — STATS PANEL */}
        <div style={styles.statsColumn}>
          {/* STATS PANEL */}
          <div className="chart-card" style={styles.sideStatsCard}>
            <div className="chart-header">
              <span className="chart-title">FEED METRICS</span>
            </div>

            <div style={styles.metricsGrid}>
              <div style={styles.metricItem}>
                <span style={styles.metricLbl}>TOTAL LOGGED</span>
                <span style={styles.metricVal} style={{ ...styles.metricVal, color: '#ffffff' }}>{panelStats.eventsToday}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLbl}>CRITICAL EVENTS</span>
                <span style={styles.metricVal} style={{ ...styles.metricVal, color: '#ff2d55' }}>{panelStats.criticalCount}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLbl}>ACTIVE DISTRICTS</span>
                <span style={styles.metricVal} style={{ ...styles.metricVal, color: '#ffaa00' }}>{panelStats.districtsActive}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLbl}>LAST UPDATE</span>
                <span style={styles.metricVal} style={{ ...styles.metricVal, color: '#00e5ff', fontSize: '13px' }}>{panelStats.lastUpdate}</span>
              </div>
            </div>

            {/* Small Pie Chart */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #1e2d3d', paddingTop: '16px' }}>
              <div style={styles.pieTitle}>CRIME PROFILE RATIOS</div>
              <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                {feedItems.length === 0 ? (
                  <div style={styles.pieEmpty}>No Profile Data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #1e2d3d', fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
  },
  feedPanel: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    display: 'flex',
    flexDirection: 'column',
    height: '600px',
    boxSizing: 'border-box'
  },
  controlBtn: {
    padding: '4px 10px',
    fontSize: '9px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  feedScroll: {
    flexGrow: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
    boxSizing: 'border-box'
  },
  feedCard: {
    background: '#070a12',
    border: '1px solid #1e2d3d',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  feedCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedTime: {
    fontFamily: 'monospace',
    color: '#4f616d',
    fontSize: '11px',
  },
  feedDistrictTag: {
    fontFamily: 'monospace',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  feedMessage: {
    fontSize: '12px',
    color: '#ffffff',
  },
  feedFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #121822',
    paddingTop: '8px',
  },
  crimeTag: {
    fontSize: '10px',
    color: '#4f616d',
    fontFamily: 'monospace',
  },
  cardActionBtn: {
    padding: '3px 8px',
    fontSize: '9px',
  },
  statsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sideStatsCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  metricItem: {
    background: '#070a12',
    border: '1px solid #1e2d3d',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
  },
  metricLbl: {
    fontFamily: 'monospace',
    fontSize: '8px',
    color: '#4f616d',
    letterSpacing: '0.5px',
  },
  metricVal: {
    fontFamily: 'monospace',
    fontSize: '16px',
    fontWeight: '700',
    marginTop: '4px',
  },
  pieTitle: {
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#8a9ba8',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  pieEmpty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#4f616d',
    fontSize: '10px',
    fontFamily: 'monospace',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px',
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
    gap: '10px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
    zIndex: 9999,
  }
};

export default LiveIntelFeed;
