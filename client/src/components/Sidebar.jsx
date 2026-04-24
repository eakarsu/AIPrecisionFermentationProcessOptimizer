import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiActivity,
  FiDatabase,
  FiBookOpen,
  FiCalendar,
  FiDroplet,
  FiCpu,
  FiThermometer,
  FiTrendingUp,
  FiDollarSign,
  FiCheckCircle,
  FiAlertTriangle,
  FiShield,
  FiZap,
  FiLogOut,
  FiMenu,
  FiX,
  FiUser,
} from 'react-icons/fi';

const navSections = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/', icon: FiHome, label: 'Dashboard' },
    ],
  },
  {
    label: 'PRODUCTION',
    items: [
      { to: '/processes', icon: FiActivity, label: 'Processes' },
      { to: '/strains', icon: FiDatabase, label: 'Strains' },
      { to: '/recipes', icon: FiBookOpen, label: 'Recipes' },
      { to: '/batches', icon: FiCalendar, label: 'Batches' },
    ],
  },
  {
    label: 'RESOURCES',
    items: [
      { to: '/nutrients', icon: FiDroplet, label: 'Nutrient Media' },
      { to: '/bioreactors', icon: FiCpu, label: 'Bioreactors' },
      { to: '/environment', icon: FiThermometer, label: 'Environment' },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { to: '/yields', icon: FiTrendingUp, label: 'Yield Predictions' },
      { to: '/costs', icon: FiDollarSign, label: 'Cost Analysis' },
    ],
  },
  {
    label: 'QUALITY & SAFETY',
    items: [
      { to: '/quality', icon: FiCheckCircle, label: 'Quality Assurance' },
      { to: '/contamination', icon: FiAlertTriangle, label: 'Contamination' },
      { to: '/compliance', icon: FiShield, label: 'Compliance' },
    ],
  },
];

const aiItem = { to: '/ai-center', icon: FiZap, label: 'AI Center' };

function Sidebar({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobile} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FiActivity size={28} />
            <div>
              <h1 className="sidebar-title">AI Fermentation</h1>
              <p className="sidebar-subtitle">Process Optimizer</p>
            </div>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              <FiUser size={18} />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name || 'User'}</span>
              <span className="sidebar-user-email">{user.email || ''}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.label} className="sidebar-section">
              <span className="sidebar-section-label">{section.label}</span>
              {section.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`sidebar-link ${isActive(item.to) ? 'sidebar-link--active' : ''}`}
                  onClick={closeMobile}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}

          {/* AI Center with special styling */}
          <div className="sidebar-section">
            <span className="sidebar-section-label">AI TOOLS</span>
            <Link
              to={aiItem.to}
              className={`sidebar-link sidebar-link--ai ${isActive(aiItem.to) ? 'sidebar-link--active' : ''}`}
              onClick={closeMobile}
            >
              <FiZap size={18} />
              <span>{aiItem.label}</span>
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={onLogout}>
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
