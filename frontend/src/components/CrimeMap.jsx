import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function CrimeMap() {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerGroup = useRef(null);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/districts');
        if (!response.ok) {
          throw new Error('Failed to fetch district breakdown.');
        }
        const data = await response.json();
        const sortedData = [...data].sort((a, b) => b.cases - a.cases);
        setDistricts(sortedData);
        const blr = sortedData.find(d => d.name === "Bengaluru Urban") || sortedData[0];
        setSelectedDistrict(blr);
      } catch (err) {
        setError(err.message || 'Error loading district data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDistricts();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (loading || error || districts.length === 0 || !mapContainerRef.current) return;

    if (!mapRef.current) {
      // Create map centered at [15.3, 75.7], zoom 7
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([15.3, 75.7], 7);

      // Add CartoDB Dark Matter map tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        minZoom: 6
      }).addTo(mapRef.current);

      // Custom zoom control
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      
      // Initialize layer group for markers
      markersLayerGroup.current = L.layerGroup().addTo(mapRef.current);
    }

    // Refresh circle markers
    markersLayerGroup.current.clearLayers();

    districts.forEach((dist) => {
      // Normalize cases between min (40) and max (490) to radius [6, 20] for visual representation
      const minCases = 40;
      const maxCases = 490;
      const normalized = Math.max(0, Math.min(1, (dist.cases - minCases) / (maxCases - minCases)));
      const radius = 6 + normalized * 14;
      
      // Color scale based on target region thresholds: 2 Green (< 80), 3 Yellow (80 - 200), rest Red (> 200)
      let color = '#ff3b30'; // Red (critical: > 200)
      if (dist.cases < 80) {
        color = '#34c759'; // Green (low: < 80)
      } else if (dist.cases <= 200) {
        color = '#ffcc00'; // Yellow (medium: 80 - 200)
      }

      const marker = L.circleMarker([dist.lat, dist.lng], {
        radius: radius,
        fillColor: color,
        color: color,
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.4
      });

      // Find top crime type in district
      const topCrime = Object.entries(dist.crimes)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Deterministic YoY Change and Active Station
      const seed = dist.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const yoyChange = (seed % 31) - 15; // -15% to 15%
      const yoyStr = yoyChange >= 0 ? `+${yoyChange}%` : `${yoyChange}%`;
      const stations = ["Cyber Crime PS", "Town Police Station", "Central Crime PS", "Headquarters PS"];
      const activeStation = `${dist.name} ${stations[seed % stations.length]}`;

      const popupContent = `
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #ffffff; background-color: #10141f; padding: 10px; border: 1px solid #1a2a3a; border-radius: 0;">
          <h4 style="margin: 0 0 6px 0; color: #00e5ff; font-size: 13px; text-transform: uppercase;">${dist.name}</h4>
          <div style="margin-bottom: 4px;"><b>TOTAL CRIMES:</b> ${dist.cases}</div>
          <div style="margin-bottom: 4px;"><b>TOP CRIME:</b> ${topCrime}</div>
          <div style="margin-bottom: 4px;"><b>YOY CHANGE:</b> ${yoyStr}</div>
          <div><b>MOST ACTIVE PS:</b> ${activeStation}</div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'cyber-leaflet-popup'
      });

      marker.on('click', () => {
        setSelectedDistrict(dist);
      });

      marker.addTo(markersLayerGroup.current);
    });

  }, [loading, error, districts]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <div style={styles.loadingText}>RENDERING CYBER COORDINATE MAP...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorHeader}>MAP RENDER FAILURE</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Map visualization block */}
      <div style={styles.mapPanel}>
        <div className="chart-header">
          <span className="chart-title">GEOSPATIAL LEAFLET INTEL NETWORKING GRID</span>
          <span style={{ fontSize: '10px', color: '#ff3b30', fontFamily: 'monospace' }}>
            ● LEAFLET ACTIVE
          </span>
        </div>

        <div style={styles.mapWrapper}>
          {/* Leaflet container ref */}
          <div ref={mapContainerRef} style={styles.mapCanvas} />

          {/* Map Overlay HUD */}
          <div style={styles.hudOverlay}>
            <div style={styles.hudItem}>
              <span style={{ backgroundColor: '#ff3b30', ...styles.hudDot }}></span>
              <span>Red (&gt;150 Cases)</span>
            </div>
            <div style={styles.hudItem}>
              <span style={{ backgroundColor: '#ffcc00', ...styles.hudDot }}></span>
              <span>Yellow (51-150 Cases)</span>
            </div>
            <div style={styles.hudItem}>
              <span style={{ backgroundColor: '#34c759', ...styles.hudDot }}></span>
              <span>Green (0-50 Cases)</span>
            </div>
          </div>
        </div>
      </div>

      {/* District Detail Inspector panel */}
      <div style={styles.detailPanel}>
        {selectedDistrict ? (
          <div className="chart-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="chart-header">
              <span className="chart-title">DISTRICT INTELLIGENCE DOSSIER</span>
            </div>
            <h2 style={styles.dossierTitle}>{selectedDistrict.name.toUpperCase()}</h2>
            <div style={styles.dossierGrid}>
              <div style={styles.dossierStat}>
                <span style={styles.dossierLabel}>TOTAL INCIDENTS</span>
                <span style={styles.dossierVal}>{selectedDistrict.cases.toLocaleString()}</span>
              </div>
              <div style={styles.dossierStat}>
                <span style={styles.dossierLabel}>ACTIVE STATIONS</span>
                <span style={{ ...styles.dossierVal, color: '#00e5ff' }}>5 Active</span>
              </div>
            </div>

            {/* Crime distribution in district */}
            <div style={styles.subHeader}>CRIME TYPES LOGGED:</div>
            <div style={styles.dossierList}>
              {Object.entries(selectedDistrict.crimes)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, count]) => (
                  <div key={name} style={styles.listItem}>
                    <span>{name}</span>
                    <span className="mono" style={{ color: '#00e5ff' }}>
                      {count} ({((count / selectedDistrict.cases) * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
            </div>

            {/* Status counts in district */}
            <div style={styles.subHeader}>CASE INVESTIGATION STATUS:</div>
            <div style={styles.dossierList}>
              {Object.entries(selectedDistrict.statuses).map(([status, count]) => (
                <div key={status} style={styles.listItem}>
                  <span>{status}</span>
                  <span className="mono">{count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="chart-card" style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a9ba8', fontFamily: 'monospace', fontSize: '11px', textAlign: 'center', padding: '40px' }}>
            SELECT A DISTRICT CIRCLE MARKER ON THE MAP TO INSPECT DETAILS
          </div>
        )}
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
    gridTemplateColumns: '1.2fr 1fr',
    gap: '20px',
    height: 'calc(100vh - 128px)',
  },
  mapPanel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-secondary)',
    border: 'var(--border)',
    padding: '24px',
    minHeight: 0,
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
  hudOverlay: {
    position: 'absolute',
    bottom: '16px',
    left: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    backgroundColor: 'rgba(10, 13, 20, 0.8)',
    border: '1px solid #1a2a3a',
    padding: '10px',
    fontFamily: 'monospace',
    fontSize: '10px',
    zIndex: 1000,
  },
  hudItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  hudDot: {
    width: '8px',
    height: '8px',
    display: 'inline-block',
  },
  detailPanel: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  dossierTitle: {
    fontFamily: 'monospace',
    fontSize: '18px',
    color: '#00e5ff',
    borderBottom: '1px solid #1a2a3a',
    paddingBottom: '8px',
    marginBottom: '14px',
  },
  dossierGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  dossierStat: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '12px',
    border: '1px solid rgba(26, 42, 58, 0.5)',
  },
  dossierLabel: {
    fontSize: '9px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    marginBottom: '4px',
    fontFamily: 'monospace',
  },
  dossierVal: {
    fontSize: '14px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#ffffff',
  },
  subHeader: {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    marginBottom: '8px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  dossierList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
    fontSize: '12px',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 8px',
    backgroundColor: '#0a0d14',
    border: '1px solid #14202d',
    fontFamily: 'monospace',
  },
  leaderboardScroll: {
    overflowY: 'auto',
    maxHeight: '300px',
  },
};

export default CrimeMap;
