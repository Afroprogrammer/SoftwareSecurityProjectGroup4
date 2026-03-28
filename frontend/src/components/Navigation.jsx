import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, UploadCloud } from 'lucide-react';
import axios from 'axios';

const Navigation = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/users/me`);
        setRole(response.data.role || null);
      } catch (e) {
        console.warn('Failed to securely fetch role context', e);
      }
    };
    fetchRole();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`);
    } catch(e) { console.error('Error logging out explicitly', e); }
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
        <ShieldCheck color="var(--accent-primary)" />
        LoremIpsum Secure
      </div>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {role === 'user' && (
          <NavLink
            to="/feedback"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '6px',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
              transition: 'color 0.2s',
            })}
          >
            <UploadCloud size={16} /> Upload
          </NavLink>
        )}
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
