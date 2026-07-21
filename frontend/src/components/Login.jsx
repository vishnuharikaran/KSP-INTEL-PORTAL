import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';

const DEMO_USERS = [
  { 
    id: 'SP-Ramesh', 
    label: 'SP-Ramesh',
    role: 'LEVEL 3 — TOP SECRET',
    level: 'level3',
    color: '#ff2d55'
  },
  { 
    id: 'DSP-Kumar', 
    label: 'DSP-Kumar',
    role: 'LEVEL 2 — RESTRICTED',
    level: 'level2',
    color: '#ffaa00'
  },
  { 
    id: 'admin', 
    label: 'admin',
    role: 'LEVEL 4 — ADMIN',
    level: 'level4',
    color: '#FFD700'
  }
];

// Custom local useNavigate to satisfy user request without crashing (no Router context)
const useNavigate = () => {
  return (path) => {
    console.log("Mock navigation to:", path);
  };
};

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!username || !password) {
      setError('Enter officer ID and access code.');
      return;
    }
    const user = DEMO_USERS.find(
      u => u.id === username
    );
    if (!user) {
      setError('Officer ID not recognised.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      const mappedRole = user.level === 'level2' ? 'field_officer' : 'higher_official';
      localStorage.setItem('ksp_role', mappedRole);
      localStorage.setItem('ksp_user', JSON.stringify({ name: user.label, email: user.id }));
      localStorage.setItem('ksp_token', 'demo-token');
      
      if (user.level === 'level3' || 
          user.level === 'level4') {
        navigate('/overview-official');
      } else {
        navigate('/overview');
      }

      if (onLogin) {
        onLogin('demo-token', { name: user.label, email: user.id }, mappedRole);
      }
    }, 900);
  };

  const fillDemo = (userId) => {
    setUsername(userId);
    setPassword('demo1234');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-root)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-modal)'
      }}>

        {/* Top accent line */}
        <div style={{
          height: '3px',
          background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)'
        }} />

        {/* Card body */}
        <div style={{ padding: '40px 36px 32px' }}>

          {/* Logo */}
          <div style={{
            textAlign: 'center',
            marginBottom: '28px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '2px solid var(--cyan-border)',
              background: 'var(--cyan-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Shield 
                size={26} 
                color="var(--cyan)" 
                strokeWidth={1.5} 
              />
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              fontFamily: 'JetBrains Mono',
              letterSpacing: '4px',
              color: 'var(--text-primary)',
              marginBottom: '4px'
            }}>
              KSP INTEL
            </div>
            <div style={{
              fontSize: '11px',
              letterSpacing: '2px',
              color: 'var(--text-label)',
              fontFamily: 'JetBrains Mono',
              textTransform: 'uppercase'
            }}>
              CLASSIFIED SYSTEM
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(255, 45, 85, 0.1)',
              border: '1px solid rgba(255, 45, 85, 0.3)',
              color: '#ff2d55',
              padding: '10px 12px',
              fontSize: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              fontFamily: 'JetBrains Mono'
            }}>
              {error}
            </div>
          )}

          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{
                fontSize: '10px',
                color: 'var(--text-label)',
                fontFamily: 'JetBrains Mono',
                letterSpacing: '1px'
              }}>
                OFFICER ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter ID"
                style={{
                  width: '100%',
                  background: 'var(--bg-root)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{
                fontSize: '10px',
                color: 'var(--text-label)',
                fontFamily: 'JetBrains Mono',
                letterSpacing: '1px'
              }}>
                ACCESS CODE
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    background: 'var(--bg-root)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    color: 'var(--text-primary)',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%',
                background: 'var(--cyan)',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontFamily: 'JetBrains Mono',
                fontWeight: '700',
                fontSize: '13px',
                letterSpacing: '2px',
                cursor: 'pointer',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Lock size={16} />
              {loading ? 'AUTHENTICATING...' : 'ENTER SYSTEM'}
            </button>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '24px 0 16px',
            position: 'relative'
          }}>
            <span style={{
              fontSize: '9px',
              color: 'var(--text-dim)',
              letterSpacing: '1px',
              fontFamily: 'JetBrains Mono'
            }}>
              DEMO ACCESS CREDENTIALS
            </span>
          </div>

          {/* Demo Credentials */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {DEMO_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => fillDemo(user.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-root)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                <span style={{
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono',
                  color: 'var(--text-primary)',
                  fontWeight: '600'
                }}>
                  {user.label}
                </span>
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'JetBrains Mono',
                  color: user.color,
                  border: `1px solid ${user.color}40`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: `${user.color}10`
                }}>
                  {user.role}
                </span>
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
