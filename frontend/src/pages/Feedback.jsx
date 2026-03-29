import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle, X, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'txt', 'doc', 'docx', 'ppt', 'pptx'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const getFileIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return <FileText size={20} color="var(--error)" />;
  if (['png', 'jpg', 'jpeg'].includes(ext)) return <ImageIcon size={20} color="var(--accent-primary)" />;
  if (['doc', 'docx'].includes(ext)) return <FileText size={20} color="#2563eb" />;
  if (['ppt', 'pptx'].includes(ext)) return <FileText size={20} color="#ea580c" />;
  return <FileText size={20} color="var(--text-secondary)" />;
};

export default function Feedback() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', comments: '' });
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [errorMSG, setErrorMSG] = useState('');
  const [invalidFields, setInvalidFields] = useState([]);
  const [successMSG, setSuccessMSG] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/users/me`, { withCredentials: true });
        if (response.data.email) {
          const user = response.data;
          const fullName = `${user.first_name} ${user.middle_name ? user.middle_name + ' ' : ''}${user.last_name}`;
          setForm((prev) => ({ ...prev, email: user.email, name: fullName }));
        }
      } catch (e) {
        console.warn('Failed to securely infer identity mapping', e);
      }
    };
    fetchIdentity();
  }, []);

  const validateFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type ".${ext}" is not allowed. Use PDF, PNG, JPG, or TXT.`;
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `File exceeds the 5MB size limit (${(f.size / 1024 / 1024).toFixed(2)}MB).`;
    }
    return null;
  };

  const handleFileSelect = (f) => {
    setErrorMSG('');
    setSuccessMSG('');
    const err = validateFile(f);
    if (err) { setErrorMSG(err); return; }
    setFile(f);
    setUploadProgress(0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMSG(''); 
    setSuccessMSG('');
    setInvalidFields([]);

    const missing = [];
    if (!form.name) missing.push('name');
    if (!form.email) missing.push('email');
    // Removed require rule for comments here since it's optional

    if (missing.length > 0) {
      setInvalidFields(missing);
      setErrorMSG('Please fill in all highlighted required fields.');
      return;
    }
    
    if (form.comments.length > 500) {
      setInvalidFields(['comments']);
      setErrorMSG('Comments must be 500 characters or fewer.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    const fullName = form.name || 'Anonymous User';
    formData.append('name', fullName);
    formData.append('subject', `Attachment Submission from ${fullName.substring(0, 50)}`);
    formData.append('email', form.email);
    formData.append('message', form.comments);
    if (file) formData.append('file', file);

    try {
      await axios.post(`${API_URL}/feedback/submit`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (ev) => {
          const pct = Math.round((ev.loaded * 100) / ev.total);
          setUploadProgress(pct);
        },
      });
      setSuccessMSG('Your secure file and message have been successfully uploaded.');
      setForm({ name: form.name, email: form.email, comments: '' });
      setFile(null);
      setUploadProgress(0);
      setInvalidFields([]);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // detail format from backend is now: [{field: 'email', msg: 'value is not a valid email address'}]
        const messages = detail.map(d => `${d.field}: ${d.msg}`).join(' | ');
        const errorFields = detail.map(d => {
            // map backend fields to frontend local state names
            if (d.field === 'message') return 'comments';
            return d.field;
        });
        setErrorMSG(messages);
        setInvalidFields(errorFields);
      } else {
        setErrorMSG(detail || 'Submission securely rejected. Please review inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isInvalid = (field) => invalidFields.includes(field);
  const inputStyle = (field) => ({
    width: '100%',
    borderColor: isInvalid(field) ? 'var(--error)' : 'var(--border-color)',
    boxShadow: isInvalid(field) ? '0 0 0 1px rgba(239, 68, 68, 0.5)' : 'none'
  });

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <MessageSquare size={32} color="var(--accent-primary)" />
          <div>
            <h2 style={{ marginBottom: 0 }}>File Attachment Form</h2>
            <p style={{ margin: 0 }}>Please safely upload files and metadata below.</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          type="button"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {errorMSG && (
        <div className="alert alert-error">
          <AlertCircle size={18} /> {errorMSG}
        </div>
      )}
      {successMSG && (
        <div className="alert alert-success">
          <CheckCircle size={18} /> {successMSG}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Metadata */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">System Account Name</label>
            <input 
              type="text"
              className="form-input" 
              style={{ ...inputStyle('name'), opacity: 0.7, cursor: 'not-allowed', background: 'var(--bg-primary)' }}
              value={form.name} 
              readOnly
              disabled
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">E-mail Address (Verified Session)</label>
            <input 
                type="email"
                className="form-input" 
                style={{ ...inputStyle('email'), opacity: 0.7, cursor: 'not-allowed', background: 'var(--bg-primary)' }}
                value={form.email} 
                readOnly
                disabled
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label className="form-label">Secure Comments (Optional)</label>
            <textarea
              className="form-input"
              style={{ ...inputStyle('comments'), flex: 1, resize: 'none', minHeight: '120px' }}
              value={form.comments}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
              placeholder="Your comments will be encrypted at rest..."
              maxLength={500}
            />
            <small style={{ color: 'var(--text-secondary)', alignSelf: 'flex-end', marginTop: '0.4rem' }}>
              {form.comments.length}/500
            </small>
          </div>
        </div>

        {/* Right Column: Uploader */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Document Upload</h3>
          <p style={{ fontSize: '0.85rem' }}>Strict security bounds: Max 5MB, accepted types: .pdf, .png, .jpg, .txt, .doc(x), .ppt(x)</p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 1,
              border: `2px dashed ${dragging ? 'var(--accent-hover)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-tertiary)',
              transition: 'all 0.2s ease',
              minHeight: '200px',
              padding: '2rem'
            }}
          >
            <Upload size={36} color={dragging ? "var(--accent-primary)" : "var(--text-secondary)"} style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>Upload a File</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.2rem 0 0 0' }}>Drag and drop files here</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.ppt,.pptx" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); }} />
          
          {file && (
            <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getFileIcon(file.name)}
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500, wordBreak: 'break-all' }}>{file.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{(file.size / 1024).toFixed(0)}KB</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setUploadProgress(0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}>
                    <X size={18} />
                  </button>
                </div>
              </div>
              {uploadProgress > 0 && (
                <div>
                  <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--success)', borderRadius: '99px', transition: 'width 0.3s ease' }} />
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', textAlign: 'right', margin: 0 }}>{uploadProgress}%</p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ 
                width: '100%', 
                marginTop: '1.5rem',
                padding: '1rem',
                opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Submitting & Encrypting...' : 'Submit Form'}
          </button>

        </div>
        
      </form>
    </div>
  );
}
