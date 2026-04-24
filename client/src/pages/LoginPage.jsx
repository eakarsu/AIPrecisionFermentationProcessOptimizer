import React, { useState } from 'react';
import { FiActivity, FiMail, FiLock } from 'react-icons/fi';
import { login } from '../api';
import { useToast } from '../components/Toast';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      onLogin(data);
      showToast('Welcome back!', 'success');
    } catch {
      showToast('Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@fermentation.ai');
    setPassword('password123');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <FiActivity size={48} className="login-icon" />
          <h1>AI Fermentation</h1>
          <p>Precision Process Optimizer</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label"><FiMail size={14} /> Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label className="form-label"><FiLock size={14} /> Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <button className="btn btn-secondary" onClick={fillDemo} style={{ width: '100%', marginTop: '0.75rem' }}>
          Fill Demo Credentials
        </button>
      </div>
    </div>
  );
}
