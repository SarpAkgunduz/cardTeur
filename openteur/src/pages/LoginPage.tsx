import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import './LoginPage.css';
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await signIn(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setIsSubmitting(false);
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
          <button className="ct-login-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="ct-google-divider"><span>or</span></div>
        <GoogleSignInButton />
        <p className="ct-login-signup-link">
          Don't have an account?{' '}
          <span onClick={() => navigate('/signup')}>Sign Up</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
