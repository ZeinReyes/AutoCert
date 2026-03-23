import React, { useState, useEffect, useRef } from 'react';

// ── CSV Templates ─────────────────────────────────────────────────────────────
const CSV_TEMPLATE_SINGLE = `fullName,email,date\nJuan dela Cruz,juan@example.com,2025-03-23\nMaria Santos,maria@example.com,2025-03-23`;
const CSV_TEMPLATE_MULTI  = `fullName,email,date,templateName\nJuan dela Cruz,juan@example.com,2025-03-23,Certificate of Completion\nMaria Santos,maria@example.com,2025-03-23,Certificate of Recognition\nJose Rizal,jose@example.com,2025-03-23,Certificate of Appreciation`;

function downloadCSVTemplate(withTemplate = false) {
  const content  = withTemplate ? CSV_TEMPLATE_MULTI : CSV_TEMPLATE_SINGLE;
  const filename = withTemplate ? 'certificate_recipients_with_template.csv' : 'certificate_recipients_template.csv';
  const blob = new Blob([content], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  for (const r of ['fullname','email','date']) {
    if (!headers.includes(r)) throw new Error(`Missing required column: "${r}"`);
  }
  const hasTemplateCol = headers.includes('templatename');
  return lines.slice(1).map((line, i) => {
    const vals = line.split(',').map(v => v.trim());
    const row  = {};
    headers.forEach((h, idx) => (row[h] = vals[idx] || ''));
    if (!row.fullname) throw new Error(`Row ${i+2}: fullName is required`);
    if (!row.email)    throw new Error(`Row ${i+2}: email is required`);
    if (!row.date)     throw new Error(`Row ${i+2}: date is required`);
    return { fullName: row.fullname, email: row.email, date: row.date, templateName: hasTemplateCol ? (row.templatename || '') : '' };
  });
}

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --ink: #0f0e0d;
    --paper: #faf9f7;
    --cream: #f2ede4;
    --gold: #c9a84c;
    --gold-light: #e8d5a0;
    --gold-dim: #8a6e30;
    --muted: #7a7168;
    --border: #ddd8ce;
    --success: #3a7d44;
    --error: #b84040;
    --blue: #2d5fa6;
    --card-bg: #ffffff;
    --shadow: 0 2px 20px rgba(15,14,13,0.08);
    --radius: 4px;
    --radius-lg: 8px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cert-root {
    font-family: 'DM Sans', sans-serif;
    background: var(--paper);
    min-height: 100vh;
    color: var(--ink);
  }

  /* Page wrapper */
  .cert-body {
    max-width: 1200px;
    margin: 0 auto;
    padding: 36px 32px 60px;
  }

  .cert-page-title {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 4px;
  }
  .cert-page-sub {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 24px;
    font-weight: 300;
  }

  /* Tabs */
  .cert-tabs {
    display: flex;
    border-bottom: 2px solid var(--border);
    margin-bottom: 28px;
  }
  .cert-tab {
    background: none; border: none; cursor: pointer;
    padding: 10px 22px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    color: var(--muted);
    letter-spacing: 0.04em;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: color 0.2s, border-color 0.2s;
  }
  .cert-tab.active { color: var(--ink); border-bottom-color: var(--gold); }
  .cert-tab:hover:not(.active) { color: var(--ink); }

  /* Two-column layout: templates flex-grow, form fixed 400px */
  .cert-grid {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 24px;
    align-items: start;
  }
  @media (max-width: 960px) {
    .cert-grid { grid-template-columns: 1fr; }
    .cert-body { padding: 24px 16px 80px; }
  }

  /* Cards */
  .cert-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  .cert-card-header {
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--cream);
  }
  .cert-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 15px; font-weight: 600;
    color: var(--ink);
  }
  .cert-card-body { padding: 20px; }

  /* Template grid inside the card */
  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    max-height: 480px;
    overflow-y: auto;
    padding-right: 2px;
  }
  .template-grid::-webkit-scrollbar { width: 4px; }
  .template-grid::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .template-item {
    border: 1.5px solid var(--border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
    overflow: hidden;
    background: var(--paper);
    position: relative;
  }
  .template-item:hover { border-color: var(--gold); box-shadow: 0 4px 16px rgba(201,168,76,0.18); transform: translateY(-2px); }
  .template-item.selected { border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold-light); }
  .template-thumb { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; background: var(--cream); }
  .template-thumb-placeholder {
    width: 100%; aspect-ratio: 4/3;
    background: var(--cream);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 500; color: var(--muted); letter-spacing: 0.04em;
  }
  .template-info { padding: 8px 10px; }
  .template-name { font-size: 11px; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .template-sub  { font-size: 10px; color: var(--muted); margin-top: 2px; }
  .template-badge {
    position: absolute; top: 6px; right: 6px;
    background: var(--gold); color: #fff;
    font-size: 9px; font-weight: 700;
    padding: 2px 6px; border-radius: 20px;
    letter-spacing: 0.04em;
  }

  /* Form */
  .form-group { margin-bottom: 16px; }
  .form-label {
    display: block;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--muted); margin-bottom: 5px;
  }
  .form-control {
    width: 100%;
    padding: 9px 12px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: var(--ink);
    background: var(--paper);
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
  }
  .form-control:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.15); background: #fff; }

  /* Alert — plain block, no flex */
  .cert-alert {
    padding: 10px 13px;
    border-radius: var(--radius);
    font-size: 12px;
    line-height: 1.65;
    margin-bottom: 14px;
    display: block;
    width: 100%;
  }
  .cert-alert.info    { background: #eef3fb; border: 1px solid #c0d1ee; color: var(--blue); }
  .cert-alert.success { background: #edf7f0; border: 1px solid #b0d9bb; color: var(--success); }
  .cert-alert.error   { background: #fdf0f0; border: 1px solid #e8b8b8; color: var(--error); }

  /* Selected banner */
  .selected-banner {
    background: linear-gradient(135deg, #fffaef, #fdf6e3);
    border: 1px solid var(--gold-light);
    border-radius: var(--radius);
    padding: 9px 13px;
    display: flex; align-items: baseline; gap: 8px;
    margin-bottom: 14px; font-size: 12px; color: var(--gold-dim);
    flex-wrap: wrap;
  }
  .selected-banner strong { color: var(--ink); }

  /* CSV drop zone */
  .csv-zone {
    border: 2px dashed var(--border);
    border-radius: var(--radius-lg);
    padding: 24px 16px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    background: var(--paper);
    position: relative;
  }
  .csv-zone:hover, .csv-zone.drag-over { border-color: var(--gold); background: rgba(201,168,76,0.04); }
  .csv-zone-text { font-size: 13px; color: var(--muted); }
  .csv-zone-text strong { color: var(--ink); font-weight: 600; }

  /* CSV preview table */
  .csv-preview { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; font-size: 12px; }
  .csv-table { width: 100%; border-collapse: collapse; }
  .csv-table th {
    background: var(--cream); padding: 7px 10px;
    text-align: left; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--muted); border-bottom: 1px solid var(--border);
  }
  .csv-table td { padding: 6px 10px; border-bottom: 1px solid var(--border); color: var(--ink); }
  .csv-table tr:last-child td { border-bottom: none; }
  .csv-table tr:nth-child(even) td { background: var(--paper); }

  /* Status list */
  .status-list { margin-top: 12px; display: flex; flex-direction: column; gap: 5px; }
  .status-row {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 11px;
    border-radius: var(--radius);
    font-size: 12px;
    background: var(--paper);
    border: 1px solid var(--border);
  }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .status-dot.pending  { background: var(--muted); }
  .status-dot.sending  { background: var(--gold); animation: pulse 1s infinite; }
  .status-dot.done     { background: var(--success); }
  .status-dot.fail     { background: var(--error); }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 9px 16px;
    border: none; border-radius: var(--radius);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary {
    background: var(--ink); color: var(--paper);
    width: 100%; padding: 12px;
    font-size: 13px; letter-spacing: 0.07em; text-transform: uppercase;
  }
  .btn-primary:hover:not(:disabled) { background: #2a2925; box-shadow: 0 4px 14px rgba(15,14,13,0.2); }
  .btn-outline {
    background: transparent; color: var(--ink);
    border: 1.5px solid var(--border);
    font-size: 11px; padding: 6px 11px;
  }
  .btn-outline:hover { border-color: var(--gold); color: var(--gold-dim); }
  .btn-gold { background: var(--gold); color: #fff; font-size: 11px; padding: 6px 12px; }
  .btn-gold:hover:not(:disabled) { background: var(--gold-dim); }
  .btn-sm { padding: 5px 9px; font-size: 11px; }

  /* Empty/loading state */
  .state-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; padding: 40px 20px;
    color: var(--muted); font-size: 13px; text-align: center;
  }
  .state-empty-icon { font-size: 22px; color: var(--border); }

  /* Spinner */
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Refresh btn */
  .refresh-btn {
    background: none; border: none; cursor: pointer;
    font-size: 15px; color: var(--muted);
    padding: 3px 7px; border-radius: var(--radius);
    transition: color 0.2s, background 0.2s;
  }
  .refresh-btn:hover { color: var(--gold-dim); background: var(--cream); }

  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function GenerateCertificate() {
  const [templates, setTemplates]           = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading]               = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [tab, setTab]                       = useState('single');
  const [dragOver, setDragOver]             = useState(false);
  const [csvData, setCsvData]               = useState(null);
  const [csvError, setCsvError]             = useState('');
  const [bulkStatuses, setBulkStatuses]     = useState([]);
  const [toast, setToast]                   = useState(null);
  const fileInputRef = useRef();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
  });

  const API_KEY            = process.env.REACT_APP_API_KEY;
  const TEMPLATES_FOLDER_ID = process.env.REACT_APP_TEMPLATES_FOLDER_ID;
  const N8N_WEBHOOK_URL    = 'https://infinityw.com/webhook/generate-certificate';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => window.gapi.load('client', initializeGoogleDrive);
    document.body.appendChild(script);
  }, []);

  const initializeGoogleDrive = () => {
    window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    }).then(loadTemplates).catch(console.error);
  };

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await window.gapi.client.drive.files.list({
        q: `'${TEMPLATES_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.presentation' and trashed=false`,
        fields: 'files(id,name,thumbnailLink,webViewLink,createdTime,modifiedTime)',
        orderBy: 'modifiedTime desc',
      });
      setTemplates(res.result.files || []);
    } catch {
      showToast('Failed to load templates', 'error');
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleCSVFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setCsvError('Please upload a .csv file.'); setCsvData(null); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target.result);
        setCsvData(rows);
        setCsvError('');
        setBulkStatuses(rows.map(r => ({ ...r, status: 'pending' })));
      } catch (err) { setCsvError(err.message); setCsvData(null); }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleCSVFile(e.dataTransfer.files[0]); };

  const handleGenerateSingle = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return showToast('Please select a template first.', 'error');
    setLoading(true);
    try {
      const payload = {
        templateId: selectedTemplate.id, templateName: selectedTemplate.name,
        templateLink: selectedTemplate.webViewLink, ...formData,
        certificateId: `CERT-${Date.now()}`, timestamp: new Date().toISOString(),
      };
      const res = await fetch(N8N_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Generation failed (${res.status})`);
      showToast(`Certificate sent to ${formData.email}`);
      setFormData({ fullName: '', email: '', date: new Date().toISOString().split('T')[0] });
      setSelectedTemplate(null);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleGenerateBulk = async () => {
    if (!csvData || !csvData.length) return showToast('Upload a CSV file first.', 'error');
    const unresolvable = csvData.filter(r => {
      if (selectedTemplate) return false;
      if (!r.templateName) return true;
      return !templates.find(t => t.name.toLowerCase().trim() === r.templateName.toLowerCase().trim());
    });
    if (unresolvable.length) return showToast(`${unresolvable.length} row(s) have no matching template.`, 'error');

    setBulkStatuses(csvData.map(r => ({ ...r, status: 'pending' })));
    for (let i = 0; i < csvData.length; i++) {
      setBulkStatuses(prev => { const n = [...prev]; n[i] = { ...n[i], status: 'sending' }; return n; });
      try {
        const resolved = selectedTemplate || templates.find(t => t.name.toLowerCase().trim() === csvData[i].templateName.toLowerCase().trim());
        const payload  = {
          templateId: resolved.id, templateName: resolved.name, templateLink: resolved.webViewLink,
          fullName: csvData[i].fullName, email: csvData[i].email, date: csvData[i].date,
          certificateId: `CERT-${Date.now()}-${i}`, timestamp: new Date().toISOString(),
        };
        const res = await fetch(N8N_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        setBulkStatuses(prev => { const n = [...prev]; n[i] = { ...n[i], status: res.ok ? 'done' : 'fail', resolvedTemplate: resolved.name }; return n; });
      } catch {
        setBulkStatuses(prev => { const n = [...prev]; n[i] = { ...n[i], status: 'fail' }; return n; });
      }
    }
    showToast('Bulk generation complete.');
  };

  const isBulkRunning = bulkStatuses.some(s => s.status === 'sending');
  const doneCount     = bulkStatuses.filter(s => s.status === 'done').length;
  const hasTemplatCol = csvData && csvData.some(r => r.templateName);

  return (
    <div className="cert-root">

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#b84040' : toast.type === 'success' ? '#3a7d44' : '#2d5fa6',
          color: '#fff', padding: '10px 16px', borderRadius: '5px',
          fontSize: '13px', fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
          boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'fadeInDown 0.25s ease',
        }}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '·'} {toast.msg}
        </div>
      )}

      <div className="cert-body">
        <h1 className="cert-page-title">Generate Certificates</h1>
        <p className="cert-page-sub">Choose a template, fill in recipient details, or upload a CSV for bulk generation.</p>

        {/* Tabs */}
        <div className="cert-tabs">
          <button className={`cert-tab ${tab === 'single' ? 'active' : ''}`} onClick={() => setTab('single')}>Single Recipient</button>
          <button className={`cert-tab ${tab === 'bulk'   ? 'active' : ''}`} onClick={() => setTab('bulk')}>Bulk Upload (CSV)</button>
        </div>

        {/* Grid */}
        <div className="cert-grid">

          {/* ── LEFT: Templates ── */}
          <div className="cert-card">
            <div className="cert-card-header">
              <span className="cert-card-title">Certificate Templates</span>
              <button className="refresh-btn" onClick={loadTemplates} title="Refresh">↻</button>
            </div>
            <div className="cert-card-body">
              {templatesLoading && (
                <div className="state-empty"><div className="state-empty-icon">◌</div>Loading templates…</div>
              )}
              {!templatesLoading && templates.length === 0 && (
                <div className="state-empty">
                  <div className="state-empty-icon">▭</div>
                  No templates found.
                  <button className="btn btn-outline btn-sm" onClick={loadTemplates}>Try again</button>
                </div>
              )}
              {!templatesLoading && templates.length > 0 && (
                <div className="template-grid">
                  {templates.map(t => (
                    <div key={t.id} className={`template-item ${selectedTemplate?.id === t.id ? 'selected' : ''}`} onClick={() => setSelectedTemplate(prev => prev?.id === t.id ? null : t)}>
                      {selectedTemplate?.id === t.id && <div className="template-badge">Selected</div>}
                      {t.thumbnailLink
                        ? <img src={t.thumbnailLink} className="template-thumb" alt={t.name} />
                        : <div className="template-thumb-placeholder">No Preview</div>
                      }
                      <div className="template-info">
                        <div className="template-name">{t.name}</div>
                        <div className="template-sub">Google Slides</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Form Panel ── */}
          <div>
            {selectedTemplate && (
              <div className="selected-banner">
                <span style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', flexShrink: 0 }}>Template</span>
                <strong>{selectedTemplate.name}</strong>
              </div>
            )}

            {/* Single */}
            {tab === 'single' && (
              <div className="cert-card">
                <div className="cert-card-header">
                  <span className="cert-card-title">Recipient Details</span>
                </div>
                <div className="cert-card-body">
                  <form onSubmit={handleGenerateSingle}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-control" name="fullName" value={formData.fullName}
                        onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                        placeholder="e.g. Juan dela Cruz" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input type="email" className="form-control" name="email" value={formData.email}
                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                        placeholder="recipient@email.com" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input type="date" className="form-control" name="date" value={formData.date}
                        onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} required />
                    </div>
                    <p className="cert-alert info">
                      The certificate will be generated from the selected template and emailed automatically.
                    </p>
                    <button className="btn btn-primary" disabled={loading || !selectedTemplate}>
                      {loading ? <><div className="spinner" /> Generating…</> : 'Generate & Send Certificate'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Bulk */}
            {tab === 'bulk' && (
              <div className="cert-card">
                <div className="cert-card-header">
                  <span className="cert-card-title">Bulk Upload</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => downloadCSVTemplate(false)}>↓ Simple CSV</button>
                    <button className="btn btn-gold btn-sm"    onClick={() => downloadCSVTemplate(true)}>↓ CSV with Templates</button>
                  </div>
                </div>
                <div className="cert-card-body">
                  <p className="cert-alert info">
                    Select a template on the left to use it for all recipients, or leave it unselected and add a <strong>templateName</strong> column in your CSV to assign a different template per row.
                  </p>

                  {/* Drop zone */}
                  <div
                    className={`csv-zone ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleCSVFile(e.target.files[0])} />
                    <div style={{ fontSize: 18, color: 'var(--border)', marginBottom: 6 }}>↑</div>
                    <div className="csv-zone-text"><strong>Drag & drop</strong> your CSV here, or <strong>click to browse</strong></div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>Accepts .csv files only</div>
                  </div>

                  {csvError && <p className="cert-alert error" style={{ marginTop: 12, marginBottom: 0 }}>{csvError}</p>}

                  {csvData && csvData.length > 0 && (
                    <>
                      {/* Mode banner */}
                      {selectedTemplate ? (
                        <div className="selected-banner" style={{ marginTop: 14, marginBottom: 10 }}>
                          <span style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', flexShrink: 0 }}>One Template</span>
                          <span>Using <strong>{selectedTemplate.name}</strong> for all {csvData.length} recipients</span>
                        </div>
                      ) : hasTemplatCol ? (
                        <div className="selected-banner" style={{ marginTop: 14, marginBottom: 10, background: 'linear-gradient(135deg,#eff6ff,#e8f1fd)', borderColor: '#b8d0f0', color: '#2d5fa6' }}>
                          <span style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>Per Row</span>
                          <span>Using per-row templates from the CSV <strong>templateName</strong> column</span>
                        </div>
                      ) : (
                        <p className="cert-alert error" style={{ marginTop: 14, marginBottom: 10 }}>
                          No template selected and no <strong>templateName</strong> column found. Select a template or use the "CSV with Templates" download.
                        </p>
                      )}

                      {/* Count + clear */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{csvData.length} recipient{csvData.length !== 1 ? 's' : ''} found</span>
                        <button className="btn btn-outline btn-sm" onClick={() => { setCsvData(null); setBulkStatuses([]); }}>Clear</button>
                      </div>

                      {/* Preview table */}
                      <div className="csv-preview" style={{ maxHeight: 180, overflowY: 'auto' }}>
                        <table className="csv-table">
                          <thead>
                            <tr>
                              <th>#</th><th>Full Name</th><th>Email</th><th>Date</th>
                              {hasTemplatCol && <th>Template</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.map((r, i) => {
                              const matched    = !selectedTemplate && r.templateName ? templates.find(t => t.name.toLowerCase().trim() === r.templateName.toLowerCase().trim()) : null;
                              const unresolved = !selectedTemplate && r.templateName && !matched;
                              return (
                                <tr key={i}>
                                  <td style={{ color: 'var(--muted)' }}>{i+1}</td>
                                  <td>{r.fullName}</td>
                                  <td>{r.email}</td>
                                  <td>{r.date}</td>
                                  {hasTemplatCol && (
                                    <td style={{ color: unresolved ? 'var(--error)' : matched ? 'var(--success)' : 'var(--muted)', fontSize: 11 }}>
                                      {r.templateName ? (unresolved ? `"${r.templateName}" not found` : r.templateName) : (selectedTemplate ? <em>using selected</em> : '—')}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Status list */}
                      {bulkStatuses.some(s => s.status !== 'pending') && (
                        <div className="status-list">
                          {bulkStatuses.map((s, i) => (
                            <div key={i} className="status-row">
                              <div className={`status-dot ${s.status}`} />
                              <span style={{ flex: 1 }}>{s.fullName}</span>
                              {s.resolvedTemplate && (
                                <span style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {s.resolvedTemplate}
                                </span>
                              )}
                              <span style={{ color: 'var(--muted)', fontSize: 11 }}>{s.email}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: s.status === 'done' ? 'var(--success)' : s.status === 'fail' ? 'var(--error)' : s.status === 'sending' ? 'var(--gold)' : 'var(--muted)' }}>
                                {s.status === 'done' ? 'Sent' : s.status === 'fail' ? 'Failed' : s.status === 'sending' ? 'Sending…' : 'Queued'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {doneCount > 0 && doneCount === csvData.length && (
                        <p className="cert-alert success" style={{ marginTop: 12, marginBottom: 0 }}>
                          All {doneCount} certificates sent successfully.
                        </p>
                      )}

                      <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={isBulkRunning} onClick={handleGenerateBulk}>
                        {isBulkRunning
                          ? <><div className="spinner" /> Sending {doneCount + 1} of {csvData.length}…</>
                          : `Send ${csvData.length} Certificate${csvData.length !== 1 ? 's' : ''}`
                        }
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}