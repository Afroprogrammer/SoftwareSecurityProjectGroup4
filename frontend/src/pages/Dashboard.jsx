import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Shield, Users, Key, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  
  // Password Change State
  const [passStatus, setPassStatus] = useState({ type: '', msg: '' });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Change Password Toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Create User State (Admin Only)
  const [createUserStatus, setCreateUserStatus] = useState({ type: '', msg: '' });
  const [newEmail, setNewEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  // User Auditing State (Admin Only)
  const [auditUsers, setAuditUsers] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/users/me`);
        setUser(response.data);
        if (response.data.role === 'admin') {
          fetchAuditUsers();
        }
      } catch (error) {
        console.error('Failed to fetch user securely:', error);
      }
    };
    fetchUser();
  }, []);

  const fetchAuditUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/users`);
      setAuditUsers(response.data);
    } catch (e) { console.error('Failed to fetch user audit list', e); }
  };

  const handleToggleStatus = async (targetId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/auth/users/${targetId}/toggle-status`);
      fetchAuditUsers(); // Refresh the list
    } catch (e) {
      alert("Failed to toggle status: " + (e.response?.data?.detail || e.message));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassStatus({ type: '', msg: '' });
    
    if (newPassword.length < 12) {
      setPassStatus({ type: 'error', msg: 'New password must strictly be at least 12 characters.' });
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/change-password`, 
        { old_password: oldPassword, new_password: newPassword }
      );
      setPassStatus({ type: 'success', msg: 'Password securely changed.' });
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMessage = Array.isArray(detail) ? detail[0].msg : detail;
      setPassStatus({ type: 'error', msg: errorMessage || 'Failed to change password.' });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserStatus({ type: '', msg: '' });
    
    if (newUserPassword.length < 12) {
      setCreateUserStatus({ type: 'error', msg: 'Password must be at least 12 characters.' });
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/users`, 
        { email: newEmail, password: newUserPassword, role: "user" }
      );
      setCreateUserStatus({ type: 'success', msg: `User ${newEmail} successfully provisioned.` });
      setNewEmail('');
      setNewUserPassword('');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMessage = Array.isArray(detail) ? detail[0].msg : detail;
      setCreateUserStatus({ type: 'error', msg: errorMessage || 'Failed to allocate user.' });
    }
  };

  if (!user) {
    return <div className="container"><p>Accessing Secure Space...</p></div>;
  }

  return (
    <div className="container animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
      
      {/* Profile Section */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <User size={32} color="var(--accent-primary)" />
          <div>
            <h2 style={{ marginBottom: 0 }}>System Identity</h2>
            <p style={{ margin: 0 }}>Current Session Details</p>
          </div>
        </div>
        
        <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Authenticated Entity</div>
          <div style={{ fontWeight: '500', fontSize: '1.1rem' }}>{user.email}</div>
        </div>
        
        <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} color={user.role === 'admin' ? 'var(--warning)' : 'var(--success)'} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Access Privileges:</span>
          <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{user.role}</span>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <Key size={32} color="var(--accent-primary)" />
          <div>
            <h2 style={{ marginBottom: 0 }}>Credential Rotation</h2>
            <p style={{ margin: 0 }}>Enforced 12-char minimum policy.</p>
          </div>
        </div>

        {passStatus.msg && (
          <div className={`alert ${passStatus.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {passStatus.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            {passStatus.msg}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showOldPassword ? "text" : "password"} 
                className="form-input" 
                style={{ width: '100%', paddingRight: '2.5rem' }}
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
              />
              <div 
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex' }}
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <EyeOff size={18} color="var(--text-secondary)" /> : <Eye size={18} color="var(--text-secondary)" />}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">New Secure Password</label>
            <div style={{ position: 'relative', marginBottom: '4px' }}>
              <input 
                type={showNewPassword ? "text" : "password"} 
                className="form-input" 
                style={{ width: '100%', paddingRight: '2.5rem' }}
                required
                minLength={12}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <div 
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex' }}
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} color="var(--text-secondary)" /> : <Eye size={18} color="var(--text-secondary)" />}
              </div>
            </div>
            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
              Password Policy: Min 12 chars. Upper, lower, number, special char.
            </small>
          </div>
          <button type="submit" className="btn">Change Password</button>
        </form>
      </div>

      {/* RBAC: Admin Space */}
      {user.role === 'admin' && (
        <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Users size={32} color="var(--warning)" />
            <div>
              <h2 style={{ marginBottom: 0 }}>Administrative Provisioning</h2>
              <p style={{ margin: 0 }}>Role-Based Access Control strict boundary for User additions.</p>
            </div>
          </div>

          {createUserStatus.msg && (
            <div className={`alert ${createUserStatus.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {createUserStatus.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
              {createUserStatus.msg}
            </div>
          )}

          <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'start' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Context</label>
              <input 
                type="email" 
                className="form-input" 
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Initial Credential</label>
              <div style={{ position: 'relative', marginBottom: '4px' }}>
                <input 
                  type={showNewUserPassword ? "text" : "password"} 
                  className="form-input" 
                  style={{ width: '100%', paddingRight: '2.5rem' }}
                  required
                  minLength={12}
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                />
                <div 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex' }}
                  onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                >
                  {showNewUserPassword ? <EyeOff size={18} color="var(--text-secondary)" /> : <Eye size={18} color="var(--text-secondary)" />}
                </div>
              </div>
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Policy: Min 12 chars. Must contain uppercase, lowercase, number, and special character.
              </small>
            </div>
            <button type="submit" className="btn" style={{ height: '44px', marginTop: '28px' }}>Provision Record</button>
          </form>

          {/* User Audit Table */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Account Lifecycle Audit</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem' }}>ID</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem' }}>{u.id}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 500 }}>{u.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: u.role === 'admin' ? 'rgba(234, 179, 8, 0.1)' : 'var(--bg-primary)', color: u.role === 'admin' ? 'var(--warning)' : 'var(--text-primary)' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {u.is_active ? 
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}><CheckCircle size={14} /> Active</span> :
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--error)' }}><AlertCircle size={14} /> Suspended</span>
                        }
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <button 
                          onClick={() => handleToggleStatus(u.id)}
                          disabled={u.id === user.id}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            background: u.id === user.id ? 'var(--bg-primary)' : (u.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'),
                            color: u.id === user.id ? 'var(--text-secondary)' : (u.is_active ? 'var(--error)' : 'var(--success)'),
                            cursor: u.id === user.id ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          {u.id === user.id ? 'Protected' : (u.is_active ? 'Disable' : 'Enable')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
