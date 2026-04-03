import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../services/AuthService';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Dummy auth (replace with real backend logic later)
    if (email === 'admin@example.com' && password === 'admin123') {
      loginSuccess('admin');  // ← Give admin role
      navigate('/');
    } else if (email === 'user@example.com' && password === 'user123') {
      loginSuccess('user');   // ← Give user role
      navigate('/');
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="ct-login-wrap">
      <div className="ct-login-box">
        <div className="ct-login-title">Commander's <span>Console</span></div>
        <p className="ct-login-sub">Authenticate to proceed</p>
        <form onSubmit={handleLogin}>
          {error && <div className="ct-login-error">{error}</div>}
          <div className="ct-login-field">
            <label className="ct-login-label">Email</label>
            <input
              type="email"
              className="ct-login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className="ct-login-field">
            <label className="ct-login-label">Password</label>
            <input
              type="password"
              className="ct-login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="ct-login-btn" type="submit">Access System</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
