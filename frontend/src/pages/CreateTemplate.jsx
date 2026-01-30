import React, { useState, useRef } from 'react';
import './CreateTemplate.css';

function CreateTemplate() {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [images, setImages] = useState([]); // Multiple images
  const [templateName, setTemplateName] = useState('Untitled Template');
  
  // Text elements array
  const [textElements, setTextElements] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  
  // Dragging state
  const [dragging, setDragging] = useState(null);
  const canvasRef = useRef(null);

  // Handle background upload (only one)
  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload (multiple)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = {
          id: Date.now() + Math.random(),
          src: event.target.result,
          position: { x: 100, y: 100 },
          size: 150
        };
        setImages(prev => [...prev, newImage]);
        setSelectedImageId(newImage.id);
      };
      reader.readAsDataURL(file);
    });
  };

  // Add new text element
  const addTextElement = () => {
    const newText = {
      id: Date.now(),
      content: 'Double click to edit',
      position: { x: 200, y: 200 },
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center'
    };
    setTextElements([...textElements, newText]);
    setSelectedTextId(newText.id);
    setSelectedImageId(null);
  };

  // Update text element
  const updateTextElement = (id, updates) => {
    setTextElements(textElements.map(text => 
      text.id === id ? { ...text, ...updates } : text
    ));
  };

  // Update image
  const updateImage = (id, updates) => {
    setImages(images.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ));
  };

  // Delete text element
  const deleteTextElement = (id) => {
    setTextElements(textElements.filter(text => text.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  // Delete image
  const deleteImage = (id) => {
    setImages(images.filter(img => img.id !== id));
    if (selectedImageId === id) setSelectedImageId(null);
  };

  // Get selected text and image
  const selectedText = textElements.find(t => t.id === selectedTextId);
  const selectedImage = images.find(img => img.id === selectedImageId);

  // Handle drag start
  const handleMouseDown = (e, element, id = null) => {
    e.preventDefault();
    setDragging({ type: element, id });
    if (element === 'text') {
      setSelectedTextId(id);
      setSelectedImageId(null);
    } else if (element === 'image') {
      setSelectedImageId(id);
      setSelectedTextId(null);
    }
  };

  // Handle dragging
  const handleMouseMove = (e) => {
    if (!dragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragging.type === 'text') {
      updateTextElement(dragging.id, {
        position: { 
          x: Math.max(0, Math.min(x, rect.width - 50)), 
          y: Math.max(0, Math.min(y, rect.height - 50)) 
        }
      });
    } else if (dragging.type === 'image') {
      const img = images.find(i => i.id === dragging.id);
      if (img) {
        updateImage(dragging.id, {
          position: { 
            x: Math.max(0, Math.min(x - img.size / 2, rect.width - img.size)), 
            y: Math.max(0, Math.min(y - img.size / 2, rect.height - img.size)) 
          }
        });
      }
    }
  };

  // Handle drag end
  const handleMouseUp = () => {
    setDragging(null);
  };

  // Save template
  const handleSaveTemplate = () => {
    const template = {
      name: templateName,
      backgroundImage,
      images,
      textElements,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('certificateTemplate', JSON.stringify(template));
    alert('Template saved successfully!');
  };

  // Reset template
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset? All changes will be lost.')) {
      setBackgroundImage(null);
      setImages([]);
      setTemplateName('Untitled Template');
      setTextElements([]);
      setSelectedTextId(null);
      setSelectedImageId(null);
    }
  };

  return (
    <div className="create-template-wrapper">
      {/* Top Section - Name and Buttons */}
      <div className="top-section">
        <input
          type="text"
          className="template-name-input"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Untitled Template"
        />
        <div className="top-buttons">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleReset}>
            Reset
          </button>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleSaveTemplate}
            disabled={!backgroundImage}
          >
            Save Template
          </button>
        </div>
      </div>

      {/* Toolbar - Google Docs Style */}
      <div className="toolbar">
        {/* Upload Buttons */}
        <div className="toolbar-group">
          <label className="toolbar-btn" title="Upload Background">
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              hidden
            />
            🖼️ Background
          </label>
          
          <label className="toolbar-btn" title="Upload Image">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              multiple
              hidden
            />
            📷 Image
          </label>
        </div>

        <div className="toolbar-divider"></div>

        {/* Text Button */}
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={addTextElement} title="Add Text">
            <strong>T</strong> Text
          </button>
        </div>

        {/* Text Editing Tools (shown when text is selected) */}
        {selectedText && (
          <>
            <div className="toolbar-divider"></div>
            
            <div className="toolbar-group">
              {/* Font Family */}
              <select
                className="toolbar-select"
                value={selectedText.fontFamily}
                onChange={(e) => updateTextElement(selectedText.id, { fontFamily: e.target.value })}
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Impact">Impact</option>
              </select>

              {/* Font Size */}
              <select
                className="toolbar-select toolbar-select-small"
                value={selectedText.fontSize}
                onChange={(e) => updateTextElement(selectedText.id, { fontSize: Number(e.target.value) })}
              >
                {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-group">
              {/* Bold */}
              <button
                className={`toolbar-icon-btn ${selectedText.fontWeight === 'bold' ? 'active' : ''}`}
                onClick={() => updateTextElement(selectedText.id, { 
                  fontWeight: selectedText.fontWeight === 'bold' ? 'normal' : 'bold' 
                })}
                title="Bold"
              >
                <strong>B</strong>
              </button>

              {/* Italic */}
              <button
                className={`toolbar-icon-btn ${selectedText.fontStyle === 'italic' ? 'active' : ''}`}
                onClick={() => updateTextElement(selectedText.id, { 
                  fontStyle: selectedText.fontStyle === 'italic' ? 'normal' : 'italic' 
                })}
                title="Italic"
              >
                <em>I</em>
              </button>

              {/* Text Color */}
              <label className="toolbar-color-btn" title="Text Color">
                <input
                  type="color"
                  value={selectedText.color}
                  onChange={(e) => updateTextElement(selectedText.id, { color: e.target.value })}
                />
                <span style={{ color: selectedText.color }}>A</span>
              </label>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-group">
              {/* Align Left */}
              <button
                className={`toolbar-icon-btn ${selectedText.textAlign === 'left' ? 'active' : ''}`}
                onClick={() => updateTextElement(selectedText.id, { textAlign: 'left' })}
                title="Align Left"
              >
                ⬅
              </button>

              {/* Align Center */}
              <button
                className={`toolbar-icon-btn ${selectedText.textAlign === 'center' ? 'active' : ''}`}
                onClick={() => updateTextElement(selectedText.id, { textAlign: 'center' })}
                title="Align Center"
              >
                ⬌
              </button>

              {/* Align Right */}
              <button
                className={`toolbar-icon-btn ${selectedText.textAlign === 'right' ? 'active' : ''}`}
                onClick={() => updateTextElement(selectedText.id, { textAlign: 'right' })}
                title="Align Right"
              >
                ➡
              </button>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-group">
              {/* Delete Text */}
              <button
                className="toolbar-btn toolbar-btn-danger"
                onClick={() => deleteTextElement(selectedText.id)}
                title="Delete Text"
              >
                🗑️ Delete
              </button>
            </div>
          </>
        )}

        {/* Image Editing Tools (shown when image is selected) */}
        {selectedImage && (
          <>
            <div className="toolbar-divider"></div>
            
            <div className="toolbar-group">
              <label className="toolbar-label">Size:</label>
              <input
                type="range"
                className="toolbar-range"
                min="50"
                max="500"
                value={selectedImage.size}
                onChange={(e) => updateImage(selectedImage.id, { size: Number(e.target.value) })}
              />
              <span className="toolbar-value">{selectedImage.size}px</span>
            </div>

            <div className="toolbar-divider"></div>

            <div className="toolbar-group">
              <button
                className="toolbar-btn toolbar-btn-danger"
                onClick={() => deleteImage(selectedImage.id)}
                title="Delete Image"
              >
                🗑️ Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Text Edit Panel (shown when text is selected) */}
      {selectedText && (
        <div className="text-edit-panel">
          <textarea
            className="text-edit-textarea"
            value={selectedText.content}
            onChange={(e) => updateTextElement(selectedText.id, { content: e.target.value })}
            placeholder="Enter text content..."
          />
        </div>
      )}

      {/* Canvas Area - Full Width */}
      <div className="canvas-container">
        <div 
          ref={canvasRef}
          className="certificate-canvas"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: backgroundImage ? 'transparent' : '#ffffff'
          }}
        >
          {!backgroundImage && (
            <div className="empty-canvas-message">
              <div className="empty-icon">📄</div>
              <p>Click "Background" to upload a background image</p>
            </div>
          )}

          {/* Images */}
          {images.map(image => (
            <img
              key={image.id}
              src={image.src}
              alt="Uploaded"
              className={`draggable-element ${selectedImageId === image.id ? 'selected' : ''}`}
              style={{
                left: `${image.position.x}px`,
                top: `${image.position.y}px`,
                width: `${image.size}px`,
                height: `${image.size}px`,
                cursor: dragging?.type === 'image' && dragging?.id === image.id ? 'grabbing' : 'grab'
              }}
              onMouseDown={(e) => handleMouseDown(e, 'image', image.id)}
              draggable="false"
            />
          ))}

          {/* Text Elements */}
          {textElements.map(text => (
            <div
              key={text.id}
              className={`draggable-text ${selectedTextId === text.id ? 'selected' : ''}`}
              style={{
                left: `${text.position.x}px`,
                top: `${text.position.y}px`,
                fontSize: `${text.fontSize}px`,
                fontFamily: text.fontFamily,
                color: text.color,
                fontWeight: text.fontWeight,
                fontStyle: text.fontStyle,
                textAlign: text.textAlign,
                cursor: dragging?.type === 'text' && dragging?.id === text.id ? 'grabbing' : 'grab'
              }}
              onMouseDown={(e) => handleMouseDown(e, 'text', text.id)}
            >
              {text.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CreateTemplate;