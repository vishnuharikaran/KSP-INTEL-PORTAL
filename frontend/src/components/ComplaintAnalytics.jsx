import React, { useEffect, useState } from 'react';
import { Search, RotateCcw, ChevronLeft, ChevronRight, FileText, Smartphone, Landmark, ShieldCheck } from 'lucide-react';

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

const PLATFORMS = ["WhatsApp", "Instagram", "Facebook", "Telegram", "OLX"];
const STATUSES = ["Under Investigation", "FIR Filed", "Arrested", "Court", "Closed"];

function ComplaintAnalytics() {
  // Query Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [district, setDistrict] = useState('');
  const [crimeType, setCrimeType] = useState('');
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState('');
  
  // Pagination & Loading
  const [records, setRecords] = useState([]);
  const [metadata, setMetadata] = useState({ total_records: 0, page: 1, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Record detail viewer
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (searchTerm) params.append('q', searchTerm);
      if (district) params.append('district', district);
      if (crimeType) params.append('crime_type', crimeType);
      if (status) params.append('status', status);
      if (platform) params.append('platform', platform);

      const response = await fetch(`http://127.0.0.1:8000/api/complaints?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to query complaint log.');
      }
      const data = await response.json();
      setRecords(data.records);
      setMetadata(data.metadata);
    } catch (err) {
      setError(err.message || 'Error communicating with analytics nodes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, district, crimeType, status, platform]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDistrict('');
    setCrimeType('');
    setStatus('');
    setPlatform('');
    setPage(1);
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case 'Under Investigation':
        return 'badge investigation';
      case 'FIR Filed':
        return 'badge fir';
      case 'Arrested':
        return 'badge arrested';
      case 'Court':
        return 'badge court';
      case 'Closed':
        return 'badge closed';
      default:
        return 'badge';
    }
  };

  return (
    <div style={styles.container}>
      {/* Filters HUD */}
      <div className="chart-card" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={styles.filterForm}>
          <div style={styles.searchRow}>
            <div style={{ flexGrow: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search Accused Phone, Accused Bank, Case ID..."
                className="cyber-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
              <Search size={16} style={styles.searchIcon} />
            </div>
            <button type="submit" className="cyber-btn" style={{ padding: '10px 24px' }}>
              QUERY LOGS
            </button>
            <button type="button" className="cyber-btn-outline" onClick={resetFilters} style={styles.resetBtn}>
              <RotateCcw size={14} />
            </button>
          </div>

          <div style={styles.selectorsRow}>
            <div style={styles.selectCol}>
              <label style={styles.selectLabel}>DISTRICT</label>
              <select
                value={district}
                onChange={(e) => { setDistrict(e.target.value); setPage(1); }}
                className="cyber-select"
                style={{ width: '100%' }}
              >
                <option value="">ALL DISTRICTS</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.selectCol}>
              <label style={styles.selectLabel}>CRIME TYPE</label>
              <select
                value={crimeType}
                onChange={(e) => { setCrimeType(e.target.value); setPage(1); }}
                className="cyber-select"
                style={{ width: '100%' }}
              >
                <option value="">ALL CRIME TYPES</option>
                {CRIME_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.selectCol}>
              <label style={styles.selectLabel}>PLATFORM</label>
              <select
                value={platform}
                onChange={(e) => { setPlatform(e.target.value); setPage(1); }}
                className="cyber-select"
                style={{ width: '100%' }}
              >
                <option value="">ALL PLATFORMS</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.selectCol}>
              <label style={styles.selectLabel}>STATUS</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="cyber-select"
                style={{ width: '100%' }}
              >
                <option value="">ALL STATUSES</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Main Workspace grid: table + drawer detail */}
      <div style={styles.workspace}>
        {/* Table list */}
        <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="cyber-table-container" style={{ flexGrow: 1, minHeight: '380px' }}>
            {loading ? (
              <div style={styles.tableStateMessage}>
                <div className="loader" style={styles.microLoader}></div>
                <span>FETCHING CASE FILES...</span>
              </div>
            ) : error ? (
              <div style={{ ...styles.tableStateMessage, color: '#ff3b30' }}>
                <span>QUERY ERROR: {error}</span>
              </div>
            ) : records.length === 0 ? (
              <div style={styles.tableStateMessage}>
                <span>NO REGISTERED CRIME RECORDS MATCHING QUERY FILTERS</span>
              </div>
            ) : (
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>CASE ID</th>
                    <th>DISTRICT</th>
                    <th>CRIME TYPE</th>
                    <th>PLATFORM</th>
                    <th>ACCUSED PHONE</th>
                    <th>ACCUSED BANK</th>
                    <th style={{ textAlign: 'right' }}>LOSS</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedRecord?.id === rec.id ? 'var(--bg-tertiary)' : 'transparent',
                      }}
                    >
                      <td style={{ fontWeight: 'bold', color: '#00e5ff' }}>{rec.id}</td>
                      <td>{rec.victim_district}</td>
                      <td>{rec.crime_type}</td>
                      <td className="mono">{rec.platform}</td>
                      <td className="mono">{rec.accused_phone}</td>
                      <td className="mono" style={{ fontSize: '11px' }}>
                        {rec.accused_bank.split(' (')[0]}
                      </td>
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

          {/* Pagination bar */}
          <div className="pagination-container">
            <div>
              SHOWING <span className="mono" style={{ color: '#00e5ff' }}>{(metadata.page - 1) * 15 + 1}</span> TO{' '}
              <span className="mono" style={{ color: '#00e5ff' }}>
                {Math.min(metadata.page * 15, metadata.total_records)}
              </span>{' '}
              OF <span className="mono" style={{ color: '#00e5ff' }}>{metadata.total_records.toLocaleString()}</span> ENCRYPTED RECORDS
            </div>

            <div className="pagination-buttons">
              <button
                className="cyber-btn-outline"
                style={styles.pageBtn}
                disabled={page <= 1 || loading}
                onClick={() => setPage(1)}
              >
                FIRST
              </button>
              <button
                className="cyber-btn-outline"
                style={styles.pageArrowBtn}
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <div style={styles.pageIndicator}>
                PAGE <span className="mono" style={{ color: '#00e5ff' }}>{metadata.page}</span> OF{' '}
                <span className="mono">{metadata.total_pages}</span>
              </div>
              <button
                className="cyber-btn-outline"
                style={styles.pageArrowBtn}
                disabled={page >= metadata.total_pages || loading}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="cyber-btn-outline"
                style={styles.pageBtn}
                disabled={page >= metadata.total_pages || loading}
                onClick={() => setPage(metadata.total_pages)}
              >
                LAST
              </button>
            </div>
          </div>
        </div>

        {/* Selected File Details drawer */}
        {selectedRecord && (
          <div style={styles.drawer}>
            <div className="chart-header">
              <span className="chart-title">DOSSIER VIEW: {selectedRecord.id}</span>
              <button
                style={styles.closeDrawerBtn}
                onClick={() => setSelectedRecord(null)}
              >
                ×
              </button>
            </div>

            <div style={styles.drawerContent}>
              <div style={styles.drawerSection}>
                <div style={styles.drawerSectionHeader}>
                  <FileText size={14} color="#00e5ff" />
                  <span>INCIDENT PARAMETERS</span>
                </div>
                <div style={styles.drawerFields}>
                  <div style={styles.drawerField}>
                    <span style={styles.dfLabel}>DISTRICT</span>
                    <span style={styles.dfVal}>{selectedRecord.victim_district}</span>
                  </div>
                  <div style={styles.drawerField}>
                    <span style={styles.dfLabel}>DATE OF INCIDENT</span>
                    <span style={styles.dfVal}>{selectedRecord.date_of_incident}</span>
                  </div>
                  <div style={styles.drawerField}>
                    <span style={styles.dfLabel}>CRIME CATEGORY</span>
                    <span style={styles.dfVal}>{selectedRecord.crime_type}</span>
                  </div>
                  <div style={styles.drawerField}>
                    <span style={styles.dfLabel}>DIGITAL CHANNEL</span>
                    <span style={styles.dfVal}>{selectedRecord.platform}</span>
                  </div>
                  <div style={styles.drawerField}>
                    <span style={styles.dfLabel}>LOSS REGISTERED</span>
                    <span style={{ ...styles.dfVal, color: '#ff3b30', fontWeight: 'bold' }}>
                      ₹{selectedRecord.loss_amount_inr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={styles.drawerField}>
                    <span style={styles.dfLabel}>CASE STATUS</span>
                    <div>
                      <span className={getStatusBadgeClass(selectedRecord.status)}>
                        {selectedRecord.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.drawerSection}>
                <div style={styles.drawerSectionHeader}>
                  <Smartphone size={14} color="#ff9500" />
                  <span>ACCUSED OFFENDER PROFILE</span>
                </div>
                <div style={styles.drawerFields}>
                  <div style={styles.drawerField}>
                    <span style={styles.dfLabel}>SUSPECT PHONE / CHAT ID</span>
                    <span style={{ ...styles.dfVal, color: '#ff9500', fontFamily: 'monospace' }}>
                      {selectedRecord.accused_phone}
                    </span>
                  </div>
                  <div style={styles.drawerField}>
                    <span style={styles.dfLabel}>ROUTING MONEY-MULE ACCOUNT</span>
                    <span style={{ ...styles.dfVal, color: '#ff9500', fontFamily: 'monospace', fontSize: '12px' }}>
                      {selectedRecord.accused_bank}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.drawerSection}>
                <div style={styles.drawerSectionHeader}>
                  <Landmark size={14} color="#34c759" />
                  <span>MOCK UPI LEDGER REFERENCES</span>
                </div>
                <div style={styles.ledgerLogs}>
                  <div style={styles.logRow}>
                    <span style={{ color: '#8a9ba8' }}>NPCI-UTR:</span>
                    <span className="mono">81923091{selectedRecord.id.split('-')[2]}</span>
                  </div>
                  <div style={styles.logRow}>
                    <span style={{ color: '#8a9ba8' }}>UPI ID:</span>
                    <span className="mono">payee.suspect@ybl</span>
                  </div>
                  <div style={styles.logRow}>
                    <span style={{ color: '#8a9ba8' }}>NODAL FREEZE:</span>
                    <span style={{ color: selectedRecord.status === 'Closed' ? '#34c759' : '#ff9500' }}>
                      {selectedRecord.status === 'Closed' ? 'COMPLETED' : 'PENDING NOTICE'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.drawerSection}>
                <div style={styles.drawerSectionHeader}>
                  <ShieldCheck size={14} color="#00e5ff" />
                  <span>OFFICER LOG HISTORY</span>
                </div>
                <div style={styles.officerNotes}>
                  <p>
                    • Case logged by operator badge KSP-2026-9812. UTR details extracted from payment slip. Accused accounts
                    notified.
                  </p>
                  {selectedRecord.status === 'Arrested' && (
                    <p style={{ marginTop: '8px', color: '#34c759' }}>
                      • ACCUSED APPREHENDED: Suspect traced via IP address logs on the registered {selectedRecord.platform}{' '}
                      session. Phone confiscated.
                    </p>
                  )}
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
  filterForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  searchRow: {
    display: 'flex',
    gap: '12px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '12px',
    color: '#8a9ba8',
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 14px',
  },
  selectorsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  selectCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  selectLabel: {
    fontSize: '9px',
    fontFamily: 'monospace',
    color: '#8a9ba8',
    letterSpacing: '0.5px',
  },
  workspace: {
    display: 'flex',
    gap: '20px',
    flexGrow: 1,
    minHeight: 0,
  },
  tableStateMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '380px',
    color: '#8a9ba8',
    fontFamily: 'monospace',
    gap: '16px',
  },
  microLoader: {
    width: '24px',
    height: '24px',
    border: '2px solid #1a2a3a',
    borderTop: '2px solid #00e5ff',
  },
  pageBtn: {
    padding: '4px 10px',
    fontSize: '11px',
  },
  pageArrowBtn: {
    padding: '4px 6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageIndicator: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    fontSize: '11px',
    color: '#8a9ba8',
  },
  drawer: {
    width: '380px',
    backgroundColor: 'var(--bg-secondary)',
    border: 'var(--border)',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  closeDrawerBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 6px',
  },
  drawerContent: {
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    flexGrow: 1,
  },
  drawerSection: {
    borderBottom: '1px solid #14202d',
    paddingBottom: '16px',
  },
  drawerSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  drawerFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  drawerField: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  dfLabel: {
    color: '#8a9ba8',
  },
  dfVal: {
    fontWeight: '500',
    color: '#ffffff',
  },
  ledgerLogs: {
    backgroundColor: '#0a0d14',
    border: '1px solid #14202d',
    padding: '10px',
    fontSize: '11px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  logRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: 'monospace',
  },
  officerNotes: {
    fontFamily: 'sans-serif',
    fontSize: '11px',
    color: '#8a9ba8',
    lineHeight: '1.4',
  },
};

export default ComplaintAnalytics;
