import React, { useState, useEffect, useRef } from 'react';
import printExport from '../utils/printExport';
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
  const [selectedDistrict, setSelectedDistrict] = 
    useState('Bengaluru Urban');
  const [districtData, setDistrictData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertPassword, setAlertPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [alertAcknowledged, setAlertAcknowledged] = useState({});
  const shownRef = useRef({});

  // Suspect Dossier Modal State
  const [selectedOffenderId, setSelectedOffenderId] = useState(null);
  const [offenderDossier, setOffenderDossier] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (!selectedDistrict) return;
    if (shownRef.current[selectedDistrict]) return;
    if (!districtData || districtData.length === 0) return;
    shownRef.current[selectedDistrict] = true;
    const timer = setTimeout(() => {
      setShowAlert(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedDistrict, districtData]);

  useEffect(() => {
    if (!selectedDistrict) return;
    setIsLoading(true);
    setDistrictData([]);
    
    const host = window.location.port === '5173' ? 'http://127.0.0.1:8000' : '';
    fetch(`${host}/api/district-stats?district=${encodeURIComponent(selectedDistrict)}`)
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(data => {
        const fetchedData = Array.isArray(data) ? data : [];
        if (data && !Array.isArray(data)) {
          Object.assign(fetchedData, data);
          fetchedData.length = Object.keys(data).length || 1;
        }
        setDistrictData(fetchedData);
        setIsLoading(false);
      })
      .catch(() => {
        setDistrictData([]);
        setIsLoading(false);
      });
  }, [selectedDistrict]);

  // Modals Escape Listener
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setShowAlert(false);
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
    const hotspotStations = (mom_table || []).map(row => {
      const total_cases = row.total_cases ?? 0;
      const resolved = row.resolved ?? 0;
      const unresolved = row.unresolved ?? (total_cases - resolved);
      const unresolved_pct = total_cases > 0 ? Math.round((unresolved / total_cases) * 100) : 0;
      return {
        station_name: row.station ?? row.district ?? '',
        total_cases,
        resolved,
        unresolved,
        unresolved_pct,
        top_crime: row.top_crime ?? '',
        status: row.status ?? 'NORMAL'
      };
    });

    const topOffenders = top_offenders || [];

    const districtStats = {
      total_cases: overview.total_cases,
      resolved: overview.resolved,
      active: overview.active,
      repeat_offenders: overview.repeat_offenders,
      peak_day: peakDayName,
      peak_hour: startH,
      peak_crime: topCrimeType
    };

    const stationRows = (hotspotStations || [])
      .map(s => `
        <tr>
          <td>${s.station_name || '—'}</td>
          <td>${s.total_cases ?? 0}</td>
          <td>${s.unresolved ?? 0}
            <span style="color:#94a3b8;
              font-size:10px">
              (${s.unresolved_pct ?? 0}%)
            </span>
          </td>
          <td>${s.top_crime || '—'}</td>
          <td>${s.resolved ?? 0}</td>
          <td class="${
            s.status === 'OVERLOADED' ? 'status-high':
            s.status === 'ACTIVE'     ? 'status-med' :
            'status-low'
          }">${s.status || 'NORMAL'}</td>
        </tr>
      `).join('');

    const offenderRows = (topOffenders || [])
      .slice(0, 5)
      .map(o => `
        <tr>
          <td>${o.offender_id || '—'}</td>
          <td>${o.crime_type || '—'}</td>
          <td>${o.mo || '—'}</td>
          <td>${o.prior_convictions ?? 0}</td>
          <td class="${
            o.status === 'CRITICAL' ? 'status-high' :
            o.status === 'HIGH'     ? 'status-med' :
            'status-low'
          }">${o.status || '—'}</td>
        </tr>
      `).join('');

    printExport({
      title: `DISTRICT INTELLIGENCE REPORT`,
      subtitle: `${selectedDistrict} — 
        Detailed crime analytics and 
        station performance`,
      filename: `KSP_District_${
        selectedDistrict?.replace(/\s+/g,'_')
      }_${new Date().toISOString().split('T')[0]}`,
      content: `

        <!-- STAT STRIP -->
        <div class="stat-row">
          <div class="stat-box">
            <div class="stat-box-label">
              Total Cases
            </div>
            <div class="stat-box-value">
              ${districtStats?.total_cases ?? 0}
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-box-label">Resolved</div>
            <div class="stat-box-value">
              ${districtStats?.resolved ?? 0}
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-box-label">
              Active Investigations
            </div>
            <div class="stat-box-value">
              ${districtStats?.active ?? 0}
            </div>
          </div>
          <div class="stat-box">
            <div class="stat-box-label">
              Repeat Offenders
            </div>
            <div class="stat-box-value">
              ${districtStats?.repeat_offenders ?? 0}
            </div>
          </div>
        </div>

        <!-- HOTSPOT STATIONS -->
        <div class="section-heading">
          Crime Hotspot Police Stations
        </div>
        <table>
          <thead>
            <tr>
              <th>Station</th>
              <th>Total Cases</th>
              <th>Unresolved</th>
              <th>Top Crime</th>
              <th>Resolved</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${stationRows || '<tr><td colspan="6">No station data</td></tr>'}
          </tbody>
        </table>

        <!-- TOP OFFENDERS -->
        <div class="section-heading">
          Top Active Offenders in District
        </div>
        <table>
          <thead>
            <tr>
              <th>Offender ID</th>
              <th>Crime Type</th>
              <th>Modus Operandi</th>
              <th>Prior Conv.</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            ${offenderRows || '<tr><td colspan="5">No offender data</td></tr>'}
          </tbody>
        </table>

        <!-- PRIME TIME INTELLIGENCE -->
        <div class="section-heading">
          Prime Time Intelligence
        </div>
        <div class="alert-card alert-card-amber">
          <div class="alert-card-title">
            Peak Crime Window — ${selectedDistrict}
          </div>
          <div class="alert-card-body">
            Peak Day: <strong>
              ${districtStats?.peak_day ?? 'Friday'}
            </strong> &nbsp;|&nbsp;
            Peak Hour: <strong>
              ${districtStats?.peak_hour ?? '22'}:00
              — ${(districtStats?.peak_hour ?? 22) + 1}
              :00 hrs
            </strong> &nbsp;|&nbsp;
            Top Crime: <strong>
              ${districtStats?.peak_crime ?? 'Robbery'}
            </strong>
          </div>
        </div>
      `
    });
  };

  const handlePasswordSubmit = () => {
    if (alertPassword === 'KSP2026') {
      setShowAlert(false);
      setAlertPassword('');
      setPasswordError(false);
      setAlertAcknowledged(prev => ({
        ...prev,
        [selectedDistrict]: true
      }));
    } else {
      setPasswordError(true);
      setAlertPassword('');
      setTimeout(() => setPasswordError(false), 2000);
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

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        {/* Skeleton for stat cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{
              height: '100px',
              background: 'linear-gradient(90deg, var(--bg-card) 25%, #1a2332 50%, var(--bg-card) 75%)',
              backgroundSize: '400% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '10px'
            }} />
          ))}
        </div>
        {/* Skeleton for charts */}
        <div style={{
          height: '300px',
          background: 'linear-gradient(90deg, var(--bg-card) 25%, #1a2332 50%, var(--bg-card) 75%)',
          backgroundSize: '400% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '10px'
        }} />
      </div>
    );
  }

  const {
    overview = {
      total_cases: 0,
      active_cases: 0,
      resolved_cases: 0,
      repeat_offenders_count: 0,
      avg_loss: 0
    },
    monthly_chart = [],
    temporal_hour = [],
    peak_hour = 0,
    temporal_day = [],
    hotspots = [],
    age_chart = [],
    repeat_chart = [],
    top_offenders = [],
    comparison = [],
    mom_table = []
  } = districtData || {};

  // Day of week peak color styling
  const maxDayCount = temporal_day && temporal_day.length > 0 ? Math.max(...temporal_day.map(d => d.count || 0)) : 0;
  const peakDayName = temporal_day && temporal_day.length > 0 ? [...temporal_day].sort((a,b) => (b.count || 0) - (a.count || 0))[0]?.day || "Wednesday" : "Wednesday";
  const peakHourStr = temporal_hour && temporal_hour.length > 0 && peak_hour !== undefined ? (temporal_hour[peak_hour]?.hour || "12:00") : "12:00";
  const topCrimeType = districtData && districtData.crime_mix && districtData.crime_mix.length > 0
    ? [...districtData.crime_mix].sort((a,b) => b.value - a.value)[0]?.name
    : "UPI Fraud";

  // Calculate next hour for risk window
  const startH = parseInt(peakHourStr.split(":")[0]);
  const endH = (startH + 2) % 24;
  const endHourStr = `${String(endH).padStart(2, '0')}:00`;

  // Custom Bar for Day of week distribution to highlight peak day in red
  const CustomDayBar = (props) => {
    const { fill, x, y, width, height, count } = props;
    const isPeak = count === maxDayCount;
    return <rect x={x} y={y} width={width} height={height} fill={isPeak ? 'var(--red)' : 'var(--cyan)'} />;
  };

  return (
    <div style={styles.container}>
      {toastMsg && (
        <div style={styles.toast}>
          <CheckCircle size={14} style={{ marginRight: '6px' }} />
          <span>{toastMsg}</span>
        </div>
      )}



      {/* TOP — DISTRICT SELECTOR */}
      <div className="chart-card no-print" style={styles.selectorCard}>
        <div style={styles.selectorGrid}>
          <div style={styles.selectCol}>
            <label style={styles.selectorLabel}>SELECT DISTRICT TO ANALYSE</label>
            <select 
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="cyber-input"
              style={{ width: '100%', height: '38px', background: '#070a12', border: '1px solid var(--border)', color: '#fff', padding: '0 8px' }}
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
          <div className="stat-value" style={{ color: 'var(--green)' }}>{overview.resolved.toLocaleString()}</div>
          <div className="stat-subtitle">Status: Closed / Arrested</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">ACTIVE INVESTIGATIONS</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{overview.active.toLocaleString()}</div>
          <div className="stat-subtitle">Under active investigation</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">REPEAT OFFENDERS COUNT</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{overview.repeat_offenders.toLocaleString()}</div>
          <div className="stat-subtitle">Suspects with priors &gt; 1</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">AVERAGE LOSS AMOUNT</div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>₹{overview.avg_loss.toLocaleString()}</div>
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
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="#8a9ba8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#8a9ba8" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={styles.chartTooltip} />
              <Bar dataKey="cases" fill="var(--cyan)" barSize={35} />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="hour" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={styles.chartTooltip} />
                  <Area type="monotone" dataKey="count" stroke="var(--cyan)" fill="var(--cyan-bg)" />
                  <ReferenceLine x={temporal_hour[peak_hour]?.hour} stroke="var(--red)" label={{ value: `PEAK: ${temporal_hour[peak_hour]?.hour}`, fill: 'var(--red)', position: 'top', fontSize: 9 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.halfWidthCard}>
            <div style={styles.subChartTitle}>RISK PROFILE BY DAY OF WEEK</div>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={temporal_day} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
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
                const badgeColor = row.status === "OVERLOADED" ? "var(--red)" : row.status === "ACTIVE" ? "var(--amber)" : "var(--green)";
                const unresolvedCount = row.cases - row.resolved;
                const unresolvedPct = row.cases > 0 ? Math.round((unresolvedCount / row.cases) * 100) : 0;
                const unresolvedColor = unresolvedCount > 20 ? 'var(--red)' : unresolvedCount >= 10 ? 'var(--amber)' : '#ffffff';

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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="group" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                <YAxis stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={styles.chartTooltip} />
                <Bar dataKey="count" fill="var(--purple)" barSize={30} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                <YAxis stroke="#8a9ba8" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={styles.chartTooltip} />
                <Bar dataKey="value" fill="var(--green)" barSize={30} />
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
                  <td className="mono" style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>{offender.offender_id}</td>
                  <td>{offender.crime_type}</td>
                  <td style={{ fontSize: '11px', color: '#8a9ba8' }}>{offender.mo}</td>
                  <td className="mono">{offender.prior_convictions}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: 'var(--red-bg)', color: 'var(--red)', borderColor: 'rgba(255, 45, 85, 0.2)' }}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
              <YAxis dataKey="metric" type="category" stroke="#8a9ba8" tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={styles.chartTooltip} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="district_val" name="District" fill="var(--cyan)" />
              <Bar dataKey="state_avg" name="State Avg" fill="var(--amber)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SUSPECT DOSSIER MODAL */}
      {selectedOffenderId && offenderDossier && (
        <div style={styles.modalOverlay}>
          <div className="chart-card" style={styles.modalContainer}>
            <div className="chart-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <span className="chart-title" style={{ color: 'var(--cyan)' }}>SUSPECT DOSSIER — {selectedOffenderId}</span>
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
                    <span className="badge" style={{ backgroundColor: 'var(--red-bg)', color: 'var(--red)' }}>
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
                        <span key={d} className="badge" style={{ backgroundColor: 'rgba(0,229,255,0.08)', color: 'var(--cyan)' }}>{d}</span>
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
      {showAlert && (
        <div style={styles.modalOverlay}>
          <div 
            className="chart-card" 
            style={{ 
              ...styles.alertModalContainer,
              borderTop: passwordError ? '3px solid var(--red)' : '3px solid var(--cyan)',
              position: 'relative'
            }}
          >
            {/* Close button Escape and manual */}
            <button 
              onClick={() => setShowAlert(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-label)',
                cursor: 'pointer',
                fontSize: '16px',
                outline: 'none'
              }}
              title="Close modal (Esc)"
            >
              ✕
            </button>

            <Shield size={32} color={passwordError ? "var(--red)" : "var(--cyan)"} style={{ display: 'block', margin: '0 auto 12px auto' }} />
            
            <div style={styles.alertHeader}>
              <AlertTriangle size={18} color={passwordError ? "var(--red)" : "var(--cyan)"} />
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
                <span style={{ ...styles.alertVal, color: 'var(--red)' }}>
                  {peakDayName.toUpperCase()} {peakHourStr}–{endHourStr}
                </span>
              </div>
            </div>

            <div style={styles.alertDivider}></div>

            <p style={styles.alertWarningText}>
              This intelligence is CONFIDENTIAL. Enter authorization code to acknowledge.
            </p>

            <form onSubmit={e => { e.preventDefault(); handlePasswordSubmit(); }} style={styles.alertForm}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="password"
                  value={alertPassword}
                  onChange={e => {
                    setAlertPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handlePasswordSubmit();
                  }}
                  placeholder="Enter authorization code"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--bg-card)',
                    border: passwordError 
                      ? '1px solid var(--red)' 
                      : '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'white',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '14px',
                    outline: 'none',
                    animation: passwordError 
                      ? 'shake 0.4s ease' 
                      : 'none',
                    marginBottom: '8px'
                  }}
                />
                {passwordError && (
                  <div style={{
                    color: 'var(--red)',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    marginBottom: '12px'
                  }}>
                    ✗ INVALID AUTHORIZATION CODE
                  </div>
                )}
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
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
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
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
  },
  chartRow: {
    display: 'flex',
    gap: '20px',
    width: '100%',
  },
  halfWidthCard: {
    flex: 1,
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    padding: '16px',
    minWidth: 0,
  },
  fullWidthCard: {
    width: '100%',
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
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
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
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
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderTop: '2px solid var(--cyan)',
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
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    padding: '24px',
    boxShadow: '0 0 30px var(--red-bg)',
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--red)',
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
    background: 'var(--border)',
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
    border: '1px solid var(--border)',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: '12px',
    outline: 'none',
    width: '100%',
  },
  alertBtn: {
    height: '36px',
    background: 'var(--red)',
    border: '1px solid var(--red)',
    color: 'var(--bg-panel)',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    cursor: 'pointer',
    fontSize: '11px',
  },
  errorText: {
    fontSize: '9px',
    color: 'var(--red)',
    fontFamily: 'monospace',
    textAlign: 'center',
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

export default DistrictStats;
