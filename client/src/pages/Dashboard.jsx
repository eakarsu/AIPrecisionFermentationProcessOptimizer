import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiDatabase, FiBookOpen, FiCalendar, FiDroplet, FiCpu, FiThermometer, FiTrendingUp, FiDollarSign, FiCheckCircle, FiAlertTriangle, FiShield, FiZap } from 'react-icons/fi';
import { api } from '../api';

const features = [
  { path: '/processes', icon: FiActivity, label: 'Processes', api: '/processes', color: '#3b82f6', desc: 'Monitor fermentation runs' },
  { path: '/strains', icon: FiDatabase, label: 'Strains', api: '/strains', color: '#8b5cf6', desc: 'Manage organism strains' },
  { path: '/recipes', icon: FiBookOpen, label: 'Recipes', api: '/recipes', color: '#ec4899', desc: 'Fermentation recipes' },
  { path: '/batches', icon: FiCalendar, label: 'Batches', api: '/batches', color: '#f59e0b', desc: 'Production scheduling' },
  { path: '/nutrients', icon: FiDroplet, label: 'Nutrient Media', api: '/nutrients', color: '#06b6d4', desc: 'Growth media management' },
  { path: '/bioreactors', icon: FiCpu, label: 'Bioreactors', api: '/bioreactors', color: '#10b981', desc: 'Bioreactor fleet' },
  { path: '/environment', icon: FiThermometer, label: 'Environment', api: '/environment', color: '#f97316', desc: 'Environmental controls' },
  { path: '/yields', icon: FiTrendingUp, label: 'Yields', api: '/yields', color: '#22c55e', desc: 'Yield predictions' },
  { path: '/costs', icon: FiDollarSign, label: 'Costs', api: '/costs', color: '#eab308', desc: 'Cost analysis' },
  { path: '/quality', icon: FiCheckCircle, label: 'Quality', api: '/quality', color: '#14b8a6', desc: 'Quality assurance' },
  { path: '/contamination', icon: FiAlertTriangle, label: 'Contamination', api: '/contamination', color: '#ef4444', desc: 'Contamination tracking' },
  { path: '/compliance', icon: FiShield, label: 'Compliance', api: '/compliance', color: '#6366f1', desc: 'Regulatory compliance' },
];

export default function Dashboard() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    features.forEach(async (f) => {
      try {
        const data = await api.get(f.api);
        setCounts(prev => ({ ...prev, [f.api]: Array.isArray(data) ? data.length : 0 }));
      } catch {}
    });
  }, []);

  return (
    <div className="feature-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/ai-center" className="btn btn-success"><FiZap size={16} /> AI Center</Link>
      </div>

      <div className="cards-grid">
        {features.map(f => (
          <Link key={f.path} to={f.path} className="card" style={{ textDecoration: 'none', borderLeftColor: f.color }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: `${f.color}22`, borderRadius: '12px', padding: '0.75rem', display: 'flex' }}>
                  <f.icon size={24} style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="card-title">{f.label}</h3>
                  <p className="card-subtitle">{f.desc}</p>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="card-metric" style={{ color: f.color }}>
                {counts[f.api] !== undefined ? counts[f.api] : '—'}
              </div>
              <p className="card-subtitle">Total Records</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
