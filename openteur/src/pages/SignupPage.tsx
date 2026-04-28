import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../services/api/apiClient';
import './SignupPage.css';

const SignupPage = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const missing: string[] = [];
    if (!displayName) missing.push('Name');
    if (!email) missing.push('Email');
    if (!password) missing.push('Password');
    if (!confirmPassword) missing.push('Confirm Password');

    if (missing.length > 0) {
      setError(`Please fill in the following fields: ${missing.join(', ')}`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await signUp(email, password);
      // Persist user info in MongoDB after Firebase account creation
      await apiRequest('/api/users/register', {
        method: 'POST',
        body: JSON.stringify({ displayName }),
      });
      navigate('/');
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err?.code === 'auth/weak-password') {
        setError('Password is too weak.');
      } else {
        setError('Could not create account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ct-signup-wrap">
      <div className="ct-signup-box">
        <div className="ct-signup-title">Create <span>Account</span></div>
        <p className="ct-signup-sub">Register to join the squad</p>
        <form onSubmit={handleSignup}>
          {error && <div className="ct-signup-error">{error}</div>}
          <div className="ct-signup-field">
            <label className="ct-signup-label">Name <span className="ct-signup-required">*</span></label>
            <input
              type="text"
              className="ct-signup-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="ct-signup-field">
            <label className="ct-signup-label">Email <span className="ct-signup-required">*</span></label>
            <input
              type="email"
              className="ct-signup-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div className="ct-signup-field">
            <label className="ct-signup-label">Password <span className="ct-signup-required">*</span></label>
            <input
              type="password"
              className="ct-signup-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="ct-signup-field">
            <label className="ct-signup-label">Confirm Password <span className="ct-signup-required">*</span></label>
            <input
              type="password"
              className="ct-signup-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="ct-signup-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="ct-signup-login-link">
          Already have an account?{' '}
          <span onClick={() => navigate('/login')}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
