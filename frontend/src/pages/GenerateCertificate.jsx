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

  // Google Drive API configuration
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
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
  try {
    // Try parsing JSON
    result = await response.json();
  } catch (err) {
    // If not JSON, get text
    result = await response.text();
  }

  console.log('Proxy response:', result);

  // Check if the response was successful (status 2xx)
  if (response.ok) {
    alert(`✅ Certificate generated successfully!
Certificate ID: ${certificateData.certificateId}
The certificate has been sent to ${formData.email}.`);

    // Reset form
    setFormData({
      fullName: '',
      email: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedTemplate(null);

  } else {
    // Show n8n error or proxy error
    console.error('Error response from backend proxy:', result);
    alert(`❌ Failed to generate certificate. Details: ${JSON.stringify(result)}`);
  }
} catch (error) {
  // Catch network or other unexpected errors
  console.error('Error generating certificate:', error);
  alert(`❌ An error occurred: ${error.message}. Check the console for details.`);
} finally {
  setLoading(false);
}

  };

  return (
    <div className="generate-certificate-container">
      <div className="page-header">
        <h2>Generate Certificate</h2>
        <p className="text-muted">Select a template and fill in the recipient details</p>
      </div>

      <div className="content-grid">
        {/* Left Side - Template Selection */}
        <div className="templates-section">
          <div className="section-card">
            <div className="section-header">
              <h5>Available Templates</h5>
              <button className="btn btn-sm btn-outline-primary" onClick={loadTemplates}>🔄 Refresh</button>
            </div>

            {loading && templates.length === 0 ? (
              <div className="loading-state">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p>Loading templates from Google Drive...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <p>No templates available</p>
                <small className="text-muted">Upload Google Slides files to your Google Drive folder</small>
              </div>
            ) : (
              <div className="templates-grid">
                {templates.map((template, index) => (
                  <div
                    key={index}
                    className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    {template.thumbnailLink && (
                      <div className="template-preview">
                        <img
                          src={template.thumbnailLink}
                          alt={template.name}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="14"%3ESlides%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    )}
                    <div className="template-info">
                      <h6>{template.name}</h6>
                      <small className="text-muted">Google Slides Template</small>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <div className="selected-badge">✓ Selected</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="form-section">
          <div className="section-card">
            <div className="section-header">
              <h5>Recipient Details</h5>
            </div>

            <form onSubmit={handleGenerateCertificate}>
              <div className="mb-3">
                <label htmlFor="fullName" className="form-label">Full Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control" id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Enter recipient's full name" required />
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email Address <span className="text-danger">*</span></label>
                <input type="email" className="form-control" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="recipient@example.com" required />
              </div>

              <div className="mb-3">
                <label htmlFor="date" className="form-label">Date <span className="text-danger">*</span></label>
                <input type="date" className="form-control" id="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>

              <div className="alert alert-info">
                <small><strong>Note:</strong> The certificate will be generated and sent to the provided email address.</small>
              </div>

              <button type="submit" className="btn btn-primary w-100" disabled={loading || !selectedTemplate}>
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

          {/* Preview Section */}
          {selectedTemplate && (
            <div className="section-card mt-3">
              <div className="section-header">
                <h5>Template Preview</h5>
                <a href={selectedTemplate.webViewLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">Open in Slides</a>
              </div>
              <div className="template-preview-large">
                {selectedTemplate.thumbnailLink ? (
                  <img
                    src={selectedTemplate.thumbnailLink}
                    alt="Template preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="preview-placeholder" style={{ display: 'none' }}>
                  <p>Preview not available</p>
                  <a href={selectedTemplate.webViewLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">View in Google Slides</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerateCertificate;
