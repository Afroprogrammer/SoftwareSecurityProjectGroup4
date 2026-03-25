import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="auth-container animate-fade-in">
      <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <AlertTriangle size={64} color="var(--error)" />
        </div>
        
        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.2rem', color: 'var(--text-primary)', letterSpacing: '4px' }}>404</h1>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Resource Unavailable</h2>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
          The requested route strictly violates registered domain policies or does not exist. 
          Your session integrity has been preserved. Please safely return to the Dashboard hub.
        </p>
        
        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', fontSize: '1.05rem' }}
        >
          <Home size={20} /> Back to Safety (Dashboard)
        </button>
      </div>
    </div>
  );
}
