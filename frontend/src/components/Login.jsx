import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Lock, User, Terminal, CheckCircle2, AlertOctagon } from 'lucide-react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('SP-Ramesh');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Real-time clock state matching the format in the screenshot
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour12: false });
      const date = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      setTimeStr(`${time}  ${date}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [dbStats, setDbStats] = useState({
    totalComplaints: 13230,
    totalLoss: 2972162462,
    arrested: 2590,
    underInvestigation: 2669
  });

  const [recentCases, setRecentCases] = useState([
    { title: 'New FIR logged — Bengaluru Urban', time: '42s ago' },
    { title: 'UPI fraud cluster flag in Tumakuru', time: '2m 15s ago' },
    { title: 'Mule account link identified in Mysuru', time: '5m 12s ago' }
  ]);

  useEffect(() => {
    const loadDbStats = async () => {
      try {
        const statsRes = await fetch('http://127.0.0.1:8000/api/overview');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setDbStats({
            totalComplaints: statsData.total_complaints || 13230,
            totalLoss: statsData.total_loss || 2972162462,
            arrested: statsData.arrested || 2590,
            underInvestigation: statsData.under_investigation || 2669
          });
        }
        
        const casesRes = await fetch('http://127.0.0.1:8000/api/complaints?limit=3');
        if (casesRes.ok) {
          const casesData = await casesRes.json();
          const mapped = casesData.map((c, idx) => {
            const timeDiff = idx === 0 ? "42s ago" : idx === 1 ? "2m 15s ago" : "5m 12s ago";
            return {
              title: `${c.crime_type} logged at ${c.victim_district}`,
              time: timeDiff
            };
          });
          if (mapped.length > 0) {
            setRecentCases(mapped);
          }
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
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Access Denied.');
      }

      const data = await response.json();
      // Route user dynamically based on the returned user_role key
      onLogin(data.token, data, data.user_role);
    } catch (err) {
      setError(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (userVal) => {
    setEmail(userVal);
    setPassword('password');
  };

  return (
    <div style={styles.loginContainer}>
      {/* Top Header Bar */}
      <div style={styles.topHeader}>
        <div style={styles.topHeaderLeft}>
          <span style={styles.statusDot}></span>
          <span style={styles.statusText}>SECURE CHANNEL ACTIVE</span>
          <span style={styles.nodeText}>NODE: BNG-01 - KSETP, Bengaluru</span>
        </div>
        <div style={styles.topHeaderRight}>
          <span style={styles.clockText}>{timeStr}</span>
        </div>
      </div>

      <div style={styles.mainLayout}>
        {/* LEFT COLUMN — SYSTEM STATUS */}
        <div style={styles.sidePanel}>
          <div className="chart-card" style={styles.widgetCard}>
            <div style={styles.widgetHeader}>SYSTEM STATUS</div>
            <div style={styles.statusList}>
              <div style={styles.statusItem}>
                <span>Total Cyber Complaints</span>
                <span style={{ color: '#00e5ff', fontWeight: 'bold' }}>{dbStats.totalComplaints.toLocaleString()}</span>
              </div>
              <div style={styles.statusItem}>
                <span>Financial Loss (INR)</span>
                <span style={{ color: '#ff2d55', fontWeight: 'bold' }}>₹{(dbStats.totalLoss / 10000000).toFixed(2)} Cr</span>
              </div>
              <div style={styles.statusItem}>
                <span>Active Investigations</span>
                <span style={{ color: '#ff9500', fontWeight: 'bold' }}>{dbStats.underInvestigation.toLocaleString()}</span>
              </div>
              <div style={styles.statusItem}>
                <span>Resolved Arrests</span>
                <span style={{ color: '#34c759', fontWeight: 'bold' }}>{dbStats.arrested.toLocaleString()}</span>
              </div>
              <div style={styles.statusItem}>
                <span>CCTNS Node Sync</span>
                <span style={{ color: '#00e5ff', fontWeight: 'bold' }}>100%</span>
              </div>
            </div>
          </div>

          <div className="chart-card" style={styles.widgetCard}>
            <div style={styles.widgetHeader}>RECENT ACTIVITY</div>
            <div style={styles.activityList}>
              {recentCases.map((item, idx) => (
                <div key={idx} style={styles.activityItem}>
                  <span style={styles.activityDot}>●</span>
                  <div style={styles.activityContent}>
                    <div style={styles.activityTitle}>{item.title}</div>
                    <div style={styles.activityTime}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN — AUTHENTICATION CARD */}
        <div style={styles.centerBlock}>
          {/* Logo Brand Header */}
          <div style={styles.logoBlock}>
            <div style={styles.shieldRing}>
              <Shield size={32} color="var(--accent)" style={styles.shieldIcon} />
            </div>
            <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '22px', fontWeight: 'bold', color: 'var(--accent)', letterSpacing: '2px', marginBottom: '4px' }}>KSP INTEL</h1>
            <p style={{ ...styles.drishtiSubtitle, marginTop: '2px' }}>CYBER CRIME PORTAL</p>
            <p style={styles.drishtiTagline}>State-Wide Cyber Investigation and Syndicate Analysis Platform</p>
          </div>

          <div style={styles.authCard}>
            <div style={styles.authCardHeader}>
              <Lock size={12} color="#00e5ff" />
              <span>SECURE OFFICER AUTHENTICATION</span>
            </div>

            {error && (
              <div style={styles.errorAlert}>
                <AlertOctagon size={14} style={{ marginRight: '6px' }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <User size={10} style={{ marginRight: '4px' }} />
                  <span>OFFICER ID / USERNAME</span>
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. SP-Ramesh"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <Lock size={10} style={{ marginRight: '4px' }} />
                  <span>ACCESS CODE</span>
                </label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.passwordInput}
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? <EyeOff size={14} color="#8a9ba8" /> : <Eye size={14} color="#8a9ba8" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.authBtn}>
                <Lock size={12} style={{ marginRight: '8px' }} />
                <span>{loading ? 'AUTHENTICATING...' : 'AUTHENTICATE & ENTER SYSTEM'}</span>
              </button>
            </form>

            {/* Demo Credentials list */}
            <div style={styles.demoCredentialsBox}>
              <div style={styles.demoHeader}>
                <Terminal size={10} style={{ marginRight: '6px' }} />
                <span>DEMO ACCESS CREDENTIALS</span>
              </div>
              <div style={styles.demoList}>
                {[
                  { name: 'SP-Ramesh', level: 'LEVEL 3 — TOP SECRET' },
                  { name: 'DSP-Kumar', level: 'LEVEL 2 — RESTRICTED' },
                  { name: 'admin', level: 'LEVEL 4 — ADMIN' }
                ].map(cred => (
                  <button
                    key={cred.name}
                    type="button"
                    onClick={() => handleDemoClick(cred.name)}
                    style={styles.demoItemRow}
                  >
                    <span style={styles.demoName}>{cred.name}</span>
                    <span style={styles.demoLevel}>{cred.level}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — CAPABILITIES & RESTRICTION */}
        <div style={styles.sidePanel}>
          <div style={styles.restrictedBox}>
            <div style={styles.restrictedHeader}>CLASSIFICATION</div>
            <div style={styles.restrictedBody}>
              <span style={styles.restrictedTextBold}>RESTRICTED</span>
              <span style={styles.restrictedTextSub}>Law Enforcement Use Only</span>
            </div>
          </div>

          <div className="chart-card" style={styles.widgetCard}>
            <div style={styles.widgetHeader}>CAPABILITIES</div>
            <div style={styles.capabilitiesList}>
              <div style={styles.capabilityItem}>✦ Real-time Karnataka Crime Map</div>
              <div style={styles.capabilityItem}>✦ Syndicate & Network Analysis</div>
              <div style={styles.capabilityItem}>✦ Burner Phone IMEI Path Tracer</div>
              <div style={styles.capabilityItem}>✦ FIR Assistant & Case Tracker</div>
              <div style={styles.capabilityItem}>✦ District Crime Calendars</div>
              <div style={styles.capabilityItem}>✦ Evidence Locker & Integrity Logs</div>
            </div>
          </div>

          <div style={styles.attributionBox}>
            <p>
              This portal is developed under the <strong style={{ color: '#00e5ff' }}>Smart Policing Initiative</strong> in partnership with the Karnataka State Police (KSP) Cyber Crime Wing.
            </p>
          </div>
        </div>
      </div>

      {/* Footer warning */}
      <div style={styles.footer}>
        <div style={styles.footerLabel}>KARNATAKA STATE POLICE • KSETP • CLASSIFIED SYSTEM</div>
        <div style={styles.footerSubText}>
          Unauthorized access is a punishable offence under IT Act 2000/BNS. All sessions are monitored and logged.
        </div>
      </div>
    </div>
  );
}

const styles = {
  loginContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-primary)',
    // Grid background
    backgroundImage: 'var(--login-bg), var(--login-grid), var(--login-grid)',
    backgroundSize: '100% 100%, 45px 45px, 45px 45px',
    boxSizing: 'border-box'
  },
  topHeader: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--login-header-bg)',
    zIndex: 100
  },
  topHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#34c759',
    animation: 'pulse 1.5s infinite'
  },
  statusText: {
    fontSize: '9px',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#34c759',
    fontWeight: 'bold',
    letterSpacing: '1px'
  },
  nodeText: {
    fontSize: '9px',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-muted)',
    marginLeft: '15px'
  },
  topHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  clockText: {
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-secondary)'
  },
  themeToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
    padding: '4px 10px',
    fontSize: '8.5px',
    fontFamily: "'JetBrains Mono', monospace",
    cursor: 'pointer',
    borderRadius: '2px',
    transition: 'all 0.2s ease'
  },
  mainLayout: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1200px',
    padding: '0 20px',
    marginTop: '60px',
    marginBottom: '60px',
    zIndex: 10
  },
  sidePanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '270px'
  },
  widgetCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: 'var(--border)',
    padding: '16px',
    borderRadius: '4px'
  },
  widgetHeader: {
    fontSize: '9px',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
    marginBottom: '12px',
    letterSpacing: '1px'
  },
  statusList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    fontFamily: 'monospace',
    color: 'var(--text-secondary)'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px'
  },
  activityDot: {
    color: '#00e5ff',
    fontSize: '10px',
    lineHeight: '1'
  },
  activityContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  activityTitle: {
    fontSize: '10px',
    color: 'var(--text-primary)',
    fontWeight: 'bold'
  },
  activityTime: {
    fontSize: '8px',
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
    marginTop: '2px'
  },
  centerBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '420px'
  },
  logoBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
    textAlign: 'center'
  },
  shieldRing: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: '1px solid rgba(0, 229, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    backgroundColor: 'rgba(0, 229, 255, 0.02)'
  },
  shieldIcon: {
    animation: 'pulse 2s infinite'
  },
  drishtiTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '24px',
    fontWeight: '900',
    letterSpacing: '6px',
    color: 'var(--text-primary)',
    marginBottom: '4px'
  },
  drishtiSubtitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '8.5px',
    color: 'var(--accent)',
    letterSpacing: '1px',
    marginBottom: '8px'
  },
  drishtiTagline: {
    fontSize: '9.5px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    margin: 0
  },
  authCard: {
    width: '105%',
    backgroundColor: 'var(--bg-secondary)',
    border: 'var(--border)',
    borderRadius: '4px',
    padding: '24px',
    boxShadow: 'var(--login-card-shadow)'
  },
  authCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
    marginBottom: '20px'
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
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '9px',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-secondary)'
  },
  input: {
    backgroundColor: 'var(--bg-primary)',
    border: 'var(--border)',
    color: 'var(--text-primary)',
    padding: '10px 12px',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
    width: '100%'
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  passwordInput: {
    backgroundColor: 'var(--bg-primary)',
    border: 'var(--border)',
    color: 'var(--text-primary)',
    padding: '10px 12px',
    paddingRight: '40px',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
    width: '100%'
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  authBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--accent)',
    border: '1px solid var(--accent)',
    color: 'var(--bg-primary)',
    padding: '12px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
    borderRadius: '2px',
    transition: 'all 0.2s ease'
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    border: '1px solid #ff3b30',
    color: '#ff3b30',
    padding: '10px 12px',
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: '16px'
  },
  demoCredentialsBox: {
    marginTop: '20px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '16px'
  },
  demoHeader: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '9px',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-muted)',
    marginBottom: '10px'
  },
  demoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  demoItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'var(--bg-tertiary)',
    border: 'var(--border)',
    padding: '6px 10px',
    cursor: 'pointer',
    outline: 'none',
    width: '100%',
    textAlign: 'left'
  },
  demoName: {
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-primary)',
    fontWeight: 'bold'
  },
  demoLevel: {
    fontSize: '8px',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-muted)'
  },
  restrictedBox: {
    border: 'var(--restricted-border)',
    backgroundColor: 'var(--restricted-bg)',
    padding: '16px',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  restrictedHeader: {
    fontSize: '8px',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-muted)',
    letterSpacing: '1px',
    marginBottom: '6px'
  },
  restrictedBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  restrictedTextBold: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ff3b30',
    letterSpacing: '2px'
  },
  restrictedTextSub: {
    fontSize: '9px',
    color: 'var(--text-secondary)'
  },
  capabilitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  capabilityItem: {
    fontSize: '9.5px',
    color: 'var(--text-secondary)',
    fontFamily: 'sans-serif'
  },
  attributionBox: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
    textAlign: 'center',
    padding: '0 8px'
  },
  footer: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '14px 20px',
    backgroundColor: 'rgba(7, 10, 18, 0.5)',
    borderTop: '1px solid var(--border-color)',
    zIndex: 100
  },
  footerLabel: {
    fontSize: '8.5px',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-muted)',
    letterSpacing: '1px',
    marginBottom: '4px'
  },
  footerSubText: {
    fontSize: '8px',
    color: 'var(--text-muted)',
    fontFamily: 'sans-serif'
  }
};

export default Login;
