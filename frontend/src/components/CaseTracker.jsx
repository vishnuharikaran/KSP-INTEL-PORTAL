import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldAlert, Check, CheckCircle2, AlertCircle, 
  ArrowRight, FileText, ChevronDown, RefreshCw, Scale, Info 
} from 'lucide-react';

function CaseTracker({ initialSearchId, clearInitialSearchId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Detailed Tracked Case State
  const [trackedCase, setTrackedCase] = useState(null);
  const [activeStageTab, setActiveStageTab] = useState("FIR Filed");
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Case Files & Documents States
  const [caseEvidence, setCaseEvidence] = useState([]);
  const [viewDoc, setViewDoc] = useState(null); // { name: 'FIR Copy', content: '...' }
  const [viewEvidenceDetail, setViewEvidenceDetail] = useState(null); // Evidence item object

  const fetchRecentCases = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/cases/track");
      if (!res.ok) throw new Error("Failed to fetch recent cases.");
      const json = await res.json();
      setRecentCases(json);
    } catch (err) {
      setError(err.message || "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseEvidence = async (caseId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/evidence?q=${encodeURIComponent(caseId)}`);
      if (res.ok) {
        const json = await res.json();
        setCaseEvidence(json.records || []);
      }
    } catch (e) {
      console.error("Error fetching case evidence", e);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setTrackedCase(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/cases/track?id=${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) throw new Error("No matching Case ID or FIR record found.");
      const json = await res.json();
      setTrackedCase(json);
      // Default detail card to current stage
      setActiveStageTab(json.current_stage);
      fetchCaseEvidence(json.id);
    } catch (err) {
      setError(err.message || "No matching Case ID or FIR record found.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackClick = async (caseId) => {
    setSearchQuery(caseId);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/cases/track?id=${encodeURIComponent(caseId)}`);
      if (!res.ok) throw new Error("Failed to track case.");
      const json = await res.json();
      setTrackedCase(json);
      setActiveStageTab(json.current_stage);
      fetchCaseEvidence(json.id);
    } catch (err) {
      setError(err.message || "Error tracking case.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentCases();
    if (initialSearchId) {
      handleTrackClick(initialSearchId);
      if (clearInitialSearchId) {
        clearInitialSearchId();
      }
    }
  }, [initialSearchId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const openDocumentContent = (docName) => {
    if (!trackedCase) return;
    
    let content = "";
    const fName = trackedCase.stages["FIR Filed"]?.officer || "Inspector Patil";
    const incidentDate = trackedCase.stages["FIR Filed"]?.date || "2026-06-12";
    const suspectName = trackedCase.stages["Arrest"]?.accused_name || "Offender-402";

    if (docName === "FIR Copy") {
      content = `==================================================
           KARNATAKA STATE POLICE DEPARTMENT
               FIRST INFORMATION REPORT
==================================================
FIR NUMBER      : ${trackedCase.fir_number || 'KSP/2026/90212'}
POLICE STATION  : ${trackedCase.district} Cyber Crime PS
DISTRICT        : ${trackedCase.district}
DATE OF INCIDENT: ${incidentDate}
COMPLAINANT     : ${trackedCase.complainant || 'Anonymous Complainant'}
CRIME TYPE      : ${trackedCase.crime_type}
SECTIONS APPLIED: IT Act 66D, IPC 420

Lead Investigator: ${fName}

DESCRIPTION:
The complainant reported unauthorized financial transfer via fraudulent links mimicking RBI cashback schemes. Accused contact details linked to phone: ${trackedCase.stages["Arrest"]?.accused_name ? 'Linked' : 'Unknown'}.
==================================================`;
    } else if (docName === "Arrest Memo") {
      content = `==================================================
                MEMORANDUM OF ARREST
==================================================
CASE ID         : ${trackedCase.id}
ACCUSED NAME    : ${suspectName}
DATE OF ARREST  : ${trackedCase.stages["Arrest"]?.date || '2026-06-19'}
ARREST LOCATION : Majestic, Bengaluru Transit Hub
ARRESTING OFFICER: ${trackedCase.stages["Arrest"]?.officer || 'Inspector Gowda'}

FRAMED CHARGES  : Identity Theft & Online Financial Spoofing
BAIL STATUS     : ${trackedCase.stages["Arrest"]?.bail_status || 'Denied'}

PRODUCED BEFORE : Chief Metropolitan Magistrate
==================================================`;
    } else if (docName === "Chargesheet") {
      content = `==================================================
               FILING OF CHARGESHEET
==================================================
CASE ID         : ${trackedCase.id}
COURT NAME      : Chief Metropolitan Magistrate Court
FILING DATE     : ${trackedCase.stages["Chargesheet"]?.date || '2026-06-26'}
ACCUSED FRAME   : ${suspectName}

SECTIONS APPLIED: IT Act 66C, IT Act 66D, IPC 420
NEXT HEARING    : ${trackedCase.stages["Chargesheet"]?.next_hearing_date || '2026-07-17'}

PROSECUTION LEAD: Special Cyber Public Prosecutor
==================================================`;
    } else if (docName === "Forensic Report") {
      content = `==================================================
             FORENSIC ANALYSIS REPORT
==================================================
CASE ID         : ${trackedCase.id}
EXAMINATION DATE: ${trackedCase.stages["Investigation"]?.date || '2026-06-15'}
ANALYST OFFICER : ${trackedCase.stages["Investigation"]?.officer || 'Inspector Rao'}

EVIDENCE HASH   : SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
SEAL INTEGRITY  : SEAL INTACT - VERIFIED

SUMMARY OF FINDINGS:
Analysis of digital image mirrors harvested lookalike portals. Log details confirm remote server connections targeting victim credentials.
==================================================`;
    }

    setViewDoc({ name: docName, content });
  };

  const getIntegrityColor = (status) => {
    if (status === "Intact") return "#00ff88";
    if (status === "Compromised") return "#ff2d55";
    return "#ffaa00";
  };

  const stagesOrder = ["FIR Filed", "Investigation", "Arrest", "Chargesheet", "Court Hearing", "Verdict"];

  const isCaseClosedOrArrested = trackedCase && (trackedCase.status === "Closed" || trackedCase.status === "Arrested");

  return (
    <div style={styles.container}>
      {toastMessage && (
        <div style={styles.toast}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SEARCH BAR CARD */}
      <div className="chart-card no-print" style={styles.searchCard}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
            <label style={styles.label}>ENTER CASE ID / FIR COMPLAINT NUMBER TO TRACK</label>
            <div style={styles.searchBox}>
              <Search size={14} color="#8a9ba8" />
              <input 
                type="text" 
                placeholder="e.g. KSP-2027-102330..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="cyber-input-plain"
                style={styles.searchInput}
              />
            </div>
          </div>
          <button type="submit" className="cyber-btn" style={{ padding: '0 24px', height: '38px', marginTop: '18px' }}>
            <span>RESOLVE TARGET</span>
          </button>
        </form>
      </div>

      {/* DETAILED TRACKING TIMELINE */}
      {trackedCase && (
        <div className="chart-card" style={styles.timelineCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} color="#00e5ff" />
              <span className="chart-title">CASE RETRIEVAL DOSSIER — {trackedCase.id}</span>
            </div>
            <span className="badge" style={{ backgroundColor: trackedCase.status === "Closed" ? 'rgba(0,255,136,0.08)' : 'rgba(255,170,0,0.08)', color: trackedCase.status === "Closed" ? '#00ff88' : '#ffaa00' }}>
              {trackedCase.status.toUpperCase()}
            </span>
          </div>

          {/* META INFO STRIP */}
          <div style={styles.metaStrip}>
            <div>
              <span style={styles.metaLabel}>FIR NUMBER REFERENCE</span>
              <span style={styles.metaValue}>{trackedCase.fir_number}</span>
            </div>
            <div>
              <span style={styles.metaLabel}>JURISDICTION DISTRICT</span>
              <span style={styles.metaValue}>{trackedCase.district}</span>
            </div>
            <div>
              <span style={styles.metaLabel}>CLASSIFIED CRIME CATEGORY</span>
              <span style={styles.metaValue}>{trackedCase.crime_type}</span>
            </div>
            <div>
              <span style={styles.metaLabel}>CURRENT ACTIVE PROCESS</span>
              <span style={{ ...styles.metaValue, color: '#ffaa00' }}>{trackedCase.current_stage.toUpperCase()}</span>
            </div>
          </div>

          {/* 6 STAGES STEPPER */}
          <div style={styles.stepperContainer}>
            <div style={styles.stepperLine} />
            <div style={styles.stepperGrid}>
              {stagesOrder.map((stageName, idx) => {
                const stageData = trackedCase.stages[stageName];
                const isCompleted = stageData?.status === "Completed";
                const isInProgress = stageData?.status === "In Progress";
                
                return (
                  <div key={stageName} style={styles.stepNode}>
                    <div 
                      onClick={() => { if (stageData?.status !== "Pending") setActiveStageTab(stageName); }}
                      style={{ 
                        cursor: stageData?.status !== "Pending" ? 'pointer' : 'default',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      {isCompleted ? (
                        <div style={styles.nodeCompleted}>
                          <Check size={12} color="#070a12" strokeWidth={3} />
                        </div>
                      ) : isInProgress ? (
                        <div style={styles.nodeCurrentPulse}>
                          <div style={styles.nodeCurrentInner} />
                        </div>
                      ) : (
                        <div style={styles.nodePending} />
                      )}
                      
                      <span style={{ 
                        ...styles.nodeName, 
                        color: isCompleted ? '#00e5ff' : isInProgress ? '#ffaa00' : '#4f616d'
                      }}>
                        {stageName.toUpperCase()}
                      </span>
                      <span style={styles.nodeDate}>
                        {stageData ? stageData.date : 'PENDING'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SELECTED TIMELINE STAGE DATA DETAILS */}
          <div style={styles.detailContainer}>
            <div style={styles.detailHeader}>
              <span style={styles.detailTitle}>TIMELINE PROGRESSION DETAILS — {activeStageTab.toUpperCase()}</span>
              <span className="badge" style={{ backgroundColor: 'rgba(0, 229, 255, 0.05)', color: '#00e5ff' }}>
                {trackedCase.stages[activeStageTab]?.status.toUpperCase()}
              </span>
            </div>

            <div style={styles.detailBody}>
              {activeStageTab === "FIR Filed" && (
                <div style={styles.detailsGrid}>
                  <div><strong>FIR Number:</strong> <span className="mono">{trackedCase.stages["FIR Filed"].fir_number}</span></div>
                  <div><strong>Filing Officer:</strong> {trackedCase.stages["FIR Filed"].reporting_officer}</div>
                  <div><strong>Jurisdiction Station:</strong> {trackedCase.stages["FIR Filed"].police_station}</div>
                  <div><strong>Filing Timestamp:</strong> <span className="mono">{trackedCase.stages["FIR Filed"].date_filed}</span></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>IPC/IT Sections Applied:</strong> {trackedCase.stages["FIR Filed"].initial_sections?.join(", ")}
                  </div>
                </div>
              )}

              {activeStageTab === "Investigation" && (
                <div style={styles.detailsGrid}>
                  <div><strong>Lead Investigator:</strong> {trackedCase.stages["Investigation"].lead_investigator}</div>
                  <div><strong>Commencement Date:</strong> <span className="mono">{trackedCase.stages["Investigation"].start_date}</span></div>
                  <div><strong>Evidence Logs Collected:</strong> {trackedCase.stages["Investigation"].evidence_collected_count} items</div>
                  <div><strong>Witness Statements:</strong> {trackedCase.stages["Investigation"].witnesses_recorded_count} logs</div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Progress Synopsis:</strong> Digital logs tracked. Forensics queued.
                  </div>
                </div>
              )}

              {activeStageTab === "Arrest" && (
                <div style={styles.detailsGrid}>
                  <div><strong>Accused Dossier Name:</strong> {trackedCase.stages["Arrest"].accused_name}</div>
                  <div><strong>Arresting Team Lead:</strong> {trackedCase.stages["Arrest"].arresting_officer}</div>
                  <div><strong>Apprehension Date:</strong> <span className="mono">{trackedCase.stages["Arrest"].date_of_arrest}</span></div>
                  <div><strong>Framed Charges:</strong> {trackedCase.stages["Arrest"].charges_framed}</div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Bail Status:</strong> {trackedCase.stages["Arrest"].bail_status}
                  </div>
                </div>
              )}

              {activeStageTab === "Chargesheet" && (
                <div style={styles.detailsGrid}>
                  <div><strong>Filing Court:</strong> {trackedCase.stages["Chargesheet"].court_name}</div>
                  <div><strong>Judicial Date Filed:</strong> <span className="mono">{trackedCase.stages["Chargesheet"].filed_date}</span></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Final Chargesheet Sections:</strong> {trackedCase.stages["Chargesheet"].ipc_sections?.join(", ")}
                  </div>
                </div>
              )}

              {activeStageTab === "Court Hearing" && (
                <div style={styles.detailsGrid}>
                  <div><strong>Case Number (CC):</strong> <span className="mono">{trackedCase.stages["Court Hearing"].case_number}</span></div>
                  <div><strong>Court Bench:</strong> {trackedCase.stages["Court Hearing"].court}</div>
                  <div><strong>Presiding Judge:</strong> {trackedCase.stages["Court Hearing"].judge}</div>
                  <div><strong>Hearings Held:</strong> {trackedCase.stages["Court Hearing"].hearings_held} sessions</div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Next Bench Session:</strong> {trackedCase.stages["Court Hearing"].next_date}
                  </div>
                </div>
              )}

              {activeStageTab === "Verdict" && (
                <div style={styles.detailsGrid}>
                  <div><strong>Result Verdict:</strong> {trackedCase.stages["Verdict"].result}</div>
                  <div><strong>Date of Judgment:</strong> {trackedCase.stages["Verdict"].date_of_judgment}</div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Sentence Pronounced:</strong> {trackedCase.stages["Verdict"].sentence}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CASE FILES SECTION (RENDERED ONLY FOR CLOSED/ARRESTED CASES) */}
          {isCaseClosedOrArrested && (
            <div style={styles.docsSection}>
              <div style={{ borderBottom: '1px solid #1e2d3d', paddingBottom: '6px', marginBottom: '12px' }}>
                <span style={styles.sectionLabel} style={{ ...styles.sectionLabel, color: '#00e5ff', fontSize: '11px', fontWeight: 'bold' }}>
                  CASE FILES & SECURED CUSTODY ARCHIVES
                </span>
              </div>

              {/* 1. EVIDENCE ATTACHED LIST */}
              <div style={{ marginBottom: '16px' }}>
                <span style={styles.sectionLabel}>EVIDENCE ATTACHED (SECURE DIGITAL CHAIN)</span>
                {caseEvidence.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#4f616d', fontFamily: 'monospace', padding: '6px' }}>
                    NO EVIDENCE LOGS RECORDED FOR THIS COMPLAINT COMPONENT.
                  </div>
                ) : (
                  <div className="cyber-table-container">
                    <table className="cyber-table" style={{ fontSize: '11px' }}>
                      <thead>
                        <tr>
                          <th>EVIDENCE ID</th>
                          <th>TYPE</th>
                          <th>ANALYSIS STATUS</th>
                          <th>SEAL INTEGRITY</th>
                          <th style={{ textAlign: 'right' }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseEvidence.map(ev => (
                          <tr key={ev.EvidenceID}>
                            <td className="mono" style={{ color: '#00e5ff' }}>{ev.EvidenceID}</td>
                            <td>{ev.EvidenceType}</td>
                            <td>{ev.AnalysisStatus}</td>
                            <td style={{ color: getIntegrityColor(ev.IntegrityStatus), fontWeight: 'bold' }}>{ev.IntegrityStatus}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                className="cyber-btn"
                                onClick={() => setViewEvidenceDetail(ev)}
                                style={{ padding: '2px 6px', fontSize: '9px' }}
                              >
                                VIEW
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 2. DOCUMENTS DOWNLOADS */}
              <div>
                <span style={styles.sectionLabel}>DOCUMENTATION ARCHIVES</span>
                <div style={styles.docsGrid}>
                  {[
                    { label: "FIR Copy", doc: "FIR Copy" },
                    { label: "Arrest Memo", doc: "Arrest Memo" },
                    { label: "Chargesheet", doc: "Chargesheet" },
                    { label: "Forensic Report", doc: "Forensic Report" }
                  ].map((item, idx) => (
                    <div key={idx} style={styles.docCard}>
                      <FileText size={16} color="#00e5ff" />
                      <div style={styles.docMeta}>
                        <span style={styles.docName}>{item.label}</span>
                        <span style={styles.docFormat}>Format: SECURE TEXT</span>
                      </div>
                      <button 
                        className="cyber-btn-outline" 
                        onClick={() => openDocumentContent(item.doc)}
                        style={{ padding: '3px 10px', fontSize: '9px' }}
                      >
                        VIEW
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RECENT CASES COMPLAINTS */}
      <div className="chart-card" style={styles.recentCard}>
        <div className="chart-header">
          <span className="chart-title">RECENT CRIME COMPLAINTS INDEX</span>
          <button className="cyber-btn-outline" onClick={fetchRecentCases} style={{ padding: '4px 10px', fontSize: '10px' }}>
            <RefreshCw size={10} style={{ marginRight: '4px' }} />
            <span>REFRESH</span>
          </button>
        </div>

        {recentCases.length === 0 ? (
          <div style={styles.emptyState}>NO RECORDS FOUND</div>
        ) : (
          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>CASE ID</th>
                  <th>CRIME TYPE</th>
                  <th>DISTRICT</th>
                  <th>DATE</th>
                  <th>CURRENT STATUS</th>
                  <th style={{ textAlign: 'right' }}>TRACK LIFE</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map(c => (
                  <tr key={c.id}>
                    <td className="mono" style={{ color: '#00e5ff', fontWeight: 'bold' }}>{c.id}</td>
                    <td>{c.crime_type}</td>
                    <td>{c.victim_district}</td>
                    <td className="mono">{c.date_of_incident}</td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: c.status === "Closed" ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 170, 0, 0.08)',
                          color: c.status === "Closed" ? '#00ff88' : '#ffaa00'
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="cyber-btn" 
                        onClick={() => handleTrackClick(c.id)}
                        style={{ padding: '4px 10px', fontSize: '9px' }}
                      >
                        <span>TRACK</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DOCUMENT VIEWER TEXT MODAL */}
      {viewDoc && (
        <div style={styles.modalOverlay}>
          <div className="chart-card" style={styles.modalContainer}>
            <div className="chart-header" style={{ borderBottom: '1px solid #1e2d3d', paddingBottom: '10px', marginBottom: '14px' }}>
              <span className="chart-title" style={{ color: '#00e5ff' }}>{viewDoc.name.toUpperCase()} — {trackedCase.id}</span>
              <button className="cyber-btn-outline" onClick={() => setViewDoc(null)} style={{ padding: '3px 8px', fontSize: '9px' }}>
                CLOSE
              </button>
            </div>
            <div style={styles.modalDocBody}>
              <pre style={styles.docTextPre}>{viewDoc.content}</pre>
            </div>
          </div>
        </div>
      )}

      {/* EVIDENCE DETAIL MODAL */}
      {viewEvidenceDetail && (
        <div style={styles.modalOverlay}>
          <div className="chart-card" style={styles.modalContainer}>
            <div className="chart-header" style={{ borderBottom: '1px solid #1e2d3d', paddingBottom: '10px', marginBottom: '14px' }}>
              <span className="chart-title" style={{ color: '#00e5ff' }}>EVIDENCE CHAIN OF CUSTODY — {viewEvidenceDetail.EvidenceID}</span>
              <button className="cyber-btn-outline" onClick={() => setViewEvidenceDetail(null)} style={{ padding: '3px 8px', fontSize: '9px' }}>
                CLOSE
              </button>
            </div>
            <div style={styles.detailsGrid}>
              <div><strong>Evidence ID:</strong> <span className="mono" style={{ color: '#00e5ff' }}>{viewEvidenceDetail.EvidenceID}</span></div>
              <div><strong>Associated Case:</strong> <span className="mono">{viewEvidenceDetail.CaseID}</span></div>
              <div><strong>Category Type:</strong> {viewEvidenceDetail.EvidenceType}</div>
              <div><strong>Collected By:</strong> {viewEvidenceDetail.CollectedBy}</div>
              <div><strong>Collection Date:</strong> <span className="mono">{viewEvidenceDetail.CollectionDate}</span></div>
              <div><strong>Storage Zone Location:</strong> {viewEvidenceDetail.StorageLocation}</div>
              <div><strong>Analysis Queue:</strong> {viewEvidenceDetail.AnalysisStatus}</div>
              <div><strong>Integrity status:</strong> <span style={{ color: getIntegrityColor(viewEvidenceDetail.IntegrityStatus), fontWeight: 'bold' }}>{viewEvidenceDetail.IntegrityStatus}</span></div>
              <div style={{ gridColumn: 'span 2', fontSize: '13px', borderTop: '1px solid #1e2d3d', paddingTop: '10px', marginTop: '10px', color: viewEvidenceDetail.CourtAdmissible ? '#00ff88' : '#ff2d55', fontWeight: 'bold' }}>
                COURT ADMISSIBILITY: {viewEvidenceDetail.CourtAdmissible ? "VERIFIED ADMISSIBLE" : "INADMISSIBLE"}
              </div>
            </div>
          </div>
        </div>
      )}
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
  searchCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    padding: '16px 20px',
  },
  searchForm: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#8a9ba8',
    letterSpacing: '1px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    height: '38px',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    padding: '0 10px',
    borderRadius: '4px',
  },
  searchInput: {
    flexGrow: 1,
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
  },
  timelineCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    borderTop: '2px solid #00e5ff',
    padding: '20px',
  },
  metaStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    padding: '12px 20px',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  metaLabel: {
    display: 'block',
    fontSize: '9px',
    color: '#4f616d',
    fontFamily: 'monospace',
  },
  metaValue: {
    fontSize: '13px',
    color: '#fff',
    fontWeight: 'bold',
  },
  stepperContainer: {
    position: 'relative',
    margin: '30px 0',
    padding: '0 20px',
  },
  stepperLine: {
    position: 'absolute',
    top: '20px',
    left: '8%',
    right: '8%',
    height: '2px',
    background: '#1e2d3d',
    zIndex: 1,
  },
  stepperGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    position: 'relative',
    zIndex: 2,
  },
  stepNode: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  nodeCompleted: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#00e5ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  nodeCurrentPulse: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
    border: '2px solid #ffaa00',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    animation: 'pulse 1.5s infinite',
  },
  nodeCurrentInner: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#ffaa00',
  },
  nodePending: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#070a12',
    border: '2px solid #1e2d3d',
    marginBottom: '8px',
  },
  nodeName: {
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  nodeDate: {
    fontSize: '9px',
    color: '#8a9ba8',
    marginTop: '2px',
    fontFamily: 'monospace',
  },
  detailContainer: {
    background: '#070a12',
    border: '1px solid #1e2d3d',
    marginTop: '20px',
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e2d3d',
    padding: '10px 16px',
  },
  detailTitle: {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: '#8a9ba8',
    letterSpacing: '1px',
  },
  detailBody: {
    padding: '16px 20px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    fontSize: '12px',
    color: '#fff',
  },
  docsSection: {
    marginTop: '20px',
  },
  sectionLabel: {
    display: 'block',
    fontFamily: 'monospace',
    fontSize: '9px',
    color: '#4f616d',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  docsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  docCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    padding: '10px 14px',
  },
  docMeta: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  docName: {
    fontSize: '12px',
    color: '#fff',
    fontWeight: 'bold',
  },
  docFormat: {
    fontSize: '9px',
    color: '#4f616d',
  },
  recentCard: {
    background: '#0d1117',
    border: '1px solid #1e2d3d',
  },
  emptyState: {
    textAlign: 'center',
    color: '#4f616d',
    fontFamily: 'monospace',
    fontSize: '11px',
    padding: '40px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 4, 9, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalContainer: {
    width: '560px',
    background: '#0d1117',
    border: '1px solid #1e2d3d',
    borderTop: '2px solid #00e5ff',
    padding: '24px',
  },
  modalDocBody: {
    maxHeight: '400px',
    overflowY: 'auto',
    background: '#070a12',
    border: '1px solid #1e2d3d',
    padding: '16px',
  },
  docTextPre: {
    margin: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: '#00ff88',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.5',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#0d1117',
    border: '1px solid #00ff88',
    borderLeft: '4px solid #00ff88',
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

export default CaseTracker;
