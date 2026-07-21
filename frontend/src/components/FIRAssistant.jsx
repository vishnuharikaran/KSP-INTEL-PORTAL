import React, { useState, useEffect } from 'react';
import { Copy, Printer, Check, ShieldAlert, Save, Database, RefreshCw } from 'lucide-react';
import printExport from '../utils/printExport';

const DISTRICTS = [
  "Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban",
  "Bidar","Chamarajanagar","Chikkaballapur","Chikkamagaluru","Chitradurga",
  "Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan",
  "Haveri","Kalaburagi","Kodagu","Kolar","Koppal",
  "Mandya","Mysuru","Raichur","Ramanagara","Shivamogga",
  "Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir","Vijayanagara"
];

const CRIME_TYPES = [
  "Murder","Robbery","Theft","Assault","Cybercrime",
  "Fraud","Kidnapping","Drug Trafficking","Domestic Violence","Vehicle Theft"
];

const POLICE_STATIONS = [
  "Cyber Crime PS Division 1","Town Police Station","Rural Police Station",
  "Central Crime PS","District Headquarters PS","Traffic PS East"
];

function FIRAssistant() {
  const [complainantName, setComplainantName] = useState('');
  const [incidentDatetime, setIncidentDatetime] = useState('');
  const [district, setDistrict]               = useState('Bengaluru Urban');
  const [policeStation, setPoliceStation]     = useState(POLICE_STATIONS[0]);
  const [crimeType, setCrimeType]             = useState('Cybercrime');
  const [description, setDescription]         = useState('');
  const [accusedDetails, setAccusedDetails]   = useState('');
  const [investigatingOfficer, setInvestigatingOfficer] = useState('');
  const [officerDesignation, setOfficerDesignation]     = useState('');
  const [evidence, setEvidence]               = useState({
    CCTV: false, Photos: false, Witnesses: false, Documents: false, Digital: false
  });

  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [firData, setFirData]         = useState(null);
  const [saved, setSaved]             = useState(false);  // track if this FIR was saved
  const [copied, setCopied]           = useState(false);
  const [toast, setToast]             = useState('');
  const [toastType, setToastType]     = useState('success'); // 'success' | 'error'

  // Filed FIRs list
  const [filedFIRs, setFiledFIRs]     = useState([]);
  const [showDB, setShowDB]           = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  const toggleEvidence = (key) =>
    setEvidence(prev => ({ ...prev, [key]: !prev[key] }));

  /* ── Generate FIR ────────────────────────────────────────── */
  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFirData(null);
    setSaved(false);

    const evidenceList = Object.keys(evidence).filter(k => evidence[k]);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/fir/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complainant_name:       complainantName,
          incident_datetime:      incidentDatetime,
          district,
          police_station:         policeStation,
          crime_type:             crimeType,
          description,
          accused_details:        accusedDetails,
          evidence_available:     evidenceList,
          investigating_officer:  investigatingOfficer || null,
          officer_designation:    officerDesignation || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate FIR draft. Check backend connection.');
      const data = await res.json();
      setFirData(data);
      showToast(`FIR Draft ${data.fir_number} generated successfully.`);
    } catch (err) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Save FIR to database ────────────────────────────────── */
  const handleSave = async () => {
    if (!firData || saved) return;
    setSaving(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/fir/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fir_number:            firData.fir_number,
          investigating_officer: investigatingOfficer || null,
          officer_designation:   officerDesignation || null,
        }),
      });
      // Parse response regardless of status to show real error message
      let data;
      try { data = await res.json(); } catch { data = {}; }

      if (res.ok && data.success) {
        setSaved(true);
        showToast(`FIR ${firData.fir_number} filed to database.`);
        fetchFiledFIRs();
      } else {
        const errMsg = data.detail || data.message || `HTTP ${res.status}: Save failed.`;
        showToast(errMsg, 'error');
      }
    } catch (e) {
      showToast('Network error — is the backend server running?', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Fetch filed FIRs list ───────────────────────────────── */
  const fetchFiledFIRs = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/fir/list');
      const data = await res.json();
      setFiledFIRs(data);
    } catch {
      /* silent */
    }
  };

  useEffect(() => { fetchFiledFIRs(); }, []);

  /* ── Copy to clipboard ───────────────────────────────────── */
  const handleCopy = () => {
    if (!firData) return;
    navigator.clipboard.writeText(firData.fir_text);
    setCopied(true);
    showToast('FIR draft copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Print — opens a dedicated clean print window ───────── */
  const handlePrint = () => {
    if (!firData) return;

    let dateVal = '—';
    let timeVal = '—';
    if (incidentDatetime) {
      if (incidentDatetime.includes('T')) {
        const [d, t] = incidentDatetime.split('T');
        dateVal = d;
        timeVal = t;
      } else {
        dateVal = incidentDatetime;
      }
    }

    const evidenceList = Object.keys(evidence).filter(k => evidence[k]);

    const generatedFIR = {
      fir_number: firData.fir_number,
      evidence: evidenceList,
      ipc_sections: firData.ipc_sections,
      date: dateVal,
      time: timeVal,
      station: policeStation,
      district: district,
      complainant: complainantName,
      crime_type: crimeType,
      accused: accusedDetails || 'Unknown',
      description: description
    };

    const evidenceListStr = Array.isArray(
      generatedFIR.evidence
    )
      ? generatedFIR.evidence.join(', ')
      : generatedFIR.evidence || '—';

    const ipcTags = (generatedFIR.ipc_sections || [])
      .map(s => `
        <span style="
          display:inline-block;
          padding:3px 10px;
          margin:2px;
          background:#eff6ff;
          border:1px solid #bfdbfe;
          border-radius:4px;
          font-size:11px;
          font-family:monospace;
          color:#0077cc;
          font-weight:600
        ">${s}</span>
      `).join('');

    printExport({
      title: 'FIRST INFORMATION REPORT',
      subtitle: `FIR No: ${generatedFIR.fir_number}`,
      filename: `FIR_${generatedFIR.fir_number?.replace(/\//g,'_')}`,
      content: `
        <div class="fir-doc">
          <div class="fir-header">
            <div class="fir-title">
              FIRST INFORMATION REPORT
            </div>
            <div class="fir-subtitle">
              Under Section 173 BNSS / 
              Section 154 Cr.P.C.
            </div>
          </div>

          <div class="fir-row">
            <span class="fir-field-label">
              FIR Number:
            </span>
            <span class="fir-field-value">
              ${generatedFIR.fir_number || '—'}
            </span>
          </div>
          <div class="fir-row">
            <span class="fir-field-label">
              Date & Time:
            </span>
            <span class="fir-field-value">
              ${generatedFIR.date || '—'} 
              at ${generatedFIR.time || '—'}
            </span>
          </div>
          <div class="fir-row">
            <span class="fir-field-label">
              Police Station:
            </span>
            <span class="fir-field-value">
              ${generatedFIR.station || '—'}
            </span>
          </div>
          <div class="fir-row">
            <span class="fir-field-label">
              District:
            </span>
            <span class="fir-field-value">
              ${generatedFIR.district || '—'}
            </span>
          </div>
          <div class="fir-row">
            <span class="fir-field-label">
              Complainant Name:
            </span>
            <span class="fir-field-value">
              ${generatedFIR.complainant || '—'}
            </span>
          </div>
          <div class="fir-row">
            <span class="fir-field-label">
              Crime Type:
            </span>
            <span class="fir-field-value">
              ${generatedFIR.crime_type || '—'}
            </span>
          </div>
          <div class="fir-row">
            <span class="fir-field-label">
              Accused Details:
            </span>
            <span class="fir-field-value">
              ${generatedFIR.accused || 'Unknown'}
            </span>
          </div>
          <div class="fir-row">
            <span class="fir-field-label">
              Evidence Available:
            </span>
            <span class="fir-field-value">
              ${evidenceListStr}
            </span>
          </div>
          <div class="fir-row" style="
            align-items:flex-start;
            border-bottom:none
          ">
            <span class="fir-field-label">
              Incident Description:
            </span>
            <span class="fir-field-value" style="
              line-height:1.6
            ">
              ${generatedFIR.description || '—'}
            </span>
          </div>

          <div class="fir-ipc">
            <div class="fir-ipc-title">
              Applicable IPC / BNS Sections
            </div>
            <div>${ipcTags}</div>
          </div>

          <div class="fir-sign-row">
            <div class="fir-sign-box">
              Complainant Signature
            </div>
            <div class="fir-sign-box">
              Investigating Officer
            </div>
            <div class="fir-sign-box">
              Station House Officer
            </div>
          </div>
        </div>
      `
    });
  };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div style={S.container}>

      {/* Toast */}
      {toast && (
        <div style={{ ...S.toast, borderColor: toastType === 'error' ? '#ff3b30' : 'var(--green)', borderLeft: `4px solid ${toastType === 'error' ? '#ff3b30' : 'var(--green)'}` }}>
          <Check size={14} />
          <span>{toast}</span>
        </div>
      )}

      <div style={S.grid}>

        {/* ── LEFT — INPUT FORM ─────────────────────────────── */}
        <div className="chart-card" style={S.panel}>
          <div className="chart-header">
            <span className="chart-title">FIR INPUT DETAILS</span>
          </div>

          <form onSubmit={handleGenerate} style={S.form}>
            <div style={S.inputGroup}>
              <label style={S.label}>COMPLAINANT NAME</label>
              <input className="cyber-input" type="text" value={complainantName}
                onChange={e => setComplainantName(e.target.value)}
                placeholder="Full legal name" required />
            </div>

            <div style={S.row}>
              <div style={S.inputGroup}>
                <label style={S.label}>DATE & TIME OF INCIDENT</label>
                <input className="cyber-input" type="datetime-local"
                  value={incidentDatetime}
                  onChange={e => setIncidentDatetime(e.target.value)} required />
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>CRIME TYPE</label>
                <select className="cyber-input" style={S.select}
                  value={crimeType} onChange={e => setCrimeType(e.target.value)}>
                  {CRIME_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={S.row}>
              <div style={S.inputGroup}>
                <label style={S.label}>DISTRICT</label>
                <select className="cyber-input" style={S.select}
                  value={district} onChange={e => setDistrict(e.target.value)}>
                  {DISTRICTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>POLICE STATION</label>
                <select className="cyber-input" style={S.select}
                  value={policeStation} onChange={e => setPoliceStation(e.target.value)}>
                  {POLICE_STATIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={S.inputGroup}>
              <label style={S.label}>ACCUSED DETAILS (IF KNOWN)</label>
              <input className="cyber-input" type="text" value={accusedDetails}
                onChange={e => setAccusedDetails(e.target.value)}
                placeholder="Name / Phone / Vehicle / Bank Account" />
            </div>

            <div style={S.row}>
              <div style={S.inputGroup}>
                <label style={S.label}>INVESTIGATING OFFICER NAME</label>
                <input className="cyber-input" type="text" value={investigatingOfficer}
                  onChange={e => setInvestigatingOfficer(e.target.value)}
                  placeholder="e.g. Inspector Rajesh Kumar" />
              </div>
              <div style={S.inputGroup}>
                <label style={S.label}>OFFICER DESIGNATION</label>
                <input className="cyber-input" type="text" value={officerDesignation}
                  onChange={e => setOfficerDesignation(e.target.value)}
                  placeholder="e.g. Inspector / SI / DSP" />
              </div>
            </div>

            <div style={S.inputGroup}>
              <label style={S.label}>INCIDENT DESCRIPTION</label>
              <textarea className="cyber-input" style={{ height: '90px', resize: 'vertical' }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide a detailed narration of the incident..."
                required />
            </div>

            <div style={S.inputGroup}>
              <label style={S.label}>EVIDENCE AVAILABLE</label>
              <div style={S.cbGrid}>
                {Object.keys(evidence).map(key => (
                  <label key={key} style={S.cbLabel}>
                    <input type="checkbox" checked={evidence[key]}
                      onChange={() => toggleEvidence(key)}
                      style={{ marginRight: '6px', accentColor: 'var(--cyan)' }} />
                    {key}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="cyber-btn"
              style={{ width: '100%', marginTop: '4px' }}>
              {loading ? 'ANALYZING & DRAFTING...' : 'GENERATE FIR DRAFT'}
            </button>

            {error && (
              <div style={S.errorBox}>
                <ShieldAlert size={14} />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* ── RIGHT — PREVIEW PANEL ─────────────────────────── */}
        <div className="chart-card" style={{ ...S.panel, borderTop: '2px solid var(--cyan)' }}>
          <div className="chart-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <span className="chart-title">DRAFTED FIR PREVIEW</span>
            {firData && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="cyber-btn-outline" style={S.iconBtn} onClick={handleCopy}>
                  <Copy size={12} />
                  <span>{copied ? 'COPIED!' : 'COPY'}</span>
                </button>
                <button className="cyber-btn-outline" style={S.iconBtn} onClick={handlePrint}>
                  <Printer size={12} />
                  <span>PRINT</span>
                </button>
                <button
                  className="cyber-btn"
                  style={{
                    ...S.iconBtn,
                    background: saved ? 'var(--green)' : 'var(--cyan)',
                    color: '#070a12',
                    opacity: saving ? 0.7 : 1
                  }}
                  onClick={handleSave}
                  disabled={saved || saving}
                >
                  <Save size={12} />
                  <span>{saving ? 'SAVING...' : saved ? 'SAVED TO DB' : 'SAVE TO CASE'}</span>
                </button>
              </div>
            )}
          </div>

          <div style={S.preview}>
            {loading ? (
              <div style={S.emptyState}>
                <div style={S.spinner} />
                <div style={{ color: 'var(--cyan)', fontFamily: 'monospace', fontSize: '11px', marginTop: '12px' }}>
                  DRAFTING FIR...
                </div>
              </div>
            ) : firData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* FIR Number + status */}
                <div style={S.firMeta}>
                  <div>
                    <span style={S.metaLabel}>FIR NO.</span>
                    <span style={S.metaVal}>{firData.fir_number}</span>
                  </div>
                  <div>
                    <span style={S.metaLabel}>GENERATED</span>
                    <span style={S.metaVal}>{firData.generated_at}</span>
                  </div>
                  <span style={{
                    ...S.statusBadge,
                    background: saved ? 'var(--green-bg)' : 'var(--amber-bg)',
                    color: saved ? 'var(--green)' : 'var(--amber)',
                    border: `1px solid ${saved ? 'var(--green)' : 'var(--amber)'}`,
                  }}>
                    {saved ? '● FILED' : '● DRAFT'}
                  </span>
                </div>

                {/* IPC Section Tags */}
                <div style={S.tagStrip}>
                  <span style={S.tagLabel}>SECTIONS APPLIED:</span>
                  {firData.ipc_sections.map(s => (
                    <span key={s} style={S.tag}>{s}</span>
                  ))}
                </div>

                {/* FIR Body */}
                <pre style={S.firText}>{firData.fir_text}</pre>
              </div>
            ) : (
              <div style={S.emptyState}>
                <span style={{ color: '#4f616d', fontFamily: 'monospace', fontSize: '11px', textAlign: 'center' }}>
                  FILL INCIDENT DETAILS AND PRESS GENERATE FIR DRAFT.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FILED FIRs DATABASE TABLE ─────────────────────────── */}
      <div className="chart-card" style={S.panel}>
        <div className="chart-header">
          <span className="chart-title">FILED FIR DATABASE</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8a9ba8' }}>
              {filedFIRs.length} RECORD{filedFIRs.length !== 1 ? 'S' : ''}
            </span>
            <button className="cyber-btn-outline" style={S.iconBtn} onClick={fetchFiledFIRs}>
              <RefreshCw size={11} />
              <span>REFRESH</span>
            </button>
            <button className="cyber-btn-outline" style={S.iconBtn} onClick={() => setShowDB(!showDB)}>
              <Database size={11} />
              <span>{showDB ? 'COLLAPSE' : 'VIEW ALL'}</span>
            </button>
          </div>
        </div>

        {showDB && (
          filedFIRs.length === 0 ? (
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4f616d', padding: '12px 0' }}>
              NO FIR RECORDS IN DATABASE YET. GENERATE AND SAVE A DRAFT ABOVE.
            </div>
          ) : (
            <div className="cyber-table-container" style={{ overflowX: 'auto' }}>
              <table className="cyber-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>FIR NO.</th>
                    <th>COMPLAINANT</th>
                    <th>CRIME TYPE</th>
                    <th>DISTRICT</th>
                    <th>INVESTIGATING OFFICER</th>
                    <th>GENERATED AT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filedFIRs.map((fir) => (
                    <tr key={fir.fir_number}>
                      <td className="mono" style={{ color: 'var(--cyan)' }}>{fir.fir_number}</td>
                      <td>{fir.complainant_name}</td>
                      <td>{fir.crime_type}</td>
                      <td>{fir.district}</td>
                      <td style={{ fontSize: '11px' }}>
                        {fir.investigating_officer && fir.investigating_officer !== '______________________'
                          ? fir.investigating_officer
                          : <span style={{ color: '#4f616d' }}>Not assigned</span>}
                      </td>
                      <td className="mono" style={{ fontSize: '10px' }}>{fir.generated_at}</td>
                      <td>
                        <span style={{
                          fontSize: '9px',
                          fontFamily: 'monospace',
                          padding: '2px 8px',
                          background: fir.status === 'Filed' ? 'var(--green-bg)' : 'var(--amber-bg)',
                          color: fir.status === 'Filed' ? 'var(--green)' : 'var(--amber)',
                          border: `1px solid ${fir.status === 'Filed' ? 'var(--green)40' : 'var(--amber)40'}`,
                        }}>
                          {fir.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

    </div>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const S = {
  container: { display: 'flex', flexDirection: 'column', width: '100%', gap: '20px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' },
  panel: { background: 'var(--bg-panel)', border: '1px solid var(--border)' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  row: { display: 'flex', gap: '14px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
  label: { fontFamily: 'monospace', fontSize: '10px', color: '#8a9ba8', letterSpacing: '0.8px' },
  select: { width: '100%', height: '39px', background: '#070a12', border: '1px solid var(--border)', color: '#fff', padding: '0 10px' },
  cbGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#070a12', padding: '12px', border: '1px solid var(--border)' },
  cbLabel: { fontSize: '11px', color: '#ffffff', fontFamily: 'monospace', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  preview: { flexGrow: 1, background: '#070a12', border: '1px solid var(--border)', minHeight: '420px', overflowY: 'auto', padding: '20px', position: 'relative' },
  emptyState: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  spinner: { width: '28px', height: '28px', border: '2px solid var(--border)', borderTop: '2px solid var(--cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  firMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '10px 14px' },
  metaLabel: { fontFamily: 'monospace', fontSize: '9px', color: '#4f616d', display: 'block', letterSpacing: '0.5px' },
  metaVal: { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', fontWeight: 'bold' },
  statusBadge: { fontSize: '9px', fontFamily: 'monospace', padding: '3px 10px', fontWeight: 'bold' },
  tagStrip: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '12px' },
  tagLabel: { fontSize: '9px', color: '#8a9ba8', fontFamily: 'monospace' },
  tag: { fontSize: '10px', color: 'var(--cyan)', border: '1px solid var(--cyan)33', padding: '2px 8px', fontFamily: 'monospace', background: 'rgba(0,229,255,0.05)' },
  firText: { margin: 0, padding: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', lineHeight: '1.7', background: 'transparent', border: 'none' },
  iconBtn: { padding: '5px 12px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px' },
  errorBox: { background: 'rgba(255,59,48,0.1)', border: '1px solid #ff3b30', color: '#ff3b30', padding: '10px 14px', fontSize: '11px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px' },
  toast: { position: 'fixed', bottom: '24px', right: '24px', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--green)', color: '#ffffff', padding: '12px 20px', fontFamily: 'sans-serif', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)', zIndex: 9999 },
};

export default FIRAssistant;
