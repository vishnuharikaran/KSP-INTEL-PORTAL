import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('ksp_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('ksp_user') || 'null'));
  const [role, setRole] = useState(localStorage.getItem('ksp_role') || 'field_officer');

  // Global state for flagged cases & escalations
  const [flaggedCases, setFlaggedCases] = useState(() => {
    const saved = localStorage.getItem('ksp_flagged_cases');
    return saved ? JSON.parse(saved) : [];
  });

  const [scrbEscalations, setScrbEscalations] = useState(() => {
    const saved = localStorage.getItem('ksp_scrb_escalations');
    return saved ? JSON.parse(saved) : [];
  });

  const handleLogin = (jwtToken, userInfo, selectedRole) => {
    localStorage.setItem('ksp_token', jwtToken);
    localStorage.setItem('ksp_user', JSON.stringify(userInfo));
    localStorage.setItem('ksp_role', selectedRole);
    setToken(jwtToken);
    setUser(userInfo);
    setRole(selectedRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('ksp_token');
    localStorage.removeItem('ksp_user');
    localStorage.removeItem('ksp_role');
    setToken(null);
    setUser(null);
    setRole('field_officer');
  };

  const addFlaggedCase = (caseObj) => {
    setFlaggedCases(prev => {
      if (prev.some(c => c.id === caseObj.id)) return prev;
      const updated = [...prev, { ...caseObj, flaggedAt: new Date().toLocaleTimeString() }];
      localStorage.setItem('ksp_flagged_cases', JSON.stringify(updated));
      return updated;
    });
  };

  const addScrbEscalation = (caseObj) => {
    setScrbEscalations(prev => {
      if (prev.some(c => c.id === caseObj.id)) return prev;
      const autoId = Math.floor(1000 + Math.random() * 9000);
      const updated = [...prev, { 
        ...caseObj, 
        scrbRef: `SCRB/2026/${autoId}`, 
        escalatedAt: new Date().toLocaleTimeString() 
      }];
      localStorage.setItem('ksp_scrb_escalations', JSON.stringify(updated));
      return updated;
    });
  };

  const removeScrbEscalation = (caseId) => {
    setScrbEscalations(prev => {
      const updated = prev.filter(c => c.id !== caseId);
      localStorage.setItem('ksp_scrb_escalations', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <>
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard 
          token={token} 
          user={user} 
          role={role}
          flaggedCases={flaggedCases}
          addFlaggedCase={addFlaggedCase}
          scrbEscalations={scrbEscalations}
          addScrbEscalation={addScrbEscalation}
          removeScrbEscalation={removeScrbEscalation}
          onLogout={handleLogout} 
        />
      )}
    </>
  );
}

export default App;
