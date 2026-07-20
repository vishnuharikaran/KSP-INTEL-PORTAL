import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Check, Info, X, AlertTriangle 
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

function CrimeCalendar({ onNavigateToCase }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = 
    useState(today.getMonth());
  const [currentYear, setCurrentYear] = 
    useState(today.getFullYear());
  const [crimesData, setCrimesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedCrimeType, setSelectedCrimeType] = useState("All Crime Types");
  const [calendarData, setCalendarData] = useState(null);
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [successToast, setSuccessToast] = useState("");

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", 
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  useEffect(() => {
    setIsLoading(true);
    setSelectedDay(null);
    
    const host = window.location.port === '5173' ? 'http://127.0.0.1:8000' : '';
    const url = `${host}/api/calendar?month=${currentMonth + 1}&year=${currentYear}` + 
      (selectedDistrict && selectedDistrict !== "All Districts" ? `&district=${encodeURIComponent(selectedDistrict)}` : "");
    
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then(data => {
        setCalendarData(data);
        let fetched = Array.isArray(data) ? data : [];
        if (data && !Array.isArray(data)) {
          if (data.days) {
            fetched = data.days.flatMap(d => (d.events || []).map(e => ({
              ...e,
              DateOfIncident: d.date,
              date_of_incident: d.date,
              CrimeType: e.crime_type,
              crime_type: e.crime_type,
              victim_district: e.victim_district
            })));
          }
        }
        setCrimesData(fetched);
        setIsLoading(false);
      })
      .catch(() => {
        setCrimesData([]);
        setIsLoading(false);
      });
  }, [currentMonth, currentYear, selectedDistrict]);

  const handlePrevMonth = () => {
    setSelectedDay(null);
    setSelectedDayDetail(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    setSelectedDayDetail(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3000);
  };

  const getDayCrimes = (day) => {
    if (!Array.isArray(crimesData)) return [];
    return crimesData.filter(c => {
      if (!c) return false;
      const dateStr = c.DateOfIncident || c.date_of_incident;
      if (!dateStr) return false;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        return (
          d.getDate() === day &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      } catch {
        return false;
      }
    });
  };

  const daysInMonth = new Date(
    currentYear, currentMonth + 1, 0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentYear, currentMonth, 1
  ).getDay();

  const dailyAverage = daysInMonth > 0
    ? crimesData.length / daysInMonth
    : 0;

  const isPrimeDate = (day) => {
    if (dailyAverage === 0) return false;
    return getDayCrimes(day).length > dailyAverage * 1.5;
  };

  const calendarDays = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const getCrimeColor = (crimeType) => {
    const colors = {
      'Murder':          'rgba(255,45,85,0.7)',
      'Robbery':         'rgba(255,107,53,0.7)',
      'Theft':           'rgba(255,170,0,0.7)',
      'Cybercrime':      'rgba(0,229,255,0.5)',
      'Assault':         'rgba(191,90,242,0.7)',
      'Fraud':           'rgba(0,122,255,0.7)',
      'Kidnapping':      'rgba(255,45,85,0.5)',
      'Drug Trafficking':'rgba(0,255,136,0.5)',
      'Vehicle Theft':   'rgba(255,170,0,0.5)',
      'Domestic Violence':'rgba(191,90,242,0.5)'
    };
    return colors[crimeType] || 'rgba(100,116,139,0.5)';
  };

  const getFilteredEvents = (dayEvents) => {
    if (!dayEvents) return [];
    if (selectedCrimeType === "All Crime Types") return dayEvents;
    return dayEvents.filter(e => e.crime_type === selectedCrimeType || e.CrimeType === selectedCrimeType);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          height: '48px',
          width: '300px',
          background: 'linear-gradient(90deg, var(--bg-card) 25%, #1a2332 50%, var(--bg-card) 75%)',
          backgroundSize: '400% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '8px',
          marginBottom: '24px'
        }} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px'
        }}>
          {Array(35).fill(null).map((_, i) => (
            <div key={i} style={{
              height: '100px',
              background: 'linear-gradient(90deg, var(--bg-card) 25%, #1a2332 50%, var(--bg-card) 75%)',
              backgroundSize: '400% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '8px'
            }} />
          ))}
        </div>
      </div>
    );
  }

  const summary = calendarData?.summary || {
    total_this_month: crimesData.length,
    most_common_crime: "Cybercrime"
  };
  const heatmap = calendarData?.heatmap || [];
  const maxHeatmapCount = heatmap.length > 0 ? Math.max(...heatmap.map(h => h.count || 0)) : 0;

  const primeDatesList = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .filter(day => isPrimeDate(day))
    .map(day => {
      const dayCrimes = getDayCrimes(day);
      const crimeCounts = {};
      dayCrimes.forEach(e => {
        const ct = e.CrimeType || e.crime_type || "Unknown";
        crimeCounts[ct] = (crimeCounts[ct] || 0) + 1;
      });
      const topCrime = Object.keys(crimeCounts).sort((a,b) => crimeCounts[b] - crimeCounts[a])[0] || summary.most_common_crime;
      const vsAvg = dailyAverage > 0 ? Math.round(((dayCrimes.length - dailyAverage) / dailyAverage) * 100) : 0;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      return {
        date: dateStr,
        count: dayCrimes.length,
        topCrime,
        vsAvg
      };
    });

  const weekdayCounts = { "Sunday": 0, "Monday": 0, "Tuesday": 0, "Wednesday": 0, "Thursday": 0, "Friday": 0, "Saturday": 0 };
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  crimesData.forEach(c => {
    const dateStr = c.DateOfIncident || c.date_of_incident;
    if (dateStr) {
      try {
        const dt = new Date(dateStr);
        if (!isNaN(dt.getTime())) {
          const dayName = weekdayNames[dt.getDay()];
          weekdayCounts[dayName] = (weekdayCounts[dayName] || 0) + 1;
        }
      } catch {}
    }
  });

  const peakWeekday = Object.keys(weekdayCounts).sort((a,b) => weekdayCounts[b] - weekdayCounts[a])[0] || "Wednesday";
  const nextMonthName = monthNames[(currentMonth + 1) % 12];
  const activeDistrictName = selectedDistrict === "All Districts" ? "Karnataka overall limits" : selectedDistrict;

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      {successToast && (
        <div style={styles.toast}>
          <Check size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* HEADER ROW */}
      <div className="chart-card" style={styles.headerCard}>
        <div style={styles.headerLeft}>
          <button className="cyber-btn-outline" onClick={handlePrevMonth} style={styles.navBtn}>
            <ChevronLeft size={16} />
            <span>PREV MONTH</span>
          </button>
          <span style={styles.monthLabel}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button className="cyber-btn-outline" onClick={handleNextMonth} style={styles.navBtn}>
            <span>NEXT MONTH</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={styles.headerRight}>
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
            value={selectedCrimeType}
            onChange={e => setSelectedCrimeType(e.target.value)}
            className="cyber-input"
            style={styles.filterDropdown}
          >
            <option>All Crime Types</option>
            {CRIME_TYPES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={styles.layoutBody}>
        {/* CALENDAR GRID */}
        <div style={styles.calendarContainer}>
          <div style={styles.weekHeader}>
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
              <div key={day} style={styles.weekDayLabel}>{day}</div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px'
          }}>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    style={{ 
                      minHeight: '90px',
                      background: 'transparent'
                    }}
                  />
                );
              }

              const dayCrimes = getDayCrimes(day);
              const isPrime = isPrimeDate(day);
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => {
                    setSelectedDay(day);
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    setSelectedDayDetail({
                      date: dateStr,
                      events: dayCrimes.map(c => ({
                        id: c.id || c.MissingID || c.VictimID || c.CaseID || 'N/A',
                        crime_type: c.CrimeType || c.crime_type || 'Unknown',
                        victim_district: c.victim_district || c.District || 'Unknown',
                        status: c.status || c.Status || 'Active'
                      }))
                    });
                  }}
                  style={{
                    minHeight: '90px',
                    background: isPrime
                      ? 'rgba(255,45,85,0.08)'
                      : 'var(--bg-card)',
                    border: isToday
                      ? '1px solid rgba(0,229,255,0.4)'
                      : isPrime
                      ? '1px solid rgba(255,45,85,0.25)'
                      : '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    fontSize: '13px',
                    fontFamily: 'JetBrains Mono',
                    fontWeight: '600',
                    color: isToday
                      ? 'var(--cyan)'
                      : isPrime
                      ? 'var(--red)'
                      : 'rgba(255,255,255,0.8)',
                    marginBottom: '6px'
                  }}>
                    {day}
                    {isPrime && (
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--red)',
                        display: 'block'
                      }} />
                    )}
                  </div>

                  {dayCrimes.slice(0, 3).map((crime, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        marginBottom: '2px',
                        background: getCrimeColor(
                          crime?.CrimeType || crime?.crime_type
                        ),
                        color: 'white',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {crime?.CrimeType || crime?.crime_type || 'Unknown'}
                    </div>
                  ))}

                  {dayCrimes.length > 3 && (
                    <div style={{
                      fontSize: '10px',
                      color: 'var(--text-label)',
                      marginTop: '2px'
                    }}>
                      +{dayCrimes.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* DAY DETAIL PANEL */}
        {selectedDayDetail && (
          <div className="chart-card" style={styles.detailPanel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTitle}>INCIDENTS — {selectedDayDetail.date}</span>
              <X size={16} color="#8a9ba8" style={{ cursor: 'pointer' }} onClick={() => setSelectedDayDetail(null)} />
            </div>

            <div style={styles.panelBody}>
              {getFilteredEvents(selectedDayDetail.events).length === 0 ? (
                <div style={styles.emptyPanelState}>NO INCIDENTS REPORTED FOR THIS DATE.</div>
              ) : (
                getFilteredEvents(selectedDayDetail.events).map((e, idx) => (
                  <div key={idx} style={styles.incidentRow}>
                    <div style={styles.incidentRowHeader}>
                      <span className="mono" style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>{e.id}</span>
                      <span className="badge" style={{ backgroundColor: 'rgba(0, 229, 255, 0.05)', color: 'var(--cyan)' }}>{e.status}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#fff', marginTop: '4px' }}>
                      <strong>Crime:</strong> {e.crime_type}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8a9ba8', marginTop: '2px' }}>
                      <strong>District:</strong> {e.victim_district}
                    </div>
                    <button 
                      className="cyber-btn-outline" 
                      onClick={() => {
                        if (onNavigateToCase) {
                          onNavigateToCase(e.id);
                        }
                      }}
                      style={{ width: '100%', padding: '4px', fontSize: '9px', marginTop: '8px' }}
                    >
                      <Info size={10} style={{ marginRight: '4px' }} />
                      <span>TRACK LIFECYCLE</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MONTHLY SUMMARY ROW */}
      <div className="stats-grid">
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">TOTAL THIS MONTH</div>
          <div className="stat-value">{summary.total_this_month}</div>
          <div className="stat-subtitle">District Log Registry</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">DAILY AVERAGE</div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>{dailyAverage.toFixed(1)}</div>
          <div className="stat-subtitle">Crimes logged per 24h</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">MOST COMMON SCAM</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{summary.most_common_crime}</div>
          <div className="stat-subtitle">Highest volume category</div>
        </div>
      </div>

      {/* PRIME DATES PANEL */}
      <div className="chart-card" style={styles.primeCard}>
        <div className="chart-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
          <span className="chart-title" style={{ color: 'var(--red)' }}>HIGH-RISK DATES — {monthNames[currentMonth]} {currentYear}</span>
        </div>
        
        {primeDatesList.length === 0 ? (
          <div style={styles.emptyPanelState}>NO HIGH-RISK DATES IDENTIFIED (ALL BELOW 1.5X AVERAGE).</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {primeDatesList.map(row => (
              <div key={row.date} style={styles.primeRow}>
                <span className="mono" style={{ fontWeight: 'bold', color: 'var(--red)', minWidth: '100px' }}>{row.date}</span>
                <span style={{ color: '#ffffff', minWidth: '80px' }}>{row.count} Cases</span>
                <span className="badge" style={{ backgroundColor: 'rgba(0, 229, 255, 0.05)', color: 'var(--cyan)', minWidth: '120px', textAlign: 'center' }}>
                  {row.topCrime}
                </span>
                <span style={{ color: 'var(--red)', fontWeight: 'bold', marginLeft: 'auto' }}>
                  vs Daily Avg: +{row.vsAvg}%
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.patternBox}>
          <AlertTriangle size={14} color="var(--red)" style={{ marginTop: '2px' }} />
          <div style={{ fontSize: '11px', color: '#8a9ba8', lineHeight: '1.4' }}>
            <strong>PATTERN ANALYSIS:</strong> Crime peaks observed on <strong>{peakWeekday}</strong> in <strong>{activeDistrictName}</strong>. Historical pattern suggests <strong>{nextMonthName} 08th to 16th</strong> will be high risk.
          </div>
        </div>
      </div>

      {/* ANNUAL HEATMAP ROW */}
      <div className="chart-card" style={styles.heatmapCard}>
        <div className="chart-header">
          <span className="chart-title">ANNUAL INCIDENT DENSITY HEATMAP (2026)</span>
        </div>
        <div style={styles.heatmapStrip}>
          {heatmap.map((h) => {
            // Calculate opacity based on relative count
            const opacity = maxHeatmapCount > 0 ? (h.count / maxHeatmapCount) : 0;
            return (
              <div key={h.month} style={styles.heatmapBlockCol}>
                <div 
                  style={{ 
                    ...styles.heatmapBlock, 
                    backgroundColor: 'var(--cyan)',
                    opacity: Math.max(0.1, opacity) 
                  }} 
                  title={`${h.month}: ${h.count} cases`}
                />
                <span style={styles.heatmapLabel}>{h.month}</span>
              </div>
            );
          })}
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
    gap: '20px',
  },
  headerCard: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navBtn: {
    padding: '4px 8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
  },
  monthLabel: {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: '1px',
    minWidth: '140px',
    textAlign: 'center',
  },
  headerRight: {
    display: 'flex',
    gap: '10px',
  },
  filterDropdown: {
    height: '32px',
    background: '#070a12',
    border: '1px solid var(--border)',
    color: '#ffffff',
    fontSize: '11px',
    padding: '0 8px',
  },
  layoutBody: {
    display: 'flex',
    gap: '20px',
    width: '100%',
  },
  calendarContainer: {
    flexGrow: 1,
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    padding: '16px',
  },
  weekHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '6px',
    marginBottom: '10px',
  },
  weekDayLabel: {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#4f616d',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gridAutoRows: '85px',
    gap: '6px',
  },
  offsetCell: {
    background: '#070a12',
    opacity: 0.25,
    border: '1px dashed var(--border)',
  },
  dayCell: {
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  dayNumber: {
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  pillContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
  },
  eventPill: {
    fontSize: '8px',
    padding: '2px 4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#ffffff',
    fontFamily: 'sans-serif',
  },
  moreLabel: {
    fontSize: '8px',
    color: '#4f616d',
    fontFamily: 'monospace',
    marginTop: '2px',
    textAlign: 'right',
  },
  detailPanel: {
    width: '260px',
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  panelHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: 'var(--cyan)',
    fontWeight: 'bold',
  },
  panelBody: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyPanelState: {
    textAlign: 'center',
    color: '#4f616d',
    fontFamily: 'monospace',
    fontSize: '10px',
    padding: '40px 0',
  },
  incidentRow: {
    background: '#070a12',
    border: '1px solid var(--border)',
    padding: '10px',
  },
  incidentRowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCard: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
  },
  heatmapCard: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
  },
  heatmapStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 20px 20px',
  },
  heatmapBlockCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  heatmapBlock: {
    width: '45px',
    height: '45px',
    borderRadius: '4px',
  },
  heatmapLabel: {
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#8a9ba8',
  },
  primeCard: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    padding: '20px',
  },
  primeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#070a12',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--red)',
    padding: '10px 14px',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
  patternBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    background: 'rgba(255, 45, 85, 0.05)',
    border: '1px dashed var(--red-border)',
    padding: '12px',
    marginTop: '16px',
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
    gap: '10px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
    zIndex: 9999,
  }
};

export default CrimeCalendar;
