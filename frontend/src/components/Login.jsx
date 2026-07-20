import React, { useState, useEffect, useRef } from 'react';
import { Shield, Eye, EyeOff, Lock, Check } from 'lucide-react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('SP-Ramesh');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('higher_official'); // 'field_officer' or 'higher_official'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Real-time clock states
  const [timeStr, setTimeStr] = useState('');
  
  // System status and activity logs
  const [dbStats, setDbStats] = useState({
    totalComplaints: 11754,
    totalLoss: 2638850058,
    arrested: 2306,
    underInvestigation: 2376
  });

  // Keep track of elapsed seconds for active auto-increment
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Ticking clock format: "HH:MM:SS DayName, DD Month YYYY"
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      const dayName = weekdays[now.getDay()];
      const day = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      
      setTimeStr(`${hours}:${minutes}:${seconds} ${dayName}, ${day} ${month} ${year}`);
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    // Relative counter incrementing every second
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format elapsed time string helper
  const formatTimeAgo = (startSecs) => {
    const totalSecs = startSecs + elapsedSeconds;
    if (totalSecs < 60) {
      return `${totalSecs}s ago`;
    }
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s ago`;
  };

  useEffect(() => {
    const loadDbStats = async () => {
      try {
        const statsRes = await fetch('http://127.0.0.1:8000/api/overview');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setDbStats({
            totalComplaints: statsData.total_complaints || 11754,
            totalLoss: statsData.total_loss || 2638850058,
            arrested: statsData.arrested || 2306,
            underInvestigation: statsData.under_investigation || 2376
          });
        }
      } catch (err) {
        console.error("Failed to load KSP DB stats for login screen:", err);
      }
    };
    loadDbStats();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Access Denied.');
      }

      const data = await response.json();
      // Route user dynamically based on the selected toggle role rather than hardcoded DB role if needed, or sync them
      onLogin(data.token, data, selectedRole);
    } catch (err) {
      setError(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (userVal, roleVal) => {
    setUsername(userVal);
    setPassword('password');
    setSelectedRole(roleVal);
  };

  return (
    <div style={styles.fullscreenWrapper}>
      {/* Top Header Bar */}
      <header style={styles.topHeader}>
        <div style={styles.topHeaderLeft}>
          <span className="pulse-dot" style={styles.statusDot}></span>
          <span style={styles.statusText}>SECURE CHANNEL ACTIVE</span>
          <span style={styles.separator}>|</span>
          <span style={styles.nodeText}>NODE: BNG-01 • KSETP, Bengaluru</span>
        </div>
        <div style={styles.topHeaderRight}>
          <span style={styles.clockText}>{timeStr}</span>
        </div>
      </header>

      {/* Main Split Panel Area */}
      <div style={styles.splitGrid}>
        {/* Left Column — 50% */}
        <section style={styles.leftPanel}>
          <div style={styles.logoGroup}>
            <Shield size={48} color="var(--cyan)" style={{ marginBottom: '16px' }} />
            <h1 style={styles.mainTitle}>KSP INTEL</h1>
            <p style={styles.subTitle}>CYBER CRIME PORTAL</p>
            <div style={styles.accentLine}></div>
            <p style={styles.italicQuote}>
              State-Wide Crime Investigation &amp; Syndicate Analysis Platform
            </p>
          </div>

          <div style={styles.widgetBox}>
            <div style={styles.widgetHeader}>SYSTEM STATUS</div>
            <div style={styles.statusTable}>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Total Cyber Complaints</span>
                <span style={{ ...styles.statusValue, color: 'var(--cyan)' }}>{dbStats.totalComplaints.toLocaleString()}</span>
              </div>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Financial Loss (INR)</span>
                <span style={{ ...styles.statusValue, color: 'var(--red)' }}>₹{(dbStats.totalLoss / 10000000).toFixed(2)} Cr</span>
              </div>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Active Investigations</span>
                <span style={{ ...styles.statusValue, color: 'var(--amber)' }}>{dbStats.underInvestigation.toLocaleString()}</span>
              </div>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Resolved Arrests</span>
                <span style={{ ...styles.statusValue, color: 'var(--green)' }}>{dbStats.arrested.toLocaleString()}</span>
              </div>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>CCTNS Node Sync</span>
                <span style={{ ...styles.statusValue, color: 'var(--green)' }}>100%</span>
              </div>
            </div>
          </div>

          <div style={styles.recentActivityBox}>
            <div style={styles.recentActivityTitle}>RECENT ACTIVITY</div>
            <div style={styles.activityList}>
              <div style={styles.activityItem}>
                <span className="pulse-dot" style={{ backgroundColor: 'var(--green)', boxShadow: '0 0 8px var(--green)', marginRight: '10px' }}></span>
                <span style={styles.activityText}>New FIR logged — Bengaluru Urban</span>
                <span style={styles.activityTime}>{formatTimeAgo(42)}</span>
              </div>
              <div style={styles.activityItem}>
                <span className="pulse-dot" style={{ backgroundColor: 'var(--amber)', boxShadow: '0 0 8px var(--amber)', marginRight: '10px' }}></span>
                <span style={styles.activityText}>UPI fraud cluster flag in Tumkuru</span>
                <span style={styles.activityTime}>{formatTimeAgo(135)}</span>
              </div>
              <div style={styles.activityItem}>
                <span className="pulse-dot" style={{ backgroundColor: 'var(--red)', boxShadow: '0 0 8px var(--red)', marginRight: '10px' }}></span>
                <span style={styles.activityText}>Mule account link identified Mysuru</span>
                <span style={styles.activityTime}>{formatTimeAgo(312)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column — 50% */}
        <section style={styles.rightPanel}>
          {/* Classification Warning Box */}
          <div style={styles.restrictedWarning}>
            <span style={styles.restrictedHeader}>CLASSIFICATION</span>
            <span style={styles.restrictedTextBold}>RESTRICTED</span>
            <span style={styles.restrictedSubText}>Law Enforcement Use Only</span>
          </div>

          {/* Login Auth Card */}
          <div style={styles.loginCard}>
            <div style={styles.authHeaderGroup}>
              <Lock size={20} color="var(--cyan)" style={{ marginBottom: '8px' }} />
              <h2 style={styles.authTitle}>SECURE OFFICER AUTHENTICATION</h2>
            </div>

            {error && <div style={styles.errorAlert}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>OFFICER ID / USERNAME</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.textInput}
                  placeholder="e.g. SP-Ramesh"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>ACCESS CODE</label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.textInput}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={styles.passwordToggle}
                  >
                    {showPassword ? <EyeOff size={16} color="var(--text-label)" /> : <Eye size={16} color="var(--text-label)" />}
                  </button>
                </div>
              </div>

              {/* Login As toggle */}
              <div style={styles.toggleContainer}>
                <button
                  type="button"
                  onClick={() => setSelectedRole('field_officer')}
                  style={{
                    ...styles.toggleBtn,
                    ...(selectedRole === 'field_officer' ? styles.toggleBtnActive : styles.toggleBtnInactive)
                  }}
                >
                  FIELD OFFICER
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('higher_official')}
                  style={{
                    ...styles.toggleBtn,
                    ...(selectedRole === 'higher_official' ? styles.toggleBtnActive : styles.toggleBtnInactive)
                  }}
                >
                  HIGHER OFFICIAL
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={styles.submitBtn}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Lock size={16} color="#000000" />
                  {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE & ENTER SYSTEM'}
                </span>
              </button>
            </form>

            <div style={styles.dividerGroup}>
              <span style={styles.dividerText}>DEMO ACCESS CREDENTIALS</span>
            </div>

            {/* Autofill Demo Rows */}
            <div style={styles.demoRows}>
              <button
                type="button"
                onClick={() => handleDemoClick('SP-Ramesh', 'higher_official')}
                style={styles.demoRowItem}
              >
                <span style={styles.demoUser}>SP-Ramesh</span>
                <span style={{ ...styles.badge, color: 'var(--red)', borderColor: 'var(--red-border)', backgroundColor: 'var(--red-dim)' }}>
                  LEVEL 3 — TOP SECRET
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('DSP-Kumar', 'field_officer')}
                style={styles.demoRowItem}
              >
                <span style={styles.demoUser}>DSP-Kumar</span>
                <span style={{ ...styles.badge, color: 'var(--amber)', borderColor: 'var(--amber-border)', backgroundColor: 'var(--amber-dim)' }}>
                  LEVEL 2 — RESTRICTED
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoClick('admin', 'higher_official')}
                style={styles.demoRowItem}
              >
                <span style={styles.demoUser}>admin</span>
                <span style={{ ...styles.badge, color: 'var(--gold)', borderColor: 'rgba(255,215,0,0.4)', backgroundColor: 'var(--gold-bg)' }}>
                  LEVEL 4 — ADMIN
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Classified warning labels */}
          <footer style={styles.classifiedFooter}>
            <p style={styles.classifiedFooterText}>KARNATAKA STATE POLICE • KSETP • CLASSIFIED SYSTEM</p>
            <p style={styles.classifiedWarningText}>
              Unauthorized access is punishable under IT Act 2000/BNS. All sessions are monitored and logged.
            </p>
          </footer>
        </section>
      </div>
    </div>
  );
}

const styles = {
  fullscreenWrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-primary)',
    color: '#ffffff'
  },
  topHeader: {
    height: '36px',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: 'var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0
  },
  topHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusDot: {
    width: '6px',
    height: '6px',
    backgroundColor: 'var(--green)',
    borderRadius: '50%'
  },
  statusText: {
    fontSize: '10px',
    color: 'var(--green)',
    fontWeight: '600',
    letterSpacing: '1px',
    fontFamily: 'var(--font-mono)'
  },
  separator: {
    color: 'var(--text-dim)',
    fontSize: '10px'
  },
  nodeText: {
    fontSize: '10px',
    color: 'var(--text-label)',
    fontFamily: 'var(--font-mono)'
  },
  topHeaderRight: {
    display: 'flex',
    alignItems: 'center'
  },
  clockText: {
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    color: 'rgba(255,255,255,0.85)'
  },
  splitGrid: {
    display: 'flex',
    flex: 1,
    width: '100%',
    height: 'calc(100vh - 36px)',
    overflow: 'hidden'
  },
  leftPanel: {
    width: '50%',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: 'var(--border)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px',
    overflowY: 'auto'
  },
  logoGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '36px'
  },
  mainTitle: {
    fontSize: '32px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '6px',
    margin: '0 0 4px 0'
  },
  subTitle: {
    fontSize: '11px',
    letterSpacing: '4px',
    color: 'var(--text-label)',
    fontWeight: '600',
    margin: 0
  },
  accentLine: {
    width: '60px',
    height: '1px',
    backgroundColor: 'var(--cyan)',
    margin: '24px auto'
  },
  italicQuote: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
    lineHeight: '1.5'
  },
  widgetBox: {
    backgroundColor: 'var(--bg-panel)',
    border: 'var(--border)',
    padding: '16px',
    borderRadius: '10px',
    marginBottom: '24px'
  },
  widgetHeader: {
    fontSize: '10px',
    color: 'var(--cyan)',
    fontWeight: '600',
    letterSpacing: '2px',
    marginBottom: '12px',
    fontFamily: 'var(--font-mono)'
  },
  statusTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px'
  },
  statusLabel: {
    color: 'var(--text-secondary)'
  },
  statusValue: {
    fontFamily: 'var(--font-mono)',
    fontWeight: '600'
  },
  recentActivityBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  recentActivityTitle: {
    fontSize: '10px',
    color: 'var(--text-label)',
    letterSpacing: '1px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    backgroundColor: 'rgba(255,255,255,0.01)',
    padding: '8px 12px',
    border: '1px solid rgba(255,255,255,0.03)'
  },
  activityText: {
    color: 'rgba(255,255,255,0.7)',
    flex: 1
  },
  activityTime: {
    color: 'var(--text-label)',
    fontFamily: 'var(--font-mono)'
  },
  rightPanel: {
    width: '50%',
    backgroundColor: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
    position: 'relative',
    overflowY: 'auto'
  },
  restrictedWarning: {
    position: 'absolute',
    top: '36px',
    right: '36px',
    border: 'var(--border-red)',
    padding: '12px 20px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    backgroundColor: 'var(--bg-secondary)'
  },
  restrictedHeader: {
    fontSize: '9px',
    color: 'var(--text-label)',
    letterSpacing: '1px',
    fontWeight: '600'
  },
  restrictedTextBold: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--red)',
    letterSpacing: '1px',
    fontFamily: 'var(--font-mono)'
  },
  restrictedSubText: {
    fontSize: '11px',
    color: 'var(--text-label)'
  },
  loginCard: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'var(--bg-panel)',
    border: 'var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
  },
  authHeaderGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '24px'
  },
  authTitle: {
    fontSize: '11px',
    letterSpacing: '2px',
    color: 'var(--cyan)',
    fontWeight: '700',
    margin: 0,
    textAlign: 'center'
  },
  errorAlert: {
    backgroundColor: 'var(--red-dim)',
    border: 'var(--border-red)',
    color: 'var(--red)',
    padding: '10px 14px',
    fontSize: '12px',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '16px',
    textAlign: 'center',
    fontFamily: 'var(--font-mono)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputLabel: {
    fontSize: '10px',
    color: 'var(--text-label)',
    letterSpacing: '1px',
    fontWeight: '600'
  },
  textInput: {
    width: '100%',
    backgroundColor: 'var(--bg-card)',
    border: 'var(--border)',
    color: '#ffffff',
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    outline: 'none',
    transition: 'var(--transition)'
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  passwordToggle: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  toggleContainer: {
    display: 'flex',
    width: '100%',
    gap: '8px',
    margin: '8px 0'
  },
  toggleBtn: {
    flex: 1,
    padding: '10px 0',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    transition: 'var(--transition)'
  },
  toggleBtnActive: {
    backgroundColor: 'var(--cyan-dim)',
    border: 'var(--border-cyan)',
    color: 'var(--cyan)'
  },
  toggleBtnInactive: {
    backgroundColor: 'transparent',
    border: 'var(--border)',
    color: 'var(--text-label)'
  },
  submitBtn: {
    width: '100%',
    height: '52px',
    backgroundColor: 'var(--cyan)',
    color: '#000000',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    fontSize: '13px',
    letterSpacing: '2px',
    cursor: 'pointer',
    transition: 'var(--transition)',
    marginTop: '8px'
  },
  dividerGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '24px 0 16px 0',
    position: 'relative'
  },
  dividerText: {
    fontSize: '9px',
    color: 'var(--text-dim)',
    letterSpacing: '1px',
    backgroundColor: 'var(--bg-panel)',
    padding: '0 10px',
    zIndex: 1
  },
  demoRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  demoRowItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--bg-card)',
    border: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 16px',
    cursor: 'pointer',
    outline: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'var(--transition)'
  },
  demoUser: {
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    color: '#ffffff',
    fontWeight: '600'
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: '9px',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    fontWeight: '600',
    border: '1px solid transparent',
    borderRadius: '3px'
  },
  classifiedFooter: {
    marginTop: '36px',
    textAlign: 'center',
    padding: '0 20px'
  },
  classifiedFooterText: {
    fontSize: '10px',
    color: 'var(--text-dim)',
    letterSpacing: '2px',
    fontWeight: '600',
    margin: '0 0 6px 0'
  },
  classifiedWarningText: {
    fontSize: '10px',
    color: 'var(--text-dim)',
    margin: 0
  }
};

export default Login;
