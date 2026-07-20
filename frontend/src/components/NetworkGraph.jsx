import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  Share2, Search, Smartphone, Landmark, FileText, Info, Car, FileUp, Briefcase, User, Shield, MapPin, Globe
} from 'lucide-react';

const SEEDED_PHONES = [
  '+91 8699845992',
  '+91 9845012345',
  '+91 9900112233',
  '+91 9448098765'
];

// High-fidelity nodes matching the screenshot
const defaultNodes = [
  { id: "person_a204", label: "Person A-204", type: "suspect", val: 26, uid: "KSP-2026-PERSON-A204" },
  { id: "fir_034", label: "FIR 202600034", type: "fir", val: 18 },
  { id: "fir_035", label: "FIR 202600035", type: "fir", val: 18 },
  { id: "fir_201", label: "FIR 202600201", type: "fir", val: 18 },
  { id: "officer_kumar", label: "Insp. G. Kumar", type: "officer", val: 18 },
  { id: "loc_orr", label: "Outer Ring Road Node", type: "location", val: 18 },
  { id: "phone_1", label: "+91 98765 43210", type: "phone", val: 18 },
  { id: "phone_2", label: "+91 98888 77777", type: "phone", val: 18 },
  { id: "vehicle_999", label: "KA-01-XX-999", type: "vehicle", val: 18 },
  { id: "fir_112", label: "FIR 202600112", type: "fir", val: 18 },
  { id: "person_a301", label: "Person A-301", type: "suspect", val: 18 }
];

const defaultLinks = [
  { source: "person_a204", target: "fir_034", label: "NAMED ACCUSED", type: "normal" },
  { source: "fir_034", target: "officer_kumar", label: "ASSIGNED IO", type: "normal" },
  { source: "person_a204", target: "fir_035", label: "NAMED ACCUSED", type: "normal" },
  { source: "fir_035", target: "loc_orr", label: "IP ORIGIN", type: "normal" },
  { source: "person_a204", target: "phone_1", label: "REGISTRATION SIM", type: "normal" },
  { source: "phone_1", target: "phone_2", label: "LINKED IMEI SIGNATURE", type: "imei" }, // Highlights in orange
  { source: "phone_2", target: "fir_201", label: "SIM ACTIVE", type: "normal" },
  { source: "person_a204", target: "fir_201", label: "BEHAVIORAL LINK (UPI GATEWAY)", type: "behavioral" }, // Medium strength
  { source: "person_a204", target: "vehicle_999", label: "USED VEHICLE", type: "normal" },
  { source: "person_a301", target: "fir_112", label: "ACCUSED", type: "normal" }
];

function NetworkGraph() {
  const [activeTab, setActiveTab] = useState('MOBILE NUMBER');
  const [searchQuery, setSearchQuery] = useState('+91 8699845992');
  const [showPlayground, setShowPlayground] = useState(true);
  const [data, setData] = useState({ nodes: defaultNodes, links: defaultLinks });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Interactive Filters
  const [sliderVal, setSliderVal] = useState(1); // 1 = All Links, 2 = Co-occurrence, 3 = Strong Only
  const [activeEntityFilters, setActiveEntityFilters] = useState({
    suspect: true,
    fir: true,
    phone: true,
    vehicle: true,
    location: true,
    officer: true
  });

  // Path tracer state
  const [pathSource, setPathSource] = useState('');
  const [pathTarget, setPathTarget] = useState('');
  const [burnerPathActive, setBurnerPathActive] = useState(false);

  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 450 });
  const coordsRef = useRef({});

  // Default selection on mount
  useEffect(() => {
    const a204Node = defaultNodes.find(n => n.id === 'person_a204');
    setSelectedNode(a204Node);
  }, []);

  const getSeededPhone = (str) => {
    if (!str) return SEEDED_PHONES[0];
    const sum = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return SEEDED_PHONES[sum % SEEDED_PHONES.length];
  };

  const fetchNetwork = async (queryVal) => {
    if (!queryVal.trim()) return;
    setLoading(true);
    setError('');
    setSelectedNode(null);
    setHoveredNode(null);
    setShowPlayground(false);
    setBurnerPathActive(false);
    setPathSource('');
    setPathTarget('');
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/network/search?q=${encodeURIComponent(queryVal)}&type=${encodeURIComponent(activeTab)}`);
      if (!response.ok) {
        throw new Error('Failed to resolve offender syndicate details.');
      }
      const rawResult = await response.json();
      setData(rawResult);
    } catch (err) {
      setError(err.message || 'Error communicating with graph processor.');
    } finally {
      setLoading(false);
    }
  };

  // Update SVG dimensions
  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: Math.max(400, containerRef.current.clientHeight - 130)
      });
    }
  }, [data, showPlayground]);

  // Render D3 Graph
  useEffect(() => {
    if (!svgRef.current) return;

    // Deep copy to prevent mutating top-level constants
    let nodes = (showPlayground ? defaultNodes : (data.nodes || [])).map(n => ({ ...n }));
    let links = (showPlayground ? defaultLinks : (data.links || [])).map(l => ({ ...l }));

    // Restore cached coordinates and pin them (fx, fy) so the layout is stable
    nodes.forEach(n => {
      if (coordsRef.current[n.id]) {
        n.x = coordsRef.current[n.id].x;
        n.y = coordsRef.current[n.id].y;
        n.fx = coordsRef.current[n.id].x;
        n.fy = coordsRef.current[n.id].y;
      }
    });

    // Filter nodes by enabled entity checkboxes
    nodes = nodes.filter(n => {
      const type = n.type === 'accused' ? 'suspect' : n.type === 'victim' ? 'fir' : n.type;
      return activeEntityFilters[type] !== false; // default true
    });

    const activeNodeIds = new Set(nodes.map(n => n.id));
    links = links.filter(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return activeNodeIds.has(sourceId) && activeNodeIds.has(targetId);
    });

    // Link strength filter (CO-OCCURRENCE / STRONG ONLY)
    if (sliderVal === 3) {
      // Exclude behavioral link
      links = links.filter(l => l.type !== 'behavioral');
    }

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (nodes.length === 0) return;

    // Create D3 Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(110))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Run force ticks synchronously for zero animation layout on render
    for (let i = 0; i < 220; ++i) {
      simulation.tick();
    }
    simulation.stop();

    // Cache the computed coordinates
    nodes.forEach(n => {
      if (n.x !== undefined && n.y !== undefined) {
        coordsRef.current[n.id] = { x: n.x, y: n.y };
      }
    });

    // Draw Links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => {
        if (burnerPathActive && d.type === 'imei') return '#ff9500';
        if (d.type === 'imei') return '#d35400';
        if (d.type === 'behavioral') return '#2980b9';
        return 'var(--border)';
      })
      .attr("stroke-width", d => {
        if (burnerPathActive && d.type === 'imei') return 3;
        if (d.type === 'imei') return 2;
        return 1.5;
      })
      .attr("stroke-dasharray", d => d.type === 'behavioral' ? '3,3' : 'none')
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    // Draw Link Labels
    const linkText = svg.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("fill", "#8a9ba8")
      .style("font-family", "'JetBrains Mono', monospace")
      .style("font-size", "7px")
      .style("pointer-events", "none")
      .attr("text-anchor", "middle")
      .attr("x", d => (d.source.x + d.target.x) / 2)
      .attr("y", d => (d.source.y + d.target.y) / 2 - 4)
      .text(d => d.label || '');

    // Draw Node Groups
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", "grab")
      .on("mouseover", (event, d) => {
        setHoveredNode(d);
      })
      .on("mouseout", () => {
        setHoveredNode(null);
      })
      .on("click", (event, d) => {
        setSelectedNode(d);
        if (!pathSource) {
          setPathSource(d.label);
        } else if (!pathTarget && d.label !== pathSource) {
          setPathTarget(d.label);
        }
      })
      .call(
        d3.drag()
          .on("start", function() { d3.select(this).style("cursor", "grabbing"); })
          .on("drag", function(event, d) {
            d.x = event.x;
            d.y = event.y;
            d3.select(this).attr("transform", `translate(${d.x},${d.y})`);
            link
              .attr("x1", l => l.source.x)
              .attr("y1", l => l.source.y)
              .attr("x2", l => l.target.x)
              .attr("y2", l => l.target.y);
            linkText
              .attr("x", l => (l.source.x + l.target.x) / 2)
              .attr("y", l => (l.source.y + l.target.y) / 2 - 4);
          })
          .on("end", function() { d3.select(this).style("cursor", "grab"); })
      );

    // Draw Node Circles
    nodeGroup.append("circle")
      .attr("r", d => (d.val || 18) / 2 + 5)
      .attr("fill", d => {
        if (d.type === 'suspect' || d.type === 'accused') return '#8b0000'; // Dark Red
        if (d.type === 'fir' || d.type === 'victim') return '#d35400'; // Dark Orange
        if (d.type === 'phone') return '#1b263b';
        if (d.type === 'vehicle') return '#1f2421';
        if (d.type === 'location') return '#2d3142';
        if (d.type === 'officer') return '#0f4c5c';
        return '#3d348b';
      })
      .attr("stroke", d => {
        if (d.id === 'person_a204') return '#ff3b30'; // Highlight A-204 with bright red
        if (selectedNode && d.id === selectedNode.id) return 'var(--cyan)'; // Cyan selection ring
        return '#1a2a3a';
      })
      .attr("stroke-width", d => {
        if (d.id === 'person_a204' || (selectedNode && d.id === selectedNode.id)) return 2.5;
        return 1.5;
      });

    // Draw Node Icons (Unicode characters for stability)
    nodeGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "3")
      .style("font-size", "10px")
      .style("pointer-events", "none")
      .text(d => {
        if (d.type === 'suspect' || d.type === 'accused') return '👤';
        if (d.type === 'fir' || d.type === 'victim') return '📄';
        if (d.type === 'phone') return '📞';
        if (d.type === 'vehicle') return '🚗';
        if (d.type === 'location') return '🌐';
        if (d.type === 'officer') return '👮';
        return '●';
      });

    // Draw Node Labels
    nodeGroup.append("text")
      .attr("y", d => (d.val || 18) / 2 + 17)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--text-primary)")
      .style("font-family", "'JetBrains Mono', monospace")
      .style("font-size", "8px")
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .text(d => d.label);

  }, [dimensions, data, showPlayground, activeEntityFilters, sliderVal, selectedNode, burnerPathActive]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNetwork(searchQuery);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'MOBILE NUMBER') {
      setSearchQuery('+91 8699845992');
    } else if (tabName === 'OFFENDER ID') {
      setSearchQuery('OFF-202319');
    } else if (tabName === 'CASE ID') {
      setSearchQuery('KSP-2026-102230');
    } else if (tabName === 'VEHICLE NUMBER') {
      setSearchQuery('KA02HA3421');
    } else if (tabName === 'CASE FILES') {
      setSearchQuery('EVID_FILE_921');
    }
  };

  const handleCheckboxChange = (key) => {
    setActiveEntityFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTraceBurnerPath = () => {
    setPathSource('+91 98765 43210');
    setPathTarget('+91 98888 77777');
    setBurnerPathActive(true);
  };

  const handleResetLayout = () => {
    coordsRef.current = {};
    setShowPlayground(true);
    setData({ nodes: defaultNodes, links: defaultLinks });
    const a204Node = defaultNodes.find(n => n.id === 'person_a204');
    setSelectedNode(a204Node);
    setPathSource('');
    setPathTarget('');
    setBurnerPathActive(false);
    setSliderVal(1);
    setActiveEntityFilters({
      suspect: true,
      fir: true,
      phone: true,
      vehicle: true,
      location: true,
      officer: true
    });
  };

  const getSelectedNodeInfo = () => {
    if (!selectedNode) return null;
    
    const isA204 = selectedNode.id === 'person_a204' || selectedNode.label === 'Person A-204';
    const isA301 = selectedNode.id === 'person_a301' || selectedNode.label === 'Person A-301';

    if (isA204) {
      return {
        name: "Person A-204",
        uid: "KSP-2026-PERSON-A204",
        overview: "Cyber offender under investigation",
        connections: [
          { name: "FIR 202600034", relation: "Named Accused", strength: "STRONG", aiVerify: false },
          { name: "FIR 202600035", relation: "Named Accused", strength: "STRONG", aiVerify: false },
          { name: "KA-01-XX-999", relation: "Used Vehicle", strength: "STRONG", aiVerify: true },
          { name: "FIR 202600201", relation: "Behavioral Link (UPI Gateway)", strength: "MEDIUM", aiVerify: true }
        ]
      };
    }

    if (isA301) {
      return {
        name: "Person A-301",
        uid: "KSP-2026-PERSON-A301",
        overview: "Associated suspect flagged in local cyber cell",
        connections: [
          { name: "FIR 202600112", relation: "Accused", strength: "STRONG", aiVerify: false }
        ]
      };
    }

    // Dynamic database case node info
    if (selectedNode.type === 'fir') {
      const details = selectedNode.details || {};
      const crimeType = details.crime_type || "Cybercrime";
      const district = details.district || "Karnataka Jurisdiction";
      const status = details.status || "Under Investigation";
      const loss = details.loss ? `₹${details.loss.toLocaleString()}` : "N/A";
      const date = details.date || "N/A";

      return {
        name: selectedNode.label,
        uid: selectedNode.id,
        overview: `Crime Category: ${crimeType} | Incident Date: ${date}`,
        connections: [
          { name: "Victim District", relation: district, strength: "STRONG", aiVerify: false },
          { name: "Financial Loss", relation: loss, strength: "STRONG", aiVerify: false },
          { name: "Case Status", relation: status, strength: "STRONG", aiVerify: false }
        ]
      };
    }

    // Generic display for other node types
    return {
      name: selectedNode.label,
      uid: selectedNode.id,
      overview: `Resolved node of type: ${selectedNode.type.toUpperCase()}`,
      connections: [
        { name: "Direct Correlation", relation: "Identified in database syndicate query", strength: "STRONG", aiVerify: false }
      ]
    };
  };

  const nodeInfo = getSelectedNodeInfo();

  return (
    <div style={styles.container}>
      {/* Network Filters Left Panel */}
      <div style={styles.leftSidebar}>
        <div className="chart-card" style={styles.leftCard}>
          <div className="chart-header" style={{ marginBottom: '12px' }}>
            <span style={styles.sidebarTitle}>NETWORK FILTERS</span>
          </div>

          {/* Min Link Strength Slider */}
          <div style={styles.filterSection}>
            <span style={styles.sidebarLabel}>MIN LINK STRENGTH</span>
            <input 
              type="range" 
              min="1" 
              max="3" 
              value={sliderVal} 
              onChange={(e) => setSliderVal(parseInt(e.target.value))}
              style={styles.sliderInput} 
            />
            <div style={styles.sliderLabelsStrip}>
              <span style={{ color: sliderVal === 1 ? 'var(--cyan)' : '#8a9ba8' }}>ALL</span>
              <span style={{ color: sliderVal === 2 ? 'var(--cyan)' : '#8a9ba8' }}>CO-OCCURRENCE</span>
              <span style={{ color: sliderVal === 3 ? 'var(--cyan)' : '#8a9ba8' }}>STRONG ONLY</span>
            </div>
          </div>

          {/* Entity Type Checkboxes */}
          <div style={styles.filterSection}>
            <span style={styles.sidebarLabel}>ENTITY TYPES</span>
            <div style={styles.checkboxStrip}>
              {[
                { key: 'suspect', label: 'Suspects/Accused', color: '#ff3b30' },
                { key: 'fir', label: 'Cases / FIRs', color: '#ff9500' },
                { key: 'phone', label: 'Phone Connections', color: '#007aff' },
                { key: 'vehicle', label: 'Vehicle Records', color: 'var(--purple)' },
                { key: 'location', label: 'Locations / Hubs', color: '#34c759' },
                { key: 'officer', label: 'Investigating Officers', color: 'var(--cyan)' }
              ].map(item => (
                <label key={item.key} style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={activeEntityFilters[item.key]} 
                    onChange={() => handleCheckboxChange(item.key)}
                    style={styles.checkboxInput}
                  />
                  <span style={{ backgroundColor: item.color, ...styles.checkboxDot }}></span>
                  <span style={styles.checkboxText}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Path Tracer */}
          <div style={styles.filterSection}>
            <span style={styles.sidebarLabel}>PATH TRACER</span>
            <div style={styles.pathTracerBox}>
              <div style={styles.pathTracerRow}>
                <span style={{ color: '#8a9ba8' }}>SOURCE:</span>
                <span style={{ color: pathSource ? 'var(--cyan)' : '#ffffff' }} className="mono">
                  {pathSource || 'Click node'}
                </span>
              </div>
              <div style={styles.pathTracerRow}>
                <span style={{ color: '#8a9ba8' }}>TARGET:</span>
                <span style={{ color: pathTarget ? 'var(--cyan)' : '#ffffff' }} className="mono">
                  {pathTarget || 'Select Source'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Insight Box */}
          <div style={styles.aiInsightBox}>
            <div style={styles.aiInsightHeader}>✦ AI NETWORK INSIGHT</div>
            <p style={styles.aiInsightText}>
              Burner IMEI link detected. Phone signatures active in Bengaluru ORR share temporal proximity with fraud endpoints in Mangaluru.
            </p>
            <button onClick={handleTraceBurnerPath} className="cyber-btn" style={styles.traceBtn}>
              TRACE BURNER PATH
            </button>
          </div>
        </div>
      </div>

      {/* D3 Graph Middle Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Search header for custom queries */}
        <div className="chart-card" style={{ padding: '10px' }}>
          <div style={styles.tabsStrip}>
            {["OFFENDER ID", "CASE ID", "MOBILE NUMBER", "VEHICLE NUMBER", "CASE FILES"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                style={{
                  ...styles.tabBtn,
                  color: activeTab === tab ? 'var(--cyan)' : '#8a9ba8',
                  borderBottom: activeTab === tab ? '2px solid var(--cyan)' : '2px solid transparent',
                  backgroundColor: activeTab === tab ? 'var(--bg-panel)' : 'transparent'
                }}
              >
                <span>{tab}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <div style={styles.inputWrapper}>
              <Search size={14} style={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cyber-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <button type="submit" className="cyber-btn" disabled={loading} style={styles.searchBtn}>
              <span>ANALYSE SUSPECT</span>
            </button>
          </form>
        </div>

        {/* D3 Canvas container */}
        <div ref={containerRef} style={styles.canvasPanel}>
          {showPlayground && (
            <div style={styles.alertLeadBanner}>
              <span>⚠️ AI-DETECTED INVESTIGATIVE LEAD - REQUIRES HUMAN VERIFICATION</span>
            </div>
          )}

          {loading ? (
            <div style={styles.stateCenter}>
              <div className="loader"></div>
              <span>QUERYING CO-OCCURRING PATTERNS...</span>
            </div>
          ) : error ? (
            <div style={{ ...styles.stateCenter, color: '#ff3b30' }}>
              <span>ERROR: {error}</span>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                style={styles.svgCanvas}
              />

              {hoveredNode && (
                <div 
                  style={{
                    ...styles.tooltip,
                    top: `${hoveredNode.y - 45}px`,
                    left: `${hoveredNode.x + 15}px`,
                    borderColor: hoveredNode.type === 'suspect' ? '#ff3b30' : hoveredNode.type === 'fir' ? '#ff9500' : '#007aff'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#ffffff' }}>
                    {hoveredNode.type.toUpperCase()}: {hoveredNode.label}
                  </div>
                  {hoveredNode.uid && (
                    <div style={{ fontSize: '9px', color: '#8a9ba8', marginTop: '2px' }}>
                      UID: {hoveredNode.uid}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={styles.canvasFooter}>
            <button onClick={handleResetLayout} style={styles.resetBtn}>
              RESET LAYOUT
            </button>
          </div>
        </div>
      </div>

      {/* Suspect Details Right Panel */}
      <div style={styles.rightSidebar}>
        <div className="chart-card" style={styles.rightCard}>
          <div style={styles.rightCardHeader}>
            <span style={styles.rightSidebarTitle}>SUSPECT DETAILS</span>
            <span style={styles.riskBadge}>HIGH RISK</span>
          </div>

          {nodeInfo ? (
            <div style={styles.dossierContent}>
              {/* Suspect avatar & name */}
              <div style={styles.suspectHeaderBlock}>
                <div style={styles.avatarBox}>
                  <User size={24} color="#ff3b30" />
                </div>
                <div>
                  <div style={styles.suspectName}>{nodeInfo.name}</div>
                  <div style={styles.suspectUid}>{nodeInfo.uid}</div>
                </div>
              </div>

              {/* Analytical Overview */}
              <div style={styles.analyticalBlock}>
                <div style={styles.sidebarLabel}>ANALYTICAL OVERVIEW</div>
                <div style={styles.overviewTextarea}>
                  {nodeInfo.overview}
                </div>
              </div>

              {/* Evidence connections list */}
              <div style={styles.evidenceBlock}>
                <div style={styles.sidebarLabel}>EVIDENCE TRAIL CONNECTIONS</div>
                <div style={styles.evidenceList}>
                  {nodeInfo.connections.map((conn, idx) => (
                    <div key={idx} style={styles.evidenceItem}>
                      <div style={styles.evidenceItemTop}>
                        <span style={styles.evidenceName}>{conn.name}</span>
                        <span style={{
                          ...styles.strengthBadge,
                          backgroundColor: conn.strength === 'STRONG' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 149, 0, 0.2)',
                          color: conn.strength === 'STRONG' ? '#34c759' : '#ff9500'
                        }}>
                          {conn.strength}
                        </span>
                      </div>
                      <div style={styles.evidenceRelation}>Relation: {conn.relation}</div>
                      {conn.aiVerify && (
                        <div style={styles.aiVerifyRow}>
                          <span style={styles.aiVerifyDot}>●</span>
                          <span>AI LINK (VERIFY)</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyDossier}>
              <Share2 size={24} color="#1a2a3a" />
              <p>NO SUSPECT SELECTED</p>
              <span style={{ fontSize: '10px', color: '#4f616d', textAlign: 'center' }}>
                Click any suspect node inside the D3 workspace layout.
              </span>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr 300px',
    gap: '15px',
    height: 'calc(100vh - 120px)',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  leftSidebar: {
    height: '100%',
    minHeight: 0
  },
  leftCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    boxSizing: 'border-box'
  },
  sidebarTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'var(--cyan)',
    letterSpacing: '1px'
  },
  filterSection: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
  },
  sidebarLabel: {
    fontSize: '9px',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#8a9ba8',
    marginBottom: '8px',
    letterSpacing: '0.5px'
  },
  sliderInput: {
    width: '100%',
    backgroundColor: '#1a2a3a',
    height: '4px',
    outline: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer'
  },
  sliderLabelsStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '8px',
    fontFamily: 'monospace',
    marginTop: '6px'
  },
  checkboxStrip: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '10px',
    color: '#ffffff',
    cursor: 'pointer',
    gap: '8px'
  },
  checkboxInput: {
    cursor: 'pointer'
  },
  checkboxDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  checkboxText: {
    fontSize: '10px',
    fontFamily: 'sans-serif'
  },
  pathTracerBox: {
    backgroundColor: '#070a12',
    border: '1px solid var(--border)',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '10px',
    fontFamily: 'monospace'
  },
  pathTracerRow: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  aiInsightBox: {
    marginTop: 'auto',
    border: '1px solid rgba(255, 149, 0, 0.3)',
    backgroundColor: 'rgba(255, 149, 0, 0.03)',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  aiInsightHeader: {
    fontSize: '9px',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#ff9500',
    fontWeight: 'bold'
  },
  aiInsightText: {
    fontSize: '9px',
    color: '#8a9ba8',
    lineHeight: '1.4',
    margin: 0
  },
  traceBtn: {
    fontSize: '9px',
    height: '28px',
    borderColor: '#ff9500',
    color: '#ff9500',
    fontFamily: 'monospace'
  },
  canvasPanel: {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    flexGrow: 1,
    minHeight: 0
  },
  alertLeadBanner: {
    position: 'absolute',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    border: '1px solid #ff9500',
    padding: '6px 14px',
    borderRadius: '16px',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
  },
  alertLeadBannerText: {
    fontSize: '9px',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#ff9500',
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  },
  svgCanvas: {
    width: '100%',
    height: '100%',
    display: 'block'
  },
  tooltip: {
    position: 'absolute',
    background: '#0a0d14',
    border: '1px solid',
    padding: '6px 10px',
    fontSize: '9px',
    fontFamily: "'JetBrains Mono', monospace",
    pointerEvents: 'none',
    zIndex: 15,
    boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
  },
  canvasFooter: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    zIndex: 10
  },
  resetBtn: {
    fontSize: '9px',
    background: '#1a2a3a',
    color: '#ffffff',
    border: '1px solid #2c3e50',
    padding: '4px 10px',
    cursor: 'pointer',
    fontFamily: 'monospace'
  },
  rightSidebar: {
    height: '100%',
    minHeight: 0
  },
  rightCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    boxSizing: 'border-box'
  },
  rightCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px'
  },
  rightSidebarTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'var(--cyan)'
  },
  riskBadge: {
    fontSize: '8px',
    fontFamily: 'monospace',
    color: '#ff3b30',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    border: '1px solid #ff3b30',
    padding: '2px 6px',
    fontWeight: 'bold'
  },
  dossierContent: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0
  },
  suspectHeaderBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid #1a2a3a',
    paddingBottom: '12px',
    marginBottom: '14px'
  },
  avatarBox: {
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    border: '1px solid rgba(255, 59, 48, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  suspectName: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#ffffff'
  },
  suspectUid: {
    fontSize: '9px',
    color: '#8a9ba8',
    fontFamily: 'monospace',
    marginTop: '2px'
  },
  analyticalBlock: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '14px'
  },
  overviewTextarea: {
    backgroundColor: '#070a12',
    border: '1px solid var(--border)',
    padding: '8px 10px',
    fontSize: '11px',
    color: '#ffffff',
    minHeight: '40px',
    fontFamily: 'sans-serif'
  },
  evidenceBlock: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
    overflowY: 'auto'
  },
  evidenceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '210px',
    overflowY: 'auto'
  },
  evidenceItem: {
    backgroundColor: '#070a12',
    border: '1px solid var(--border)',
    padding: '8px 10px',
  },
  evidenceItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  evidenceName: {
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 'bold',
    color: '#ffffff'
  },
  strengthBadge: {
    fontSize: '8px',
    fontFamily: 'monospace',
    padding: '1px 5px',
    fontWeight: 'bold'
  },
  evidenceRelation: {
    fontSize: '9px',
    color: '#8a9ba8'
  },
  aiVerifyRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '8px',
    fontFamily: 'monospace',
    color: '#ff9500',
    marginTop: '4px',
    gap: '4px'
  },
  aiVerifyDot: {
    fontSize: '10px'
  },
  rightSidebarFooter: {
    marginTop: 'auto',
    borderTop: '1px solid #1a2a3a',
    paddingTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  restrictionLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '8px',
    fontFamily: 'monospace',
    color: '#34c759'
  },
  workspaceBtn: {
    width: '100%',
    backgroundColor: 'var(--cyan-bg)',
    color: 'var(--cyan)',
    border: '1px solid var(--cyan)',
    height: '32px',
    fontSize: '10px',
    fontFamily: 'monospace',
    cursor: 'pointer'
  },
  tabsStrip: {
    display: 'flex',
    borderBottom: '1px solid #1a2a3a',
    marginBottom: '10px',
    overflowX: 'auto'
  },
  tabBtn: {
    padding: '8px 12px',
    fontSize: '9px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 'bold',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    display: 'flex',
    alignItems: 'center'
  },
  searchForm: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    color: '#8a9ba8'
  },
  searchBtn: {
    height: '34px',
    padding: '0 16px',
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace', sans-serif"
  },
  emptyDossier: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    height: '200px',
    color: '#4f616d',
    fontFamily: 'monospace',
    fontSize: '10px'
  },
  stateCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    color: '#8a9ba8',
    fontFamily: 'monospace',
    fontSize: '10px',
    gap: '12px'
  }
};

export default NetworkGraph;
