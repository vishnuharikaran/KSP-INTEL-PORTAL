import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { ShieldAlert, TrendingUp, AlertTriangle, ShieldCheck, PlayCircle } from 'lucide-react';

const DISTRICT_COORDS = {
  "Bagalkot": [16.1813, 75.6958],
  "Ballari": [15.1394, 76.9214],
  "Belagavi": [15.8497, 74.4977],
  "Bengaluru Rural": [13.2284, 77.5794],
  "Bengaluru Urban": [12.9716, 77.5946],
  "Bidar": [17.9104, 77.5199],
  "Chamarajanagar": [11.9261, 76.9402],
  "Chikkaballapur": [13.4354, 77.7289],
  "Chikkamagaluru": [13.3161, 75.7720],
  "Chitradurga": [14.2251, 76.3980],
  "Dakshina Kannada": [12.9141, 74.8560],
  "Davanagere": [14.4644, 75.9218],
  "Dharwad": [15.4589, 75.0078],
  "Gadag": [15.4312, 75.6360],
  "Hassan": [13.0072, 76.1026],
  "Haveri": [14.7937, 75.4047],
  "Kalaburagi": [17.3297, 76.8343],
  "Kodagu": [12.4244, 75.7382],
  "Kolar": [13.1368, 78.1292],
  "Koppal": [15.3463, 76.1554],
  "Mandya": [12.5218, 76.8951],
  "Mysuru": [12.2958, 76.6394],
  "Raichur": [16.2120, 77.3556],
  "Ramanagara": [12.7150, 77.2813],
  "Shivamogga": [13.9299, 75.5681],
  "Tumakuru": [13.3392, 77.1140],
  "Udupi": [13.3409, 74.7421],
  "Uttara Kannada": [14.8080, 74.1844],
  "Vijayapura": [16.8302, 75.7100],
  "Yadgir": [16.7600, 77.1300],
  "Vijayanagara": [15.2689, 76.3909]
};

function PredictiveIntel() {
  const [riskScores, setRiskScores] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerGroup = useRef(null);

  // Fetch ML predictive and trends data
  useEffect(() => {
    const fetchPredictiveData = async () => {
      try {
        const [riskRes, trendsRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/predictive/risk-scores'),
          fetch('http://127.0.0.1:8000/api/trends/emerging')
        ]);

        if (!riskRes.ok || !trendsRes.ok) {
          throw new Error('Failed to query scikit-learn models.');
        }

        const riskData = await riskRes.json();
        const trendsData = await trendsRes.json();

        // Sort descending by risk score
        const sortedRisk = [...riskData].sort((a, b) => b.risk_score - a.risk_score);

        setRiskScores(sortedRisk);
        setTrends(trendsData);
      } catch (err) {
        setError(err.message || 'Error communicating with intelligence models.');
      } finally {
        setLoading(false);
      }
    };
    fetchPredictiveData();
  }, []);

  const getRiskColor = (score) => {
    if (score >= 86) return '#ff2d55'; // Red
    if (score >= 61) return '#ff6b35'; // Orange
    if (score >= 31) return '#ffaa00'; // Amber
    return '#00ff88'; // Green
  };

  // Initialize Map
  useEffect(() => {
    if (loading || error || riskScores.length === 0 || !mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([15.3, 75.7], 7);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        minZoom: 6
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      markersLayerGroup.current = L.layerGroup().addTo(mapRef.current);
    }

    markersLayerGroup.current.clearLayers();

    riskScores.forEach((dist) => {
      const coords = DISTRICT_COORDS[dist.district];
      if (!coords) return;

      const score = dist.risk_score;
      const color = getRiskColor(score);
      const isCritical = score >= 86;

      // Custom divicon with risk score text inside
      const markerHtml = `
        <div class="risk-marker-container ${isCritical ? 'pulse-red' : ''}" style="background-color: ${color};">
          <span>${score}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-risk-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(coords, { icon: customIcon });

      const popupContent = `
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #ffffff; background-color: #10141f; padding: 10px; border: 1px solid #1a2a3a; border-radius: 0; min-width: 180px;">
          <h4 style="margin: 0 0 6px 0; color: ${color}; font-size: 13px; text-transform: uppercase;">${dist.district}</h4>
          <div style="margin-bottom: 4px;"><b>RISK SCORE:</b> <span style="color: ${color}">${score}</span></div>
          <div style="margin-bottom: 4px;"><b>RISK LEVEL:</b> ${dist.risk_level}</div>
          <div style="margin-bottom: 4px;"><b>TOP FACTOR:</b> ${dist.top_contributing_factor}</div>
          <div><b>FORECAST:</b> ${dist.predicted_trend}</div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'cyber-leaflet-popup'
      });

      marker.addTo(markersLayerGroup.current);
    });

  }, [loading, error, riskScores]);

  const dispatchUnit = (district, crime) => {
    const id = Date.now();
    const message = `Unit dispatched to ${district} — Cyber Cell notified`;
    
    // Add toast notification
    setToasts((prev) => [...prev, { id, message }]);
    
    // Clear toast after 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <div style={styles.loadingText}>RUNNING RANDOM FOREST PREDICTIVE INFERENCE...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorHeader}>INFERENCE FAULT DETECTED</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast-notification">
            <ShieldCheck size={16} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Left Column: Map + Bar Chart */}
      <div style={styles.leftCol}>
        {/* Leaflet dark map */}
        <div className="chart-card" style={styles.mapCard}>
          <div className="chart-header">
            <span className="chart-title">PREDICTIVE RISK SCORE GRID (0 - 100)</span>
            <span style={{ fontSize: '10px', color: '#ff2d55', fontFamily: 'monospace' }}>
              ● RF FORECAST RESOLVED
            </span>
          </div>
          <div style={styles.mapWrapper}>
            <div ref={mapContainerRef} style={styles.mapCanvas} />
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="chart-card" style={styles.barChartCard}>
          <div className="chart-header">
            <span className="chart-title">DISTRICT RISK DISTRIBUTION LEADERBOARD</span>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={riskScores}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid stroke="#1a2a3a" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="district" 
                  stroke="#00e5ff" 
                  style={{ fontFamily: 'monospace', fontSize: '7px' }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  stroke="#00e5ff" 
                  style={{ fontFamily: 'monospace', fontSize: '9px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0d14',
                    border: '1px solid #1a2a3a',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    borderRadius: 0
                  }}
                  itemStyle={{ color: '#00e5ff' }}
                />
                <Bar dataKey="risk_score" name="Risk Score">
                  {riskScores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk_score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right Column: Emerging Threat Alerts */}
      <div style={styles.rightCol}>
        <div className="chart-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header">
            <span className="chart-title">EMERGING SPIKE THREAT ALERTS</span>
            <span style={{ fontSize: '10px', color: '#ff2d55', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={12} /> SPARK DETECTED
            </span>
          </div>
          
          <div style={styles.alertsList}>
            {trends.length === 0 ? (
              <div style={styles.emptyAlerts}>
                <TrendingUp size={24} color="#1a2a3a" />
                <span>NO EMERGING TRENDS DETECTED ABOVE THRESHOLD</span>
              </div>
            ) : (
              trends.map((t, idx) => (
                <div key={idx} style={styles.alertCard}>
                  <div style={styles.alertHeader}>
                    <AlertTriangle size={14} color="#ff2d55" />
                    <span>EMERGING THREAT METRICS</span>
                  </div>
                  <div style={styles.alertDistrict}>
                    {t.crime_type} — {t.district} District
                  </div>
                  <div style={styles.alertRate}>
                    {t.spike_percentage >= 100 ? '↑ NEW ACTIVATION' : `↑ ${t.spike_percentage}% vs 90-day average`}
                  </div>
                  <div style={styles.alertActions}>
                    <button 
                      className="cyber-btn-outline" 
                      style={styles.alertBtn}
                      onClick={() => {
                        const coords = DISTRICT_COORDS[t.district];
                        if (coords && mapRef.current) {
                          mapRef.current.setView(coords, 9);
                          // find matching risk item to open popup
                          markersLayerGroup.current.eachLayer((marker) => {
                            if (marker.getLatLng().lat === coords[0] && marker.getLatLng().lng === coords[1]) {
                              marker.openPopup();
                            }
                          });
                        }
                      }}
                    >
                      VIEW ON MAP
                    </button>
                    <button 
                      className="cyber-btn" 
                      style={{ ...styles.alertBtn, backgroundColor: '#ff2d55', color: '#0a0d14', border: '1px solid #ff2d55' }}
                      onClick={() => dispatchUnit(t.district, t.crime_type)}
                    >
                      ASSIGN UNIT
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
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
  },
  container: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '20px',
    height: 'calc(100vh - 128px)',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minHeight: 0,
  },
  mapCard: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '280px',
  },
  mapWrapper: {
    flexGrow: 1,
    position: 'relative',
    minHeight: 0,
  },
  mapCanvas: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0d14',
    border: '1px solid rgba(26, 42, 58, 0.2)',
  },
  barChartCard: {
    height: '280px',
    flexShrink: 0,
  },
  rightCol: {
    height: '100%',
    minHeight: 0,
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
    flexGrow: 1,
  },
  emptyAlerts: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    height: '300px',
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
    fontSize: '11px',
  },
  alertCard: {
    borderLeft: '4px solid #ff2d55',
    backgroundColor: '#1a0a0a',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '9px',
    color: '#ff2d55',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  alertDistrict: {
    fontSize: '13px',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  alertRate: {
    fontSize: '12px',
    color: '#ff2d55',
    fontFamily: 'monospace',
  },
  alertActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '6px',
  },
  alertBtn: {
    padding: '6px 12px',
    fontSize: '10px',
    fontFamily: 'monospace',
  },
};

export default PredictiveIntel;
