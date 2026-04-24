import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { ToastProvider } from './components/Toast';
import { logout as doLogout } from './api';

// Lazy load pages
import Dashboard from './pages/Dashboard';
import ProcessesPage from './pages/ProcessesPage';
import StrainsPage from './pages/StrainsPage';
import NutrientsPage from './pages/NutrientsPage';
import YieldsPage from './pages/YieldsPage';
import ContaminationPage from './pages/ContaminationPage';
import EnvironmentPage from './pages/EnvironmentPage';
import BioreactorsPage from './pages/BioreactorsPage';
import QualityPage from './pages/QualityPage';
import RecipesPage from './pages/RecipesPage';
import BatchesPage from './pages/BatchesPage';
import CostsPage from './pages/CostsPage';
import CompliancePage from './pages/CompliancePage';
import AICenterPage from './pages/AICenterPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData.user);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData.user));
  };

  const handleLogout = () => {
    doLogout();
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <LoginPage onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar user={user} onLogout={handleLogout} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/processes" element={<ProcessesPage />} />
              <Route path="/strains" element={<StrainsPage />} />
              <Route path="/nutrients" element={<NutrientsPage />} />
              <Route path="/yields" element={<YieldsPage />} />
              <Route path="/contamination" element={<ContaminationPage />} />
              <Route path="/environment" element={<EnvironmentPage />} />
              <Route path="/bioreactors" element={<BioreactorsPage />} />
              <Route path="/quality" element={<QualityPage />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/batches" element={<BatchesPage />} />
              <Route path="/costs" element={<CostsPage />} />
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/ai-center" element={<AICenterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
