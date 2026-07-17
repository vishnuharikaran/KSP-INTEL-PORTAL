import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, Shield, Activity, Landmark, Volume2, VolumeX } from 'lucide-react';

const DISTRICTS = [
  "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", 
  "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", 
  "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", 
  "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", 
  "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", 
  "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir", 
  "Vijayanagara"
];

function Overview({ flaggedCases = [], scrbEscalations = [] }) {
  const [data, setData] = useState(null);
  const [topDistricts, setTopDistricts] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown & Mute States
  const [selectedDistrict, setSelectedDistrict] = useState('All Karnataka');
  const [isMuted, setIsMuted] = useState(localStorage.getItem('ksp_muted') === 'true');

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const [overviewRes, districtsRes, complaintsRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/overview'),
          fetch('http://127.0.0.1:8000/api/districts'),
          fetch('http://127.0.0.1:8000/api/complaints?limit=1000')
        ]);

        if (!overviewRes.ok || !districtsRes.ok) {
          throw new Error('Failed to fetch dashboard overview metrics.');
        }

        const overviewResult = await overviewRes.json();
        const districtsResult = await districtsRes.json();
        const complaintsResult = complaintsRes.ok ? await complaintsRes.json() : { records: [] };

        setData(overviewResult);
        setComplaints(complaintsResult.records || []);
        
        // Extract top 10 districts by complaint count
        const sortedDistricts = [...districtsResult]
          .sort((a, b) => b.cases - a.cases)
          .slice(0, 10);
        setTopDistricts(sortedDistricts);
      } catch (err) {
        setError(err.message || 'Error connecting to database server.');
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const formatINR = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('ksp_muted', String(newMuted));
    
    // Immediately stop any audio elements playing in the page
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const calculateDistrictTrend = (distName) => {
    const monthlyMap = {};
    for (const year of [2024, 2025, 2026]) {
      for (let month = 1; month <= 12; month++) {
        const ym = `${year}-${String(month).padStart(2, '0')}`;
        monthlyMap[ym] = { cases: 0, loss: 0 };
      }
    }
    
    const filtered = complaints.filter(c => c.victim_district === distName);
    filtered.forEach(c => {
      const ym = c.date_of_incident.substring(0, 7);
      if (monthlyMap[ym]) {
        monthlyMap[ym].cases += 1;
        monthlyMap[ym].loss += c.loss_amount_inr;
      }
    });

    return Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, d]) => ({
        month,
        cases: d.cases,
        loss: d.loss
      }));
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <div style={styles.loadingText}>SYNCHRONIZING SECURE REPOSITORY DATA...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorHeader}>RECONCILIATION ERROR</div>
        <p>{error}</p>
      </div>
    );
  }

  const { stats, monthly_trend } = data;

  const currentChartData = selectedDistrict === 'All Karnataka'
    ? monthly_trend
    : calculateDistrictTrend(selectedDistrict);

  return (
    <div style={styles.container}>
      {/* 4 Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={styles.statHeader}>
            <span className="stat-label">TOTAL REGISTERED CASES</span>
            <Activity size={16} color="#00e5ff" />
          </div>
          <div className="stat-value">{stats.total_complaints.toLocaleString()}</div>
          <div className="stat-subtitle">Karnataka State Database</div>
        </div>

        <div className="stat-card">
          <div style={styles.statHeader}>
            <span className="stat-label">ACCUSED ARRESTED</span>
            <Shield size={16} color="#34c759" />
          </div>
          <div className="stat-value" style={{ color: '#34c759' }}>
            {stats.arrested.toLocaleString()}
          </div>
          <div className="stat-subtitle">
            {((stats.arrested / stats.total_complaints) * 100).toFixed(1)}% Resolution Rate
          </div>
        </div>

        <div className="stat-card">
          <div style={styles.statHeader}>
            <span className="stat-label">ACTIVE INVESTIGATIONS</span>
            <TrendingUp size={16} color="#ff9500" />
          </div>
          <div className="stat-value" style={{ color: '#ff9500' }}>
            {stats.under_investigation.toLocaleString()}
          </div>
          <div className="stat-subtitle">
            {((stats.under_investigation / stats.total_complaints) * 100).toFixed(1)}% Under Active Intel
          </div>
        </div>

        <div className="stat-card">
          <div style={styles.statHeader}>
            <span className="stat-label">TOTAL FINANCIAL LOSS</span>
            <Landmark size={16} color="#ff3b30" />
          </div>
          <div className="stat-value" style={{ color: '#ff3b30' }}>
            {formatINR(stats.total_loss)}
          </div>
          <div className="stat-subtitle">Cumulative Fraud Amount</div>
        </div>
      </div>

      {/* Main wide monthly trend line chart */}
      <div className="chart-card" style={{ marginBottom: '20px' }}>
        <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="chart-title">MONTHLY INCIDENT VOLUMES (2024 - 2026)</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '10px', color: '#8a9ba8', fontFamily: 'monospace' }}>FILTER BY DISTRICT:</span>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="cyber-input"
              style={styles.filterDropdown}
            >
              <option value="All Karnataka">All Karnataka</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <button 
              onClick={toggleMute} 
              className="cyber-btn-outline" 
              style={styles.muteBtn}
              title={isMuted ? "Unmute sounds" : "Mute sounds"}
            >
              {isMuted ? <VolumeX size={14} color="#ff2d55" /> : <Volume2 size={14} color="#00e5ff" />}
            </button>
          </div>
        </div>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={currentChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid stroke="#1a2a3a" strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                stroke="#00e5ff" 
                style={{ fontFamily: 'monospace', fontSize: '10px' }}
              />
              <YAxis 
                stroke="#00e5ff" 
                style={{ fontFamily: 'monospace', fontSize: '10px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0d14',
                  border: '1px solid #1a2a3a',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  borderRadius: 0,
                }}
                itemStyle={{ color: '#00e5ff' }}
                labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="cases" 
                name="Incidents"
                stroke="#00e5ff" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4, stroke: '#0a0d14', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Districts Hotspots - Now takes full width of bottom row */}
      <div className="chart-card" style={{ marginBottom: '20px' }}>
        <div className="chart-header">
          <span className="chart-title">TOP 10 DISTRICT HOTSPOTS</span>
        </div>
        <div style={{ height: '260px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topDistricts}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <CartesianGrid stroke="#1a2a3a" strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                stroke="#00e5ff" 
                style={{ fontFamily: 'monospace', fontSize: '9px' }}
              />
              <YAxis 
                stroke="#00e5ff" 
                style={{ fontFamily: 'monospace', fontSize: '10px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0d14',
                  border: '1px solid #1a2a3a',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  borderRadius: 0,
                }}
                itemStyle={{ color: '#00e5ff' }}
              />
              <Bar dataKey="cases" name="Cases" fill="#00e5ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FLAGGED FOR REVIEW SECTION */}
      <div className="chart-card" style={{ marginBottom: '20px' }}>
        <div className="chart-header">
          <span className="chart-title" style={{ color: '#ffaa00' }}>FLAGGED FOR REVIEW (INVESTIGATOR DASHBOARD)</span>
        </div>
        {flaggedCases.length === 0 ? (
          <div style={styles.emptyTableText}>NO CASES FLAGGED FOR REVIEW.</div>
        ) : (
          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>CASE ID</th>
                  <th>CRIME TYPE</th>
                  <th>DISTRICT</th>
                  <th>ANOMALY REASON</th>
                  <th>FLAGGED AT</th>
                </tr>
              </thead>
              <tbody>
                {flaggedCases.map(c => (
                  <tr key={c.id}>
                    <td className="mono" style={{ color: '#00e5ff', fontWeight: 'bold' }}>{c.id}</td>
                    <td>{c.crime_type}</td>
                    <td>{c.victim_district || c.district}</td>
                    <td style={{ color: '#ffaa00' }}>{c.reason || 'Flagged behavioral anomaly'}</td>
                    <td className="mono">{c.flaggedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SCRB ESCALATIONS SECTION */}
      <div className="chart-card">
        <div className="chart-header">
          <span className="chart-title" style={{ color: '#ff2d55' }}>SCRB ESCALATIONS</span>
        </div>
        {scrbEscalations.length === 0 ? (
          <div style={styles.emptyTableText}>NO CASES ESCALATED TO SCRB.</div>
        ) : (
          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>SCRB REF NO</th>
                  <th>CASE ID</th>
                  <th>CRIME TYPE</th>
                  <th>DISTRICT</th>
                  <th>ANOMALY REASON</th>
                  <th>ESCALATED AT</th>
                </tr>
              </thead>
              <tbody>
                {scrbEscalations.map(c => (
                  <tr key={c.id}>
                    <td className="mono" style={{ color: '#FFD700', fontWeight: 'bold' }}>{c.scrbRef}</td>
                    <td className="mono" style={{ color: '#00e5ff' }}>{c.id}</td>
                    <td>{c.crime_type}</td>
                    <td>{c.victim_district || c.district}</td>
                    <td style={{ color: '#ff2d55' }}>{c.reason || 'Critical security escalation'}</td>
                    <td className="mono">{c.escalatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '20px'
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  statLabel: {
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#8a9ba8',
    letterSpacing: '0.5px'
  },
  filterDropdown: {
    background: '#070a12',
    border: '1px solid #1e2d3d',
    color: '#ffffff',
    fontSize: '11px',
    fontFamily: 'monospace',
    height: '28px',
    padding: '0 6px',
    outline: 'none',
    cursor: 'pointer'
  },
  muteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    cursor: 'pointer'
  },
  emptyTableText: {
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#4f616d',
    padding: '24px'
  },
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
  }
};

export default Overview;
