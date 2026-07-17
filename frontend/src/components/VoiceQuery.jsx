import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, HelpCircle, FileText, Database, Shield } from 'lucide-react';

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

function VoiceQuery() {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-IN'); // en-IN or kn-IN
  const [transcript, setTranscript] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [manualInput, setManualInput] = useState('');
  
  // Custom insight metrics for districts
  const [districtInsight, setDistrictInsight] = useState(null);

  let recognition = null;

  if (typeof window !== 'undefined') {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
    }
  }

  useEffect(() => {
    if (!recognition) {
      setSpeechSupported(false);
    }
    // Load default records on start (5 latest complaints)
    executeDefaultQuery();
  }, []);

  const executeDefaultQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/complaints?limit=5');
      if (response.ok) {
        const data = await response.json();
        setResults(data.records);
      }
    } catch (err) {
      console.error("Failed to load default complaints", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceListen = () => {
    if (!recognition) {
      setError('Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setError('');
    setTranscript('Listening...');
    setDistrictInsight(null);

    recognition.lang = language;
    recognition.start();

    recognition.onresult = (event) => {
      const speechToText = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      setTranscript(speechToText);
      
      if (event.results[0].isFinal) {
        processTranscript(speechToText);
      }
    };

    recognition.onerror = (event) => {
      console.warn(`Speech recognition error: ${event.error}`);
      setIsListening(false);
      
      if (event.error === 'network') {
        setError('Speech error: network. NOTE: Brave browser does not support Google Speech Services. Please open this portal in Google Chrome or Microsoft Edge to use the microphone.');
      } else {
        setError(`Speech error: ${event.error}. Please try again or switch languages.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const processTranscript = async (text) => {
    setError('');
    setLoading(true);
    setDistrictInsight(null);
    const queryText = text.toLowerCase().trim();

    try {
      // 1. Check for phone numbers (e.g. sequence of numbers or starting with +91)
      const phoneRegex = /(?:\+?91)?[-\s]?[789]\d{9}\b/;
      const phoneMatch = text.replace(/[-\s]/g, '').match(/\d{10}/); // simple 10 digit check
      
      // 2. Check for districts (English or Kannada)
      let matchedDistrict = null;
      if (queryText.includes('ಬೆಂಗಳೂರು') || queryText.includes('bengaluru') || queryText.includes('bangalore')) {
        matchedDistrict = 'Bengaluru Urban';
      } else {
        for (const dist of DISTRICTS) {
          if (queryText.includes(dist.toLowerCase())) {
            matchedDistrict = dist;
            break;
          }
        }
      }

      // 3. Check for crime type keywords (English or Kannada)
      let matchedCrimeType = null;
      
      if (queryText.includes('ವಂಚನೆ') || queryText.includes('fraud')) {
        // general fraud, check for specific subtypes
        if (queryText.includes('upi') || queryText.includes('ಯುಪಿಐ')) matchedCrimeType = 'UPI Fraud';
        else if (queryText.includes('job') || queryText.includes('ಕೆಲಸ') || queryText.includes('ಪಾರ್ಟ್')) matchedCrimeType = 'Job Fraud';
        else if (queryText.includes('olx') || queryText.includes('ಒಎಲ್ಎಕ್ಸ್')) matchedCrimeType = 'OLX Scam';
        else if (queryText.includes('romance') || queryText.includes('ಪ್ರೇಮ')) matchedCrimeType = 'Romance Scam';
      } else if (queryText.includes('phishing') || queryText.includes('kyc') || queryText.includes('ಕೆವೈಸಿ') || queryText.includes('ಲಿಂಕ್')) {
        matchedCrimeType = 'Phishing';
      } else if (queryText.includes('sextortion') || queryText.includes('ನಗ್ನ') || queryText.includes('ಬ್ಲಾಕ್ಮೇಲ್')) {
        matchedCrimeType = 'Sextortion';
      } else if (queryText.includes('abuse') || queryText.includes('ನಿಂದನೆ') || queryText.includes('ಬೆದರಿಕೆ')) {
        matchedCrimeType = 'Social Media Abuse';
      } else {
        // Direct english match
        for (const ct of CRIME_TYPES) {
          if (queryText.includes(ct.toLowerCase())) {
            matchedCrimeType = ct;
            break;
          }
        }
      }

      // 4. Check for status/arrest (English or Kannada)
      let matchedStatus = null;
      if (queryText.includes('ಬಂಧನ') || queryText.includes('arrest') || queryText.includes('arrested')) {
        matchedStatus = 'Arrested';
      }

      // Execute appropriate API calls based on matched parameters
      let url = 'http://127.0.0.1:8000/api/complaints';
      let params = new URLSearchParams();

      if (phoneMatch) {
        const phone = phoneMatch[0];
        // Query phone directly using general search query param
        params.append('q', phone);
        const response = await fetch(`${url}?${params.toString()}&limit=50`);
        const data = await response.json();
        setResults(data.records);
      } 
      else if (matchedDistrict) {
        params.append('district', matchedDistrict);
        const response = await fetch(`${url}?${params.toString()}&limit=100`);
        const data = await response.json();
        setResults(data.records);

        // Calculate top crime type inside that district
        if (data.records.length > 0) {
          const crimeCounts = {};
          data.records.forEach(r => {
            crimeCounts[r.crime_type] = (crimeCounts[r.crime_type] || 0) + 1;
          });
          const topCrime = Object.entries(crimeCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

          setDistrictInsight({
            name: matchedDistrict,
            count: data.records.length,
            topCrime: topCrime
          });
        }
      } 
      else if (matchedCrimeType) {
        params.append('crime_type', matchedCrimeType);
        const response = await fetch(`${url}?${params.toString()}&limit=100`);
        const data = await response.json();
        setResults(data.records);
      } 
      else if (matchedStatus) {
        params.append('status', matchedStatus);
        const response = await fetch(`${url}?${params.toString()}&limit=100`);
        const data = await response.json();
        setResults(data.records);
      } 
      else {
        // Default -> Latest 5 complaints
        const response = await fetch(`${url}?limit=5`);
        const data = await response.json();
        setResults(data.records);
      }
    } catch (err) {
      setError('Error communicating with intelligence node.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en-IN' ? 'kn-IN' : 'en-IN');
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case 'Under Investigation': return 'badge investigation';
      case 'FIR Filed': return 'badge fir';
      case 'Arrested': return 'badge arrested';
      case 'Court': return 'badge court';
      case 'Closed': return 'badge closed';
      default: return 'badge';
    }
  };

  return (
    <div style={styles.container}>
      {/* Voice Control Hub */}
      <div className="chart-card" style={styles.micCard}>
        <div className="chart-header">
          <span className="chart-title">BILINGUAL VOICE INTEL CORE</span>
          <span style={{ fontSize: '10px', color: isListening ? '#ff3b30' : '#00e5ff', fontFamily: 'monospace' }}>
            {isListening ? '● CAPTURING WAVEFORMS...' : '● SPEECH NODE ONLINE'}
          </span>
        </div>

        {/* Toggle Switch */}
        <div style={styles.toggleRow}>
          <span style={styles.toggleLabel}>LANGUAGE CONFIGURATION:</span>
          <label style={styles.switch}>
            <input 
              type="checkbox" 
              checked={language === 'kn-IN'} 
              onChange={toggleLanguage} 
              style={styles.switchInput}
            />
            <div style={styles.slider}>
              <span style={{ ...styles.sliderText, color: language === 'en-IN' ? '#00e5ff' : '#4f616d' }}>ENGLISH (en-IN)</span>
              <span style={{ ...styles.sliderText, color: language === 'kn-IN' ? '#00e5ff' : '#4f616d' }}>ಕನ್ನಡ (kn-IN)</span>
            </div>
          </label>
        </div>

        {/* Microphone Button */}
        <div style={styles.micCenter}>
          <button
            onClick={handleVoiceListen}
            style={{
              ...styles.bigMicBtn,
              borderColor: isListening ? '#ff3b30' : '#1a2a3a',
              boxShadow: isListening ? '0 0 25px rgba(255, 59, 48, 0.2)' : '0 0 15px rgba(0, 229, 255, 0.05)',
            }}
          >
            {isListening ? (
              <MicOff size={44} color="#ff3b30" />
            ) : (
              <Mic size={44} color="#00e5ff" />
            )}
          </button>
          <div style={styles.micLabel}>Speak in English or Kannada</div>
          <div style={styles.micStatus} className="mono">
            STATUS: {isListening ? 'LISTENING_ACTIVE' : 'STANDBY_READY'}
          </div>
          
          {/* Manual Input Fallback */}
          <div style={styles.manualInputContainer}>
            <input 
              type="text" 
              placeholder="OR TYPE COMMAND (e.g. ಬೆಂಗಳೂರು, phone number, Sextortion...)" 
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualInput.trim()) {
                  setTranscript(manualInput);
                  processTranscript(manualInput);
                  setManualInput('');
                }
              }}
              style={styles.manualInputField}
            />
            <button 
              className="cyber-btn"
              onClick={() => {
                if (manualInput.trim()) {
                  setTranscript(manualInput);
                  processTranscript(manualInput);
                  setManualInput('');
                }
              }}
              style={styles.manualInputBtn}
            >
              QUERY
            </button>
          </div>
        </div>

        {/* Help Suggestions */}
        <div style={styles.helpText}>
          <span style={{ color: '#00e5ff', fontWeight: 'bold' }}>KANNADA COMMAND KEYWORDS:</span>
          <span className="mono" style={{ marginLeft: '6px', color: '#8a9ba8' }}>
            ಬೆಂಗಳೂರು (Bengaluru Urban) • ವಂಚನೆ (Fraud cases) • ಸೈಬರ್ (Cyber) • ದೂರು (Complaints) • ಬಂಧನ (Arrested cases)
          </span>
        </div>
      </div>

      {/* Transcript Stats Display */}
      <div style={styles.statsCardContainer}>
        <div className="chart-card" style={styles.statsCard}>
          <div style={styles.statLine}>
            <span style={styles.statLabel}>LAST QUERY TEXT:</span>
            <span style={styles.statVal} className="mono">
              "{transcript || 'None'}"
            </span>
          </div>
          <div style={styles.statLine} style={{ borderLeft: '1px solid #1a2a3a', paddingLeft: '20px' }}>
            <span style={styles.statLabel}>RESULTS FOUND:</span>
            <span style={{ ...styles.statVal, color: '#00e5ff' }} className="mono">
              {results.length} records
            </span>
          </div>
        </div>
      </div>

      {/* District specific Insight banner */}
      {districtInsight && (
        <div className="chart-card" style={styles.insightCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00e5ff' }}>
            <Shield size={16} />
            <span style={{ fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace' }}>
              DISTRICT INTEGRATION INTELLIGENCE DOSSIER: {districtInsight.name.toUpperCase()}
            </span>
          </div>
          <div style={styles.insightMetrics} className="mono">
            <div>CASE VOLUME: <b style={{ color: '#ffffff' }}>{districtInsight.count}</b></div>
            <div style={{ borderLeft: '1px solid #1a2a3a', paddingLeft: '16px' }}>
              PRIMARY THREAT: <b style={{ color: '#ff9500' }}>{districtInsight.topCrime}</b>
            </div>
          </div>
        </div>
      )}

      {/* Results Table Panel */}
      <div style={styles.resultsPanel}>
        <div className="chart-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header">
            <span className="chart-title">QUERY RESULT DATABASE</span>
            <span style={{ fontSize: '10px', color: '#8a9ba8', fontFamily: 'monospace' }}>
              SECURE DECRYPTED CACHE
            </span>
          </div>

          <div className="cyber-table-container" style={{ flexGrow: 1, overflowY: 'auto', minHeight: '200px' }}>
            {loading ? (
              <div style={styles.stateCenter}>
                <div className="loader"></div>
                <span>FETCHING QUERY RESULTS...</span>
              </div>
            ) : error ? (
              <div style={{ ...styles.stateCenter, color: '#ff3b30' }}>
                <span>QUERY SYSTEM EXCEPTION: {error}</span>
              </div>
            ) : results.length === 0 ? (
              <div style={styles.stateCenter}>
                <span>NO RECORDS FOUND MATCHING QUERY SPECIFICATION</span>
              </div>
            ) : (
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>CASE ID</th>
                    <th>DISTRICT</th>
                    <th>CRIME TYPE</th>
                    <th>PLATFORM</th>
                    <th>SUSPECT PHONE</th>
                    <th style={{ textAlign: 'right' }}>LOSS</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((rec) => (
                    <tr key={rec.id}>
                      <td style={{ fontWeight: 'bold', color: '#00e5ff' }}>{rec.id}</td>
                      <td>{rec.victim_district}</td>
                      <td>{rec.crime_type}</td>
                      <td className="mono">{rec.platform}</td>
                      <td className="mono">{rec.accused_phone}</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{rec.loss_amount_inr.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(rec.status)}>{rec.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
    gap: '20px',
    height: 'calc(100vh - 128px)',
    overflowY: 'auto',
    paddingBottom: '20px',
  },
  micCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: 'var(--border)',
    padding: '24px',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #1a2a3a',
    paddingBottom: '14px',
    marginBottom: '20px',
  },
  toggleLabel: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#8a9ba8',
  },
  switch: {
    display: 'inline-flex',
    position: 'relative',
    cursor: 'pointer',
  },
  switchInput: {
    display: 'none',
  },
  slider: {
    display: 'flex',
    backgroundColor: '#0a0d14',
    border: '1px solid #1a2a3a',
    padding: '4px',
    gap: '12px',
  },
  sliderText: {
    fontSize: '10px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    padding: '4px 8px',
  },
  micCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 0',
  },
  bigMicBtn: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#0c101b',
    border: '2px solid #1a2a3a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    outline: 'none',
  },
  micLabel: {
    fontSize: '14px',
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: '6px',
  },
  micStatus: {
    fontSize: '9px',
    color: '#8a9ba8',
    letterSpacing: '1px',
  },
  helpText: {
    borderTop: '1px solid #1a2a3a',
    paddingTop: '14px',
    marginTop: '16px',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statsCardContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  statsCard: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '20px',
    backgroundColor: 'var(--bg-secondary)',
    border: 'var(--border)',
    padding: '16px 24px',
  },
  statLine: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  statLabel: {
    fontSize: '9px',
    color: '#8a9ba8',
    fontFamily: 'monospace',
  },
  statVal: {
    fontSize: '13px',
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  insightCard: {
    backgroundColor: 'rgba(0, 229, 255, 0.02)',
    borderColor: '#00e5ff',
    padding: '16px 24px',
  },
  insightMetrics: {
    display: 'flex',
    gap: '24px',
    fontSize: '11px',
    marginTop: '8px',
    color: '#8a9ba8',
  },
  resultsPanel: {
    flexGrow: 1,
    minHeight: '260px',
  },
  stateCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: '#8a9ba8',
    fontFamily: 'monospace',
    gap: '12px',
  },
  manualInputContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
    width: '100%',
    maxWidth: '480px',
  },
  manualInputField: {
    flexGrow: 1,
    backgroundColor: '#0a0d14',
    border: '1px solid #1a2a3a',
    color: '#ffffff',
    padding: '8px 12px',
    fontFamily: 'monospace',
    fontSize: '11px',
    outline: 'none',
  },
  manualInputBtn: {
    padding: '8px 16px',
    fontSize: '11px',
    fontFamily: 'monospace',
    backgroundColor: 'transparent',
    color: '#00e5ff',
    border: '1px solid #00e5ff',
    cursor: 'pointer',
  },
};

export default VoiceQuery;
