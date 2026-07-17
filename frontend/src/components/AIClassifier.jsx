import React, { useState } from 'react';
import { BrainCircuit, CheckSquare, ShieldAlert, BookOpen, Layers, Play, AlertTriangle, PlayCircle } from 'lucide-react';

function AIClassifier() {
  const [narrative, setNarrative] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedActions, setCompletedActions] = useState({});

  const presetNarratives = [
    {
      label: "EN: Part-Time Job Scam",
      text: "I received a message on WhatsApp offering a part-time job liking YouTube videos. They paid me 150 rupees first. Then they added me to a Telegram group and asked to deposit 50,000 rupees for a VIP task. When I tried to withdraw, they blocked me."
    },
    {
      label: "KN: ಯುಪಿಐ ವಂಚನೆ (UPI Scam)",
      text: "ನನಗೆ ಫೋನ್ ಪೇ ನಲ್ಲಿ 50,000 ಲಾಟರಿ ಗೆದ್ದಿದ್ದೀರಿ ಎಂದು ಮೆಸೇಜ್ ಬಂದಿತ್ತು. ಅದನ್ನು ಪಡೆಯಲು ಲಿಂಕ್ ಒತ್ತಿ ಪಿನ್ ನಮೂದಿಸಲು ಹೇಳಿದರು. ನಾನು ನಂಬಿ ಪಿನ್ ಹಾಕಿದ ತಕ್ಷಣ ನನ್ನ ಬ್ಯಾಂಕ್ ಖಾತೆಯಿಂದ 50000 ರೂಪಾಯಿ ಕಟ್ ಆಯಿತು. ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ, ಕೂಡಲೇ ಹಣ ವಾಪಸ್ ಕೊಡಿಸಿ."
    },
    {
      label: "KN: ಬ್ಲಾಕ್ಮೇಲ್ ವಂಚನೆ (Sextortion)",
      text: "ನನ್ನ ಇನ್ಸ್ಟಾಗ್ರಾಮ್ ಗೆ ಪರಿಚಯವಿಲ್ಲದ ನಂಬರ್ ನಿಂದ ವೀಡಿಯೋ ಕಾಲ್ ಬಂತು. ನಾನು ಕಾಲ್ ರಿಸೀವ್ ಮಾಡಿದ ತಕ್ಷಣ ನಗ್ನ ಕ್ಲಿಪ್ ತೋರಿಸಿ ರೆಕಾರ್ಡ್ ಮಾಡಿಕೊಂಡಿದ್ದಾರೆ. ಈಗ ನನ್ನ ಮುಖವಿರುವ ವೀಡಿಯೋವನ್ನು ಯೂಟ್ಯೂಬ್ ನಲ್ಲಿ ಅಪ್ಲೋಡ್ ಮಾಡುವುದಾಗಿ ಬೆದರಿಕೆ ಹಾಕುತ್ತಿದ್ದಾರೆ. 50,000 ರೂಪಾಯಿ ಕೊಡದಿದ್ದರೆ ನನ್ನ ಸ್ನೇಹಿತರಿಗೆ ಕಳುಹಿಸುವುದಾಗಿ ಬ್ಲಾಕ್ಮೇಲ್ ಮಾಡುತ್ತಿದ್ದಾರೆ. ನನಗೆ ಆತ್ಮಹತ್ಯೆ ಮಾಡಿಕೊಳ್ಳುವ ಯೋಚನೆ ಬರುತ್ತಿದೆ, ಸಹಾಯ ಮಾಡಿ."
    }
  ];

  const handlePresetClick = (text) => {
    setNarrative(text);
    setResult(null);
  };

  const handleClassify = async (e) => {
    e.preventDefault();
    if (!narrative.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setCompletedActions({});

    try {
      const response = await fetch('http://127.0.0.1:8000/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: narrative }),
      });

      if (!response.ok) {
        throw new Error('Failed to classify complaint narrative.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Error processing classification on the AI node.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAction = (idx) => {
    setCompletedActions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getRiskBadgeStyles = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return {
          backgroundColor: 'rgba(255, 59, 48, 0.1)',
          color: '#ff3b30',
          borderColor: '#ff3b30'
        };
      case 'medium':
        return {
          backgroundColor: 'rgba(255, 204, 0, 0.1)',
          color: '#ffcc00',
          borderColor: '#ffcc00'
        };
      case 'low':
        return {
          backgroundColor: 'rgba(52, 199, 89, 0.1)',
          color: '#34c759',
          borderColor: '#34c759'
        };
      default:
        return {
          backgroundColor: 'rgba(140, 155, 165, 0.1)',
          color: '#8a9ba8',
          borderColor: '#1a2a3a'
        };
    }
  };

  const getActionStyles = (action) => {
    const act = action?.toLowerCase() || '';
    if (act.includes('freeze')) {
      return { borderLeft: '4px solid #ff9500', color: '#ff9500' };
    }
    if (act.includes('fir')) {
      return { borderLeft: '4px solid #ff3b30', color: '#ff3b30' };
    }
    if (act.includes('notice')) {
      return { borderLeft: '4px solid #ffcc00', color: '#ffcc00' };
    }
    return { borderLeft: '4px solid #00e5ff', color: '#00e5ff' };
  };

  return (
    <div style={styles.container}>
      {/* Input Form Panel */}
      <div className="chart-card" style={{ marginBottom: '20px' }}>
        <div className="chart-header">
          <span className="chart-title">BILINGUAL COGNITIVE COMPLAINT PARSER</span>
          <span style={{ fontSize: '10px', color: '#00e5ff', fontFamily: 'monospace' }}>
            ● ENGLISH & KANNADA DUAL RESOLVE
          </span>
        </div>

        <form onSubmit={handleClassify} style={styles.form}>
          <div style={styles.presetsBox}>
            <span style={styles.presetsLabel}>PRESET INCIDENT NARRATIVES (SELECT TO PRE-FILL):</span>
            <div style={styles.presetsGrid}>
              {presetNarratives.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="cyber-btn-outline"
                  onClick={() => handlePresetClick(p.text)}
                  style={styles.presetBtn}
                >
                  <PlayCircle size={12} style={{ marginRight: '6px' }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>PASTE RAW COMPLAINT DETAILS (ENGLISH OR KANNADA)</label>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              className="cyber-input"
              rows={5}
              placeholder="Describe the complaint in detail (e.g., 'ನನಗೆ ಪೋನ್ ಪೇ ನಲ್ಲಿ ಲಾಟರಿ ಗೆದ್ದಿದ್ದೀರಿ ಎಂದು ಮೆಸೇಜ್ ಬಂದಿತ್ತು...')"
              required
              style={styles.textarea}
            />
          </div>

          <div style={styles.actions}>
            <button type="submit" className="cyber-btn" disabled={loading} style={styles.submitBtn}>
              <BrainCircuit size={16} />
              <span>CLASSIFY NARRATIVE</span>
            </button>
          </div>
        </form>
      </div>

      {/* AI Inference output */}
      <div style={styles.resultArea}>
        {loading ? (
          <div className="chart-card" style={styles.stateCard}>
            <div className="loader"></div>
            <span style={styles.stateText}>TRAVERSING BILINGUAL COGNITIVE EMBEDDINGS...</span>
          </div>
        ) : error ? (
          <div className="chart-card" style={{ ...styles.stateCard, borderColor: '#ff3b30' }}>
            <span style={{ color: '#ff3b30', fontSize: '13px', fontWeight: 'bold' }}>CLASSIFIER EXCEPTION EVENT</span>
            <span style={{ color: '#ff3b30', fontSize: '11px', marginTop: '4px' }}>{error}</span>
          </div>
        ) : !result ? (
          <div className="chart-card" style={styles.stateCard}>
            <BrainCircuit size={24} color="#1a2a3a" />
            <span style={styles.stateText}>SYSTEM READY FOR BILINGUAL INPUT</span>
            <span style={{ fontSize: '10px', color: '#4f616d', marginTop: '4px' }}>
              Select a preset template above or input a custom incident narrative to run classification.
            </span>
          </div>
        ) : (
          <div style={styles.outputGrid}>
            {/* Left Column: Classification and Legal sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Category card */}
              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-title">AI CLASSIFIER MATRIX</span>
                </div>
                <div style={styles.categoryInfo}>
                  <div style={styles.categoryRow}>
                    <div>
                      <div style={{ color: '#8a9ba8', fontSize: '9px', fontFamily: 'monospace', marginBottom: '4px' }}>
                        CLASSIFIED CRIME TYPE
                      </div>
                      <div style={styles.categoryName}>{result.crime_type}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#8a9ba8', fontSize: '9px', fontFamily: 'monospace', marginBottom: '4px' }}>
                        RISK ASSESSMENT
                      </div>
                      <span 
                        className="badge" 
                        style={{
                          ...getRiskBadgeStyles(result.risk_level),
                          border: '1px solid',
                          fontWeight: 'bold',
                          padding: '4px 12px',
                          fontSize: '12px'
                        }}
                      >
                        {result.risk_level?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div style={styles.confidenceMeter}>
                    <div style={styles.meterHeader}>
                      <span style={{ color: '#8a9ba8', fontSize: '11px' }}>MODEL CONFIDENCE SCORE:</span>
                      <span className="mono" style={{ color: '#00e5ff', fontWeight: 'bold' }}>
                        {(result.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={styles.meterTrack}>
                      <div 
                        style={{
                          ...styles.meterBar,
                          width: `${result.confidence * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Framework Sections */}
              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-title">LEGAL PROVISIONS ALIGNMENT</span>
                </div>
                
                <div style={styles.legalSection}>
                  <div style={styles.legalLabel}>
                    <BookOpen size={12} color="#00e5ff" />
                    <span>BHARATIYA NYAYA SANHITA (BNS) SECTIONS</span>
                  </div>
                  <div style={styles.legalText} className="mono">
                    {result.ipc_sections}
                  </div>
                </div>

                <div style={styles.legalSection} style={{ marginTop: '16px' }}>
                  <div style={styles.legalLabel}>
                    <Layers size={12} color="#00e5ff" />
                    <span>INFORMATION TECHNOLOGY (IT) ACT SECTIONS</span>
                  </div>
                  <div style={styles.legalText} className="mono">
                    {result.it_sections}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Suggested Actions and Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Immediate Protocol action */}
              <div className="chart-card">
                <div className="chart-header">
                  <span className="chart-title">IMMEDIATE ACTION PROTOCOL</span>
                </div>
                <div 
                  style={{
                    ...styles.actionProtocolBlock,
                    ...getActionStyles(result.suggested_action)
                  }}
                >
                  <AlertTriangle size={18} style={{ marginRight: '10px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '9px', fontFamily: 'monospace', opacity: 0.8 }}>
                      DECISION CORE RECOMMENDED STEP
                    </div>
                    <div style={styles.protocolText}>
                      {result.suggested_action.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action items checklist */}
              <div className="chart-card" style={{ flexGrow: 1 }}>
                <div className="chart-header">
                  <span className="chart-title">INVESTIGATION WORKFLOW ACTIONS</span>
                </div>
                <p style={styles.workflowSub}>
                  Suggested task logs to execute immediately for this incident:
                </p>
                <div style={styles.actionsList}>
                  {result.action_items.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => toggleAction(idx)}
                      style={{
                        ...styles.actionItemRow,
                        backgroundColor: completedActions[idx] ? 'rgba(52, 199, 89, 0.05)' : '#0a0d14',
                        borderColor: completedActions[idx] ? '#34c759' : '#14202d'
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          ...styles.checkBtn,
                          color: completedActions[idx] ? '#34c759' : '#4f616d'
                        }}
                      >
                        <CheckSquare size={16} />
                      </button>
                      <span 
                        style={{
                          ...styles.actionText,
                          textDecoration: completedActions[idx] ? 'line-through' : 'none',
                          color: completedActions[idx] ? 'var(--text-secondary)' : '#ffffff'
                        }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
    height: 'calc(100vh - 128px)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  presetsBox: {
    borderBottom: '1px solid #1a2a3a',
    paddingBottom: '16px',
  },
  presetsLabel: {
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#8a9ba8',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '10px',
  },
  presetsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  presetBtn: {
    padding: '8px 12px',
    fontSize: '11px',
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left',
    justifyContent: 'flex-start',
    width: '100%',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#8a9ba8',
    letterSpacing: '0.5px',
  },
  textarea: {
    resize: 'none',
    backgroundColor: '#0a0d14',
    border: '1px solid #1a2a3a',
    color: '#ffffff',
    padding: '12px',
    fontFamily: 'monospace',
    fontSize: '12px',
    width: '100%',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  submitBtn: {
    padding: '10px 24px',
  },
  resultArea: {
    flexGrow: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  stateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    minHeight: '260px',
    color: '#8a9ba8',
    fontFamily: 'monospace',
    gap: '12px',
  },
  stateText: {
    fontSize: '11px',
    letterSpacing: '1.5px',
  },
  outputGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    overflowY: 'auto',
    flexGrow: 1,
  },
  categoryInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  categoryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: '22px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#00e5ff',
  },
  confidenceMeter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  meterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  meterTrack: {
    height: '6px',
    backgroundColor: '#0a0d14',
    border: '1px solid #1a2a3a',
  },
  meterBar: {
    height: '100%',
    backgroundColor: '#00e5ff',
  },
  legalSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  legalLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#8a9ba8',
  },
  legalText: {
    backgroundColor: '#0a0d14',
    border: '1px solid #1a2a3a',
    padding: '10px 12px',
    fontSize: '12px',
    color: '#ffffff',
    lineHeight: '1.4',
  },
  actionProtocolBlock: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 13, 20, 0.6)',
    padding: '16px',
    border: '1px solid #1a2a3a',
  },
  protocolText: {
    fontSize: '16px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: '1px',
    marginTop: '2px',
  },
  workflowSub: {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#8a9ba8',
    marginBottom: '14px',
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  actionItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    border: '1px solid #14202d',
    cursor: 'pointer',
  },
  checkBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  actionText: {
    fontSize: '12px',
  },
};

export default AIClassifier;
