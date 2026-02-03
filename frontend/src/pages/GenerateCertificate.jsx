import React, { useState, useEffect } from 'react';

function GenerateCertificate() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

  const API_KEY = process.env.REACT_APP_API_KEY;
  const TEMPLATES_FOLDER_ID = process.env.REACT_APP_TEMPLATES_FOLDER_ID;
  const N8N_WEBHOOK_URL = 'https://infinityw.com/webhook-test/generate-certificate';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => window.gapi.load('client', initializeGoogleDrive);
    document.body.appendChild(script);
  }, []);

  const initializeGoogleDrive = () => {
    window.gapi.client
      .init({
        apiKey: API_KEY,
        discoveryDocs: [
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        ],
      })
      .then(loadTemplates)
      .catch(console.error);
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await window.gapi.client.drive.files.list({
        q: `'${TEMPLATES_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.presentation' and trashed=false`,
        fields:
          'files(id,name,thumbnailLink,webViewLink,createdTime,modifiedTime)',
        orderBy: 'modifiedTime desc',
      });

      setTemplates(res.result.files || []);
    } catch (err) {
      alert('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return alert('Select a template first');

    setLoading(true);
    try {
      const payload = {
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        templateLink: selectedTemplate.webViewLink,
        ...formData,
        certificateId: `CERT-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Generation failed: ${text}`);
      }

      alert(`Certificate sent to ${formData.email}`);
      setFormData({
        fullName: '',
        email: '',
        date: new Date().toISOString().split('T')[0],
      });
      setSelectedTemplate(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-2 w-100">
      <div className="mb-4">
        <h2 className="fw-bold">Generate Certificate</h2>
        <p className="text-muted">
          Choose a template and enter recipient details
        </p>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card h-100 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Templates</h5>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={loadTemplates}
              >
                Refresh
              </button>
            </div>

            <div
              className="card-body"
              style={{ maxHeight: '65vh', overflowY: 'auto' }}
            >
              {loading && <p className="text-muted">Loading templates…</p>}

              {!loading && templates.length === 0 && (
                <p className="text-muted">No templates found</p>
              )}

              <div className="row row-cols-1 row-cols-md-2 g-3">
                {templates.map((t) => (
                  <div className="col" key={t.id}>
                    <div
                      className={`card h-100 ${
                        selectedTemplate?.id === t.id ? 'border-primary' : ''
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTemplate(t)}
                    >
                      {t.thumbnailLink && (
                        <img
                          src={t.thumbnailLink}
                          className="card-img-top"
                          alt={t.name}
                        />
                      )}
                      <div className="card-body">
                        <h6 className="card-title">{t.name}</h6>
                        <small className="text-muted">
                          Google Slides Template
                        </small>
                      </div>
                      {selectedTemplate?.id === t.id && (
                        <div className="card-footer text-primary fw-semibold text-center">
                          ✓ Selected
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`col-lg-5 ${isMobile ? 'mb-5' : ''}`}>
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Recipient Details</h5>
            </div>

            <div className="card-body">
              <form onSubmit={handleGenerateCertificate}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="alert alert-info">
                  The certificate will be generated and emailed automatically.
                </div>

                <button
                  className="btn btn-primary w-100"
                  disabled={loading || !selectedTemplate}
                >
                  {loading ? 'Generating…' : '📄 Generate Certificate'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerateCertificate;
