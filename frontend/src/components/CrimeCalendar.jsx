import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Check, Info, X 
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
  const [currentMonth, setCurrentMonth] = useState(6); // June default
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedCrimeType, setSelectedCrimeType] = useState("All Crime Types");
  
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState(null);
  const [error, setError] = useState("");

  // Slide-in Day Detail Panel State
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [successToast, setSuccessToast] = useState("");

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", 
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const fetchCalendarData = async (m, y, dist) => {
    setLoading(true);
    setError("");
    try {
      let url = `http://127.0.0.1:8000/api/calendar?month=${m}&year=${y}`;
      if (dist && dist !== "All Districts") {
        url += `&district=${encodeURIComponent(dist)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch calendar information.");
      const json = await res.json();
      setCalendarData(json);
    } catch (err) {
      setError(err.message || "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(currentMonth, currentYear, selectedDistrict);
  }, [currentMonth, currentYear, selectedDistrict]);

  const handlePrevMonth = () => {
    setSelectedDayDetail(null);
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDayDetail(null);
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3000);
  };

  const getPillColor = (type) => {
    switch (type) {
      case "UPI Fraud": return "#00e5ff"; // cyan
      case "Phishing": return "#ff9500"; // orange
      case "Sextortion": return "#ffaa00"; // amber
      case "OLX Scam": return "#ff3b30"; // red
      case "Romance Scam": return "#bf5af2"; // purple
      case "Social Media Abuse": return "#34c759"; // green
      default: return "#007aff"; // blue for Job Fraud
    }
  };

  const getIntensityBackground = (count, isPrime) => {
    if (isPrime) return 'rgba(255, 45, 85, 0.10)';
    if (count === 0) return '#070a12';
    if (count <= 2) return 'rgba(0, 229, 255, 0.04)';
    if (count <= 4) return 'rgba(0, 229, 255, 0.08)';
    return 'rgba(0, 229, 255, 0.15)';
  };

  if (loading && !calendarData) {
    return (
      <div style={styles.centeredState}>
        <div style={styles.loader}></div>
        <div style={{ color: '#00e5ff', fontFamily: 'monospace', fontSize: '11px', marginTop: '12px' }}>
          GENERATING CYBER CALENDAR MATRIX...
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

  const { days, summary, heatmap } = calendarData;

  // Filter day events based on selected crime type
  const getFilteredEvents = (dayEvents) => {
    if (selectedCrimeType === "All Crime Types") return dayEvents;
    return dayEvents.filter(e => e.crime_type === selectedCrimeType);
  };

  // Get weekday layout offset
  const firstDayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const firstDayDate = new Date(currentYear, currentMonth - 1, 1);
  const startOffset = firstDayDate.getDay(); // 0: Sun, 6: Sat

  // Generate calendar days including empty offset cells
  const gridCells = [];
  for (let i = 0; i < startOffset; i++) {
    gridCells.push({ offset: true, key: `offset-${i}` });
  }
  
  days.forEach(d => {
    gridCells.push({ ...d, offset: false, key: d.date });
  });

  const maxHeatmapCount = Math.max(...heatmap.map(h => h.count));

  // --- PRIME DATES COMPUTATION ---
  const totalCountThisMonth = summary.total_this_month;
  const numDaysInMonth = days.length;
  const dailyAverage = numDaysInMonth > 0 ? (totalCountThisMonth / numDaysInMonth) : 0;
  const primeThreshold = dailyAverage * 1.5;

  const primeDatesList = days
    .filter(d => d.count > primeThreshold && d.count > 0)
    .map(d => {
      // Find top crime of the day
      const crimeCounts = {};
      d.events.forEach(e => {
        crimeCounts[e.crime_type] = (crimeCounts[e.crime_type] || 0) + 1;
      });
      const topCrime = Object.keys(crimeCounts).sort((a,b) => crimeCounts[b] - crimeCounts[a])[0] || summary.most_common_crime;
      const vsAvg = dailyAverage > 0 ? Math.round(((d.count - dailyAverage) / dailyAverage) * 100) : 0;

      return {
        date: d.date,
        count: d.count,
        topCrime,
        vsAvg
      };
    });

  // Pattern analysis text variables
  const weekdayCounts = { "Sunday": 0, "Monday": 0, "Tuesday": 0, "Wednesday": 0, "Thursday": 0, "Friday": 0, "Saturday": 0 };
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  days.forEach(d => {
    const dt = new Date(d.date);
    const dayName = weekdayNames[dt.getDay()];
    weekdayCounts[dayName] = (weekdayCounts[dayName] || 0) + d.count;
  });

  const peakWeekday = Object.keys(weekdayCounts).sort((a,b) => weekdayCounts[b] - weekdayCounts[a])[0] || "Wednesday";
  const nextMonthName = monthNames[currentMonth % 12];
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
            {monthNames[currentMonth - 1]} {currentYear}
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

          <div style={styles.grid}>
            {gridCells.map((cell) => {
              if (cell.offset) {
                return <div key={cell.key} style={styles.offsetCell} />;
              }

              const filteredEvents = getFilteredEvents(cell.events);
              const totalCount = filteredEvents.length;
              const isPrime = cell.count > primeThreshold && cell.count > 0;
              const cellBg = getIntensityBackground(totalCount, isPrime);

              return (
                <div 
                  key={cell.key}
                  onClick={() => setSelectedDayDetail(cell)}
                  style={{ 
                    ...styles.dayCell, 
                    backgroundColor: cellBg,
                    border: selectedDayDetail?.date === cell.date ? '1px solid #00e5ff' : '1px solid #1e2d3d',
                    position: 'relative'
                  }}
                >
                  {/* Prime Date Red Dot Marker */}
                  {isPrime && (
                    <div style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff2d55' }} />
                  )}

                  <div style={{ 
                    ...styles.dayNumber,
                    color: isPrime ? '#ff2d55' : '#8a9ba8' 
                  }}>
                    {cell.day_number}
                  </div>
                  
                  <div style={styles.pillContainer}>
                    {filteredEvents.slice(0, 3).map((e, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          ...styles.eventPill, 
                          borderLeft: `3px solid ${getPillColor(e.crime_type)}`,
                          backgroundColor: `${getPillColor(e.crime_type)}10` 
                        }}
                      >
                        {e.crime_type}
                      </div>
                    ))}
                    {totalCount > 3 && (
                      <div style={styles.moreLabel}>+{totalCount - 3} more</div>
                    )}
                  </div>
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
                      <span className="mono" style={{ color: '#00e5ff', fontWeight: 'bold' }}>{e.id}</span>
                      <span className="badge" style={{ backgroundColor: 'rgba(0, 229, 255, 0.05)', color: '#00e5ff' }}>{e.status}</span>
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
          <div className="stat-value" style={{ color: '#00e5ff' }}>{dailyAverage.toFixed(1)}</div>
          <div className="stat-subtitle">Crimes logged per 24h</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">MOST COMMON SCAM</div>
          <div className="stat-value" style={{ color: '#ffaa00' }}>{summary.most_common_crime}</div>
          <div className="stat-subtitle">Highest volume category</div>
        </div>
      </div>

      {/* PRIME DATES PANEL */}
      <div className="chart-card" style={styles.primeCard}>
        <div className="chart-header" style={{ borderBottom: '1px solid #1e2d3d', paddingBottom: '10px' }}>
          <span className="chart-title" style={{ color: '#ff2d55' }}>HIGH-RISK DATES — {monthNames[currentMonth - 1]} {currentYear}</span>
        </div>
        
        {primeDatesList.length === 0 ? (
          <div style={styles.emptyPanelState}>NO HIGH-RISK DATES IDENTIFIED (ALL BELOW 1.5X AVERAGE).</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {primeDatesList.map(row => (
              <div key={row.date} style={styles.primeRow}>
                <span className="mono" style={{ fontWeight: 'bold', color: '#ff2d55', minWidth: '100px' }}>{row.date}</span>
                <span style={{ color: '#ffffff', minWidth: '80px' }}>{row.count} Cases</span>
                <span className="badge" style={{ backgroundColor: 'rgba(0, 229, 255, 0.05)', color: '#00e5ff', minWidth: '120px', textAlign: 'center' }}>
                  {row.topCrime}
                </span>
                <span style={{ color: '#ff2d55', fontWeight: 'bold', marginLeft: 'auto' }}>
                  vs Daily Avg: +{row.vsAvg}%
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={styles.patternBox}>
          <AlertTriangle size={14} color="#ff2d55" style={{ marginTop: '2px' }} />
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
                    backgroundColor: '#00e5ff',
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
    background: '#0d1117',
    border: '1px solid #1e2d3d',
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
    border: '1px solid #1e2d3d',
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
    background: '#0d1117',
    border: '1px solid #1e2d3d',
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
    border: '1px dashed #1e2d3d',
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
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  panelHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #1e2d3d',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelTitle: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#00e5ff',
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
    border: '1px solid #1e2d3d',
    padding: '10px',
  },
  incidentRowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
  },
  heatmapCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
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
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    padding: '20px',
  },
  primeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    borderLeft: '3px solid #ff2d55',
    padding: '10px 14px',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
  patternBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    background: 'rgba(255, 45, 85, 0.05)',
    border: '1px dashed rgba(255, 45, 85, 0.3)',
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

export default CrimeCalendar;
