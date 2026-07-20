import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Users, Shield, Clock, MapPin, Check, AlertTriangle, 
  ShieldAlert, RefreshCw, ChevronUp, ChevronDown 
} from 'lucide-react';

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

function ResourceDeployment() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState("district");
  const [sortAsc, setSortAsc] = useState(true);
  const [successToast, setSuccessToast] = useState("");

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerGroup = useRef(null);

  const fetchDeploymentData = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/deployment");
      if (!res.ok) throw new Error("Failed to fetch deployment data.");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeploymentData();
  }, []);

  // Initialize and Render Map
  useEffect(() => {
    if (loading || error || !data || !mapContainerRef.current) return;

    if (!mapRef.current) {
      // Centered at [15.3, 75.7], zoom 7
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([15.3, 75.7], 7);

      // Dark Matter Tile Layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        minZoom: 6
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      markersLayerGroup.current = L.layerGroup().addTo(mapRef.current);
    }

    markersLayerGroup.current.clearLayers();

    data.districts.forEach(dist => {
      const coords = DISTRICT_COORDS[dist.district];
      if (!coords) return;

      const officers = dist.officers_deployed;
      const radius = Math.max(5, Math.min(22, Math.sqrt(officers) * 3));

      let color = '#34c759'; // Well-staffed
      if (officers < 10) color = '#ff3b30'; // Understaffed
      else if (officers <= 25) color = '#ffcc00'; // Adequate

      const marker = L.circleMarker(coords, {
        radius: radius,
        fillColor: color,
        color: color,
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.35
      });

      const popupContent = `
        <div style="font-family: monospace; font-size: 11px; color: #ffffff; background-color: var(--bg-panel); padding: 12px; border: 1px solid var(--border);">
          <h4 style="margin: 0 0 6px 0; color: var(--cyan); font-size: 13px; text-transform: uppercase;">${dist.district}</h4>
          <div style="margin-bottom: 4px;"><b>OFFICERS DEPLOYED:</b> ${officers}</div>
          <div style="margin-bottom: 4px;"><b>PATROL UNITS:</b> ${dist.patrol_units}</div>
          <div style="margin-bottom: 4px;"><b>ACTIVE CASES:</b> ${dist.active_cases}</div>
          <div style="margin-bottom: 4px;"><b>CASES/OFFICER:</b> ${dist.cases_per_officer}</div>
          <div style="margin-top: 6px;">
            <span style="font-size:9px; padding:2px 6px; background-color:${color}20; color:${color}; border:1px solid ${color}40; border-radius:2px;">
              ${dist.deployment_status}
            </span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'cyber-leaflet-popup'
      });

      marker.addTo(markersLayerGroup.current);
    });

  }, [loading, error, data]);

  const handleApproveSuggestion = async (district, recommendedCount) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/deployment/approve?district=${encodeURIComponent(district)}&count=${recommendedCount}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to reallocate resources.");
      const json = await res.json();
      showToast(json.message);
      fetchDeploymentData(); // Refresh list to reflect update
    } catch (err) {
      showToast("Error reallocating resources.", "error");
    }
  };

  const handleDeferSuggestion = (district) => {
    setData(prev => {
      const filteredSuggestions = prev.suggestions.filter(s => s.district !== district);
      return {
        ...prev,
        suggestions: filteredSuggestions
      };
    });
    showToast(`Suggestion for ${district} deferred.`);
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3000);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getSortedDistricts = () => {
    if (!data) return [];
    return [...data.districts].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  };

  if (loading && !data) {
    return (
      <div style={styles.centeredState}>
        <div style={styles.loader}></div>
        <div style={{ color: 'var(--cyan)', fontFamily: 'monospace', fontSize: '11px', marginTop: '12px' }}>
          FETCHING INTELLIGENCE DATA...
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

  const { stats, suggestions } = data;
  const sortedDistricts = getSortedDistricts();

  const getStatusBadgeStyles = (status) => {
    if (status === "OVERLOADED" || status === "UNDERSTAFFED") {
      return { backgroundColor: 'var(--red-bg)', color: 'var(--red)', borderColor: 'rgba(255, 45, 85, 0.2)' };
    }
    if (status === "BALANCED" || status === "ADEQUATE") {
      return { backgroundColor: 'var(--amber-bg)', color: 'var(--amber)', borderColor: 'rgba(255, 170, 0, 0.2)' };
    }
    return { backgroundColor: 'var(--green-bg)', color: 'var(--green)', borderColor: 'rgba(0, 255, 136, 0.2)' };
  };

  return (
    <div style={styles.container}>
      {/* Toast Notification */}
      {successToast && (
        <div style={styles.toast}>
          <Check size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* HEADER STATS */}
      <div className="stats-grid">
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">TOTAL OFFICERS ACTIVE</div>
          <div className="stat-value">{stats.total_officers.toLocaleString()}</div>
          <div className="stat-subtitle">Deployed Statewide</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">UNITS DEPLOYED</div>
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>{stats.total_units.toLocaleString()}</div>
          <div className="stat-subtitle">Patrol, Spec, & Investigation</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">DISTRICTS COVERED</div>
          <div className="stat-value">{stats.districts_covered}</div>
          <div className="stat-subtitle">Karnataka jurisdictions</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-label">AVG RESPONSE TIME</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{stats.avg_response_time} min</div>
          <div className="stat-subtitle">Emergency dispatch logs</div>
        </div>
      </div>

      {/* MAP AND SUGGESTIONS SECTION */}
      <div style={styles.mapGrid}>
        {/* LEAFLET MAP PANEL */}
        <div className="chart-card" style={styles.mapPanel}>
          <div className="chart-header">
            <span className="chart-title">GEOSPATIAL OFFICER DEPLOYMENT GRID</span>
            <span style={{ fontSize: '10px', color: 'var(--cyan)', fontFamily: 'monospace' }}>● MAP INTERACTIVE</span>
          </div>
          <div style={styles.mapWrapper}>
            <div ref={mapContainerRef} style={styles.mapCanvas} />
            <div style={styles.hudOverlay}>
              <div style={styles.hudItem}>
                <span style={{ backgroundColor: 'var(--red)', ...styles.hudDot }}></span>
                <span>&lt; 10 Deployed (Understaffed)</span>
              </div>
              <div style={styles.hudItem}>
                <span style={{ backgroundColor: 'var(--amber)', ...styles.hudDot }}></span>
                <span>10-25 Deployed (Adequate)</span>
              </div>
              <div style={styles.hudItem}>
                <span style={{ backgroundColor: 'var(--green)', ...styles.hudDot }}></span>
                <span>25+ Deployed (Well Staffed)</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI RESOURCE RECOMMENDATIONS PANEL */}
        <div className="chart-card" style={styles.aiPanel}>
          <div className="chart-header" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="chart-title" style={{ color: 'var(--amber)' }}>AI RESOURCE RECOMMENDATIONS</span>
          </div>

          <div style={styles.aiBody}>
            {suggestions.length === 0 ? (
              <div style={styles.emptyAiState}>NO ACTIVE REALLOCATION THREATS DETECTED.</div>
            ) : (
              suggestions.map((s, idx) => (
                <div key={idx} style={styles.suggestionCard}>
                  <div style={styles.sHeader}>
                    <AlertTriangle size={14} color="var(--red)" />
                    <span>⚠ REALLOCATION SUGGESTED</span>
                  </div>
                  <div style={styles.sDistrict}>{s.district}</div>
                  <div style={styles.sMeta}>
                    <div>Current: <strong>{s.current_officers}</strong></div>
                    <div>Recommended: <strong style={{ color: 'var(--green)' }}>{s.recommended_officers}</strong></div>
                  </div>
                  <p style={styles.sReason}>{s.reason}</p>
                  <div style={styles.sActions}>
                    <button 
                      className="cyber-btn" 
                      onClick={() => handleApproveSuggestion(s.district, s.recommended_officers)}
                      style={{ flexGrow: 1, padding: '4px' }}
                    >
                      APPROVE
                    </button>
                    <button 
                      className="cyber-btn-outline" 
                      onClick={() => handleDeferSuggestion(s.district)}
                      style={{ padding: '4px 10px' }}
                    >
                      DEFER
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DEPLOYMENT TABLE */}
      <div className="chart-card" style={styles.tableCard}>
        <div className="chart-header">
          <span className="chart-title">JURISDICTIONAL RESOURCE INDEX</span>
        </div>
        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("district")} style={{ cursor: 'pointer' }}>
                  DISTRICT {sortField === "district" && (sortAsc ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("officers_deployed")} style={{ cursor: 'pointer' }}>
                  OFFICERS DEPLOYED {sortField === "officers_deployed" && (sortAsc ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("patrol_units")} style={{ cursor: 'pointer' }}>
                  PATROL UNITS {sortField === "patrol_units" && (sortAsc ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("investigation_units")} style={{ cursor: 'pointer' }}>
                  INVESTIGATION UNITS {sortField === "investigation_units" && (sortAsc ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("cases_per_officer")} style={{ cursor: 'pointer' }}>
                  CASES/OFFICER RATIO {sortField === "cases_per_officer" && (sortAsc ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("cases_status")} style={{ cursor: 'pointer' }}>
                  STATUS BADGE {sortField === "cases_status" && (sortAsc ? "▲" : "▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDistricts.map(dist => (
                <tr key={dist.district}>
                  <td style={{ fontWeight: 'bold' }}>{dist.district}</td>
                  <td className="mono">{dist.officers_deployed}</td>
                  <td className="mono">{dist.patrol_units}</td>
                  <td className="mono">{dist.investigation_units}</td>
                  <td className="mono" style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>{dist.cases_per_officer}</td>
                  <td>
                    <span 
                      className="badge" 
                      style={getStatusBadgeStyles(dist.cases_status)}
                    >
                      {dist.cases_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  statCard: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
  },
  mapGrid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 0.8fr',
    gap: '20px',
  },
  mapPanel: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
  },
  mapWrapper: {
    height: '420px',
    position: 'relative',
    border: '1px solid var(--border)',
  },
  mapCanvas: {
    width: '100%',
    height: '100%',
  },
  hudOverlay: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: 'rgba(7, 10, 18, 0.95)',
    border: '1px solid var(--border)',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    zIndex: 999,
  },
  hudItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '9px',
    fontFamily: 'monospace',
    color: '#8a9ba8',
  },
  hudDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  aiPanel: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
  },
  aiBody: {
    padding: '16px',
    overflowY: 'auto',
    maxHeight: '410px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyAiState: {
    textAlign: 'center',
    color: '#4f616d',
    fontFamily: 'monospace',
    fontSize: '10px',
    padding: '60px 0',
  },
  suggestionCard: {
    background: '#070a12',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--red)',
    padding: '12px',
  },
  sHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '9px',
    fontFamily: 'monospace',
    color: 'var(--red)',
    fontWeight: 'bold',
  },
  sDistrict: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#fff',
    marginTop: '6px',
  },
  sMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#8a9ba8',
    marginTop: '4px',
  },
  sReason: {
    fontSize: '10px',
    color: '#4f616d',
    margin: '6px 0 10px',
    lineHeight: '1.4',
  },
  sActions: {
    display: 'flex',
    gap: '8px',
  },
  tableCard: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
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

export default ResourceDeployment;
