import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, ShieldAlert, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const navigate = useNavigate();

  React.useEffect(() => {
    let interval = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer(prev => {
          if (prev <= 1) {
             setError(''); // Clear error sequentially once lock is lifted
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // OAuth2 requires form data for login
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, new URLSearchParams({
        username: email,
        password: password
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.message === "Login successful") {
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/dashboard');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMessage = Array.isArray(detail) ? detail[0].msg : detail;
      
      // Intercept Lockout Exception Computationally
      if (err.response?.status === 403 && typeof errorMessage === 'string' && errorMessage.includes('Try again in')) {
        const match = errorMessage.match(/in (\d+) seconds/);
        if (match) {
           setLockoutTimer(parseInt(match[1], 10));
        }
      }
      
      setError(errorMessage || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="split-layout animate-fade-in">
      <div className="split-image-container">
        <div className="split-image-overlay">
          <h1>Secure Feedback System</h1>
          <p>A trusted channel for university feedback</p>
        </div>
      </div>
      <div className="split-form-container">
        <div className="split-form-wrapper">
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>Login your account</p>
          <h2>Welcome Back!</h2>
          <p style={{ marginBottom: '2rem', color: '#94a3b8' }}>Enter your email and password</p>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="form-input login-input"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="you@university.edu"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input login-input"
                  style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <div 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', display: 'flex' }}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff size={18} color="var(--text-secondary)" /> : <Eye size={18} color="var(--text-secondary)" />}
                </div>
              </div>
            </div>

            <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem', background: '#1e293b' }} disabled={isLoading || lockoutTimer > 0}>
              {isLoading ? 'Authenticating...' : (lockoutTimer > 0 ? `Locked Out (${lockoutTimer}s)` : 'Sign in')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
