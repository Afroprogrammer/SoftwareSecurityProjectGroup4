import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, LayoutDashboard, MessageSquare } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
        <ShieldCheck color="var(--accent-primary)" />
        SecureApp
      </div>
      <div className="nav-links">
        <NavLink 
          to="/dashboard" 
          className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink 
          to="/feedback" 
          className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <MessageSquare size={18} /> Feedback
        </NavLink>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
