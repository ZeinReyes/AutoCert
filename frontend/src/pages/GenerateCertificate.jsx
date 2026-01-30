import React, { useState, useEffect } from 'react';
import './GenerateCertificate.css';

function GenerateCertificate() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    date: new Date().toISOString().split('T')[0]
  });

  const API_KEY = process.env.REACT_APP_API_KEY;
  const TEMPLATES_FOLDER_ID = process.env.REACT_APP_TEMPLATES_FOLDER_ID;
  const BACKEND_PROXY_URL = process.env.REACT_APP_BACKEND_PROXY_URL;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', initializeGoogleDrive);
    };
    document.body.appendChild(script);
  }, []);

  const initializeGoogleDrive = () => {
    window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    }).then(() => {
      loadTemplates();
    }).catch(error => {
      console.error('Error initializing Google Drive API:', error);
    });
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `'${TEMPLATES_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.presentation' and trashed=false`,
        fields: 'files(id, name, createdTime, modifiedTime, thumbnailLink, webViewLink)',
        orderBy: 'modifiedTime desc',
        key: API_KEY
      });

      const files = response.result.files;
      if (files && files.length > 0) {
        const loadedTemplates = files.map(file => ({
          id: file.id,
          name: file.name,
          thumbnailLink: file.thumbnailLink,
          webViewLink: file.webViewLink,
          createdTime: file.createdTime,
          modifiedTime: file.modifiedTime,
          type: 'google-slides'
        }));
        setTemplates(loadedTemplates);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates from Google Drive:', error);
      alert('Failed to load templates. Please ensure the folder is publicly accessible.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();

    if (!selectedTemplate) {
      alert('Please select a template first');
      return;
    }

    if (!formData.fullName || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const certificateData = {
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        templateLink: selectedTemplate.webViewLink,
        fullName: formData.fullName,
        email: formData.email,
        date: formData.date,
        timestamp: new Date().toISOString(),
        certificateId: `CERT-${Date.now()}`
      };

      console.log('Sending to backend proxy:', certificateData);

      const response = await fetch(BACKEND_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certificateData)
      });

      let result;
      try { result = await response.json(); } 
      catch { result = await response.text(); }

      console.log('Proxy response:', result);

      if (response.ok) {
        alert(`Certificate generated successfully!
        Certificate ID: ${certificateData.certificateId}
        Sent to: ${formData.email}`);

        setFormData({
          fullName: '',
          email: '',
          date: new Date().toISOString().split('T')[0]
        });
        setSelectedTemplate(null);
      } else {
        console.error('Error response from backend proxy:', result);
        alert(`Failed to generate certificate. Details: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert(`An error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generate-certificate-container">
      <div className="page-header">
        <h2>Generate Certificate</h2>
        <p>Select a template and fill in recipient details</p>
      </div>

      <div className="content-grid">
        <div className="section-card templates-section">
          <div className="section-header">
            <h5>Templates</h5>
            <button className="btn btn-sm btn-outline-primary" onClick={loadTemplates}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="muted">Loading templates…</p>
          ) : templates.length === 0 ? (
            <p className="muted">No templates available</p>
          ) : (
            <div className="templates-grid">
              {templates.map(t => (
                <div
                  key={t.id}
                  className={`template-card ${selectedTemplate?.id === t.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(t)}
                >
                  {t.thumbnailLink && (
                    <div className="template-preview">
                      <img
                        src={t.thumbnailLink}
                        alt={t.name}
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="14"%3ESlides%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                  <div className="template-info">
                    <h6>{t.name}</h6>
                    <small>Google Slides Template</small>
                  </div>
                  {selectedTemplate?.id === t.id && <div className="selected-badge">✓ Selected</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-card">
          <div className="section-header">
            <h5>Recipient Details</h5>
          </div>

          <form onSubmit={handleGenerateCertificate}>
            <label htmlFor="fullName">Full Name *</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="form-control"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />

            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleInputChange}
              required
            />

            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              className="form-control"
              value={formData.date}
              onChange={handleInputChange}
              required
            />

            <div className="alert alert-info" style={{ marginTop: '12px' }}>
              The certificate will be generated and sent to the provided email address.
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading || !selectedTemplate} style={{ marginTop: '12px' }}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Generating...
                </>
              ) : (
                <>📄 Generate Certificate</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GenerateCertificate;
