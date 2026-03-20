import React, { useState } from 'react';
import axios from 'axios';
import { Send, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const Feedback = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 2 * 1024 * 1024) {
        setStatus({ type: 'error', msg: 'File exceeds maximum size of 2MB.' });
        setFile(null);
        e.target.value = null; // Clear input
        return;
      }
      setFile(selected);
      setStatus({ type: '', msg: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', msg: '' });

    const token = localStorage.getItem('token');
    
    // Using FormData for file uploads natively
    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('message', message);
    if (file) {
      formData.append('file', file);
    }

    try {
      await axios.post('http://localhost:8000/feedback/', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setStatus({ type: 'success', msg: 'Feedback submitted successfully and securely!' });
      setSubject('');
      setMessage('');
      setFile(null);
      // Reset file input in DOM roughly via a form reset, or rely on state. Document.getElementById could work too.
      const fileInput = document.getElementById('secure-file-upload');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setStatus({ 
        type: 'error', 
        msg: err.response?.data?.detail || "Failed to submit feedback. Ensure file constraints are met." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <FileText size={32} color="var(--accent-primary)" />
          <div>
            <h2>Secure Feedback Submission</h2>
            <p style={{ margin: 0 }}>Report an issue securely. File uploads are strictly scanned and restricted.</p>
          </div>
        </div>

        {status.msg && (
          <div className={`alert ${status.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            {status.msg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              type="text"
              required
              maxLength={255}
              className="form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your report"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message Details</label>
            <textarea
              required
              maxLength={5000}
              rows={5}
              className="form-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue or provide feedback here safely... (Max 5000 chars)"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attachments (Optional)</label>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Allowed types: PDF, JPG, PNG, TXT. Max size: 2MB.
            </div>
            <input
              id="secure-file-upload"
              type="file"
              onChange={handleFileChange}
              className="form-input"
              accept=".pdf,.jpg,.jpeg,.png,.txt"
            />
          </div>

          <button type="submit" className="btn" disabled={isSubmitting}>
            <Send size={18} />
            {isSubmitting ? 'Transmitting securely...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
