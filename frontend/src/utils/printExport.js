const printExport = ({
  title,
  subtitle,
  content,
  filename
}) => {
  const timestamp = new Date().toLocaleString(
    'en-IN', {
      dateStyle: 'long',
      timeStyle: 'short'
    }
  );

  const printWindow = window.open('', '_blank');
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>${filename || title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 13px;
          color: #0a0f1e;
          background: #ffffff;
          padding: 0;
        }

        /* ── PAGE SETUP ── */
        @page {
          size: A4;
          margin: 18mm 16mm 18mm 16mm;
        }

        /* ── HEADER ── */
        .print-header {
          border-bottom: 3px solid #0077cc;
          padding-bottom: 14px;
          margin-bottom: 20px;
        }
        .print-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .print-org {
          font-size: 11px;
          color: #64748b;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .print-title {
          font-size: 20px;
          font-weight: 700;
          color: #0a0f1e;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .print-subtitle {
          font-size: 12px;
          color: #334155;
        }
        .print-badge {
          padding: 6px 14px;
          border: 1px solid #dc2626;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #dc2626;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-family: monospace;
          text-align: center;
        }
        .print-badge-sub {
          font-size: 9px;
          color: #64748b;
          letter-spacing: 1px;
          margin-top: 3px;
          text-align: center;
        }
        .print-meta {
          display: flex;
          gap: 24px;
          margin-top: 10px;
          font-size: 11px;
          color: #64748b;
          font-family: monospace;
        }
        .print-meta span strong {
          color: #0a0f1e;
        }

        /* ── SECTION HEADING ── */
        .section-heading {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #0077cc;
          border-left: 3px solid #0077cc;
          padding-left: 10px;
          margin: 20px 0 10px;
        }

        /* ── STAT CARDS ROW ── */
        .stat-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .stat-box {
          border: 1px solid #d1dce8;
          border-radius: 6px;
          padding: 12px;
          background: #f8fafc;
        }
        .stat-box-label {
          font-size: 9px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 4px;
          font-family: monospace;
        }
        .stat-box-value {
          font-size: 22px;
          font-weight: 700;
          color: #0a0f1e;
          font-family: monospace;
        }
        .stat-box-trend {
          font-size: 10px;
          margin-top: 3px;
          font-family: monospace;
        }

        /* ── TABLES ── */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
          font-size: 12px;
        }
        thead {
          background: #0077cc;
          color: white;
        }
        thead th {
          padding: 9px 12px;
          text-align: left;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 600;
        }
        tbody tr {
          border-bottom: 1px solid #e2e8f0;
        }
        tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        tbody td {
          padding: 9px 12px;
          color: #0a0f1e;
        }
        tbody td:first-child {
          font-family: monospace;
          color: #0077cc;
          font-weight: 600;
        }

        /* ── STATUS BADGES IN TABLE ── */
        .status-high {
          color: #dc2626;
          font-weight: 700;
          font-family: monospace;
          font-size: 11px;
        }
        .status-med {
          color: #d97706;
          font-weight: 700;
          font-family: monospace;
          font-size: 11px;
        }
        .status-low {
          color: #059669;
          font-weight: 700;
          font-family: monospace;
          font-size: 11px;
        }

        /* ── ALERT CARDS ── */
        .alert-card {
          border-left: 3px solid #dc2626;
          background: #fef2f2;
          padding: 10px 14px;
          border-radius: 0 6px 6px 0;
          margin-bottom: 8px;
        }
        .alert-card-title {
          font-size: 11px;
          font-weight: 700;
          color: #dc2626;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 3px;
          font-family: monospace;
        }
        .alert-card-body {
          font-size: 12px;
          color: #1e293b;
        }
        .alert-card-amber {
          border-left-color: #d97706;
          background: #fffbeb;
        }
        .alert-card-amber .alert-card-title {
          color: #d97706;
        }
        .alert-card-info {
          border-left-color: #0077cc;
          background: #eff6ff;
        }
        .alert-card-info .alert-card-title {
          color: #0077cc;
        }

        /* ── RECOMMENDATION ITEMS ── */
        .rec-item {
          display: flex;
          gap: 12px;
          padding: 9px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          margin-bottom: 6px;
          align-items: flex-start;
        }
        .rec-priority {
          font-size: 10px;
          font-family: monospace;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .rec-high {
          background: #fee2e2;
          color: #dc2626;
        }
        .rec-med {
          background: #fef3c7;
          color: #d97706;
        }
        .rec-low {
          background: #d1fae5;
          color: #059669;
        }
        .rec-text {
          font-size: 12px;
          color: #1e293b;
          padding-top: 1px;
        }

        /* ── TIMELINE (Case Tracker) ── */
        .timeline {
          position: relative;
          padding-left: 28px;
          margin-bottom: 18px;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 10px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #d1dce8;
        }
        .timeline-item {
          position: relative;
          margin-bottom: 16px;
        }
        .timeline-dot {
          position: absolute;
          left: -23px;
          top: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #0077cc;
          border: 2px solid white;
          box-shadow: 0 0 0 2px #0077cc;
        }
        .timeline-dot-pending {
          background: white;
          box-shadow: 0 0 0 2px #d1dce8;
        }
        .timeline-stage {
          font-size: 11px;
          font-weight: 700;
          color: #0077cc;
          font-family: monospace;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .timeline-date {
          font-size: 11px;
          color: #64748b;
          font-family: monospace;
          margin-top: 2px;
        }
        .timeline-detail {
          font-size: 12px;
          color: #334155;
          margin-top: 3px;
        }

        /* ── OFFENDER DOSSIER ── */
        .dossier-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 14px;
        }
        .dossier-field {
          padding: 8px 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }
        .dossier-label {
          font-size: 9px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #64748b;
          font-family: monospace;
          margin-bottom: 3px;
        }
        .dossier-value {
          font-size: 13px;
          font-weight: 600;
          color: #0a0f1e;
          font-family: monospace;
        }

        /* ── FIR DOCUMENT ── */
        .fir-doc {
          border: 2px solid #0a0f1e;
          padding: 24px;
          font-family: 'Courier New', monospace;
        }
        .fir-header {
          text-align: center;
          border-bottom: 2px solid #0a0f1e;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .fir-title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 4px;
        }
        .fir-subtitle {
          font-size: 12px;
          color: #334155;
        }
        .fir-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 12px;
          border-bottom: 1px dotted #d1dce8;
          padding-bottom: 6px;
        }
        .fir-field-label {
          min-width: 180px;
          font-weight: 600;
          color: #334155;
        }
        .fir-field-value {
          color: #0a0f1e;
        }
        .fir-ipc {
          margin-top: 16px;
          padding: 12px;
          background: #f0f7ff;
          border: 1px solid #bfdbfe;
          border-radius: 4px;
        }
        .fir-ipc-title {
          font-size: 11px;
          font-weight: 700;
          color: #0077cc;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .fir-sign-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-top: 40px;
        }
        .fir-sign-box {
          text-align: center;
          border-top: 1px solid #0a0f1e;
          padding-top: 6px;
          font-size: 11px;
          color: #334155;
        }

        /* ── FOOTER ── */
        .print-footer {
          margin-top: 28px;
          padding-top: 12px;
          border-top: 1px solid #d1dce8;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
          font-family: monospace;
        }

        /* ── PAGE BREAK ── */
        .page-break {
          page-break-after: always;
        }

        /* ── PRINT ONLY — hide buttons ── */
        .no-print { display: none !important; }

      </style>
    </head>
    <body>

      <!-- HEADER -->
      <div class="print-header">
        <div class="print-header-top">
          <div>
            <div class="print-org">
              Karnataka State Police — SCRB Intelligence Wing
            </div>
            <div class="print-title">${title}</div>
            <div class="print-subtitle">
              ${subtitle || ''}
            </div>
          </div>
          <div>
            <div class="print-badge">CONFIDENTIAL</div>
            <div class="print-badge-sub">
              Law Enforcement Use Only
            </div>
          </div>
        </div>
        <div class="print-meta">
          <span>GENERATED: <strong>${timestamp}</strong></span>
          <span>SYSTEM: <strong>KSP INTEL PLATFORM</strong></span>
          <span>REF: <strong>KSP/SCRB/2026/${Math.floor(Math.random()*90000+10000)}</strong></span>
        </div>
      </div>

      <!-- DYNAMIC CONTENT -->
      ${content}

      <!-- FOOTER -->
      <div class="print-footer">
        <span>
          Karnataka State Police | 
          SCRB, 7th Floor, MS Building, Bengaluru
        </span>
        <span>
          Generated: ${timestamp} | 
          RESTRICTED DISTRIBUTION
        </span>
      </div>

    </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
};

export default printExport;
