import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Shield, Users, Key, CheckCircle, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  
  // Password Change State
  const [passStatus, setPassStatus] = useState({ type: '', msg: '' });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Create User State (Admin Only)
  const [createUserStatus, setCreateUserStatus] = useState({ type: '', msg: '' });
  const [newEmail, setNewEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/auth/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user securely:', error);
      }
    };
    fetchUser();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassStatus({ type: '', msg: '' });
    
    if (newPassword.length < 12) {
      setPassStatus({ type: 'error', msg: 'New password must strictly be at least 12 characters.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/auth/change-password', 
        { old_password: oldPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPassStatus({ type: 'success', msg: 'Password securely changed.' });
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPassStatus({ type: 'error', msg: err.response?.data?.detail || 'Failed to change password.' });
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
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/auth/users', 
        { email: newEmail, password: newUserPassword, role: newUserRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreateUserStatus({ type: 'success', msg: `User ${newEmail} successfully provisioned.` });
      setNewEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
    } catch (err) {
      setCreateUserStatus({ type: 'error', msg: err.response?.data?.detail || 'Failed to allocate user.' });
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
            <input 
              type="password" 
              className="form-input" 
              required
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Secure Password</label>
            <input 
              type="password" 
              className="form-input" 
              required
              minLength={12}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn">Execute Rotation</button>
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

          <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
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
              <input 
                type="password" 
                className="form-input" 
                required
                minLength={12}
                value={newUserPassword}
                onChange={e => setNewUserPassword(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assign Policy Role</label>
              <select 
                className="form-input" 
                value={newUserRole}
                onChange={e => setNewUserRole(e.target.value)}
              >
                <option value="user">Standard User (Least Privilege)</option>
                <option value="admin">Administrator (Superuser)</option>
              </select>
            </div>
            <button type="submit" className="btn" style={{ height: '44px' }}>Provision Record</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
