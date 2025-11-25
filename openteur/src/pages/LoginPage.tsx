import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../services/AuthService';

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
    <div className="container mt-5">
      <h2>Login</h2>
      <form onSubmit={handleLogin} style={{ maxWidth: '400px', margin: '0 auto' }}>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="mb-3">
          <label>Email:</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
          />
        </div>
        <div className="mb-3">
          <label>Password:</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="admin123"
          />
        </div>
        <button className="btn btn-primary w-100" type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
