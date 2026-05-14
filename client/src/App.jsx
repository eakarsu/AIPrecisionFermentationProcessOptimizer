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
import TelemetryPage from './pages/TelemetryPage';
import AIHistoryPage from './pages/AIHistoryPage';
import LoginPage from './pages/LoginPage';
import SensorDashboardPage from './pages/SensorDashboardPage';
import OptimizationPage from './pages/OptimizationPage';
import ContaminationRiskPage from './pages/ContaminationRiskPage';
import YieldPredictionPage from './pages/YieldPredictionPage';
import SOPGeneratorPage from './pages/SOPGeneratorPage';
import BatchComparisonPage from './pages/BatchComparisonPage';
import StrainPerformancePredictPage from './pages/StrainPerformancePredictPage';
import QualityAnomalyDetectPage from './pages/QualityAnomalyDetectPage';

// // === Batch 06 Gaps & Frontend Mounts ===
import CFAgenticProcessOptimizationPage from './pages/CFAgenticProcessOptimizationPage';
import CFContaminationRiskEarlyWarningPage from './pages/CFContaminationRiskEarlyWarningPage';
import CFScaleUpProtocolGeneratorPage from './pages/CFScaleUpProtocolGeneratorPage';
import CFMediaOptimizationEnsemblePage from './pages/CFMediaOptimizationEnsemblePage';
import CFCrossBatchLearningPage from './pages/CFCrossBatchLearningPage';
import GapStrainsWithoutStrainPage from './pages/GapStrainsWithoutStrainPage';
import GapQualityWithoutQualityPage from './pages/GapQualityWithoutQualityPage';
import GapCostsWithoutCostPage from './pages/GapCostsWithoutCostPage';
import GapNoRealScadaIndustrialIotIntegrationOnlyManuPage from './pages/GapNoRealScadaIndustrialIotIntegrationOnlyManuPage';
import GapNoIntegrationWithAnalyticalLabsHplcMassSpecPage from './pages/GapNoIntegrationWithAnalyticalLabsHplcMassSpecPage';
import GapNoIntegrationWithDownstreamProcessingPurificaPage from './pages/GapNoIntegrationWithDownstreamProcessingPurificaPage';
import GapLimitedRegulatoryDocumentationCgmpFdaComplianPage from './pages/GapLimitedRegulatoryDocumentationCgmpFdaComplianPage';
import GapNoWebhooksForAlertDeliveryPage from './pages/GapNoWebhooksForAlertDeliveryPage';
import GapNoMobileAppForOperatorsPage from './pages/GapNoMobileAppForOperatorsPage';
import GapLimitedNotificationsLayerPage from './pages/GapLimitedNotificationsLayerPage';
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
              <Route path="/telemetry" element={<TelemetryPage />} />
              <Route path="/ai-history" element={<AIHistoryPage />} />
              <Route path="/sensor-dashboard" element={<SensorDashboardPage />} />
              <Route path="/optimization" element={<OptimizationPage />} />
              <Route path="/contamination-risk" element={<ContaminationRiskPage />} />
              <Route path="/yield-prediction" element={<YieldPredictionPage />} />
              <Route path="/sop-generator" element={<SOPGeneratorPage />} />
              <Route path="/batch-comparison" element={<BatchComparisonPage />} />
              <Route path="/strain-performance-predict" element={<StrainPerformancePredictPage />} />
              <Route path="/quality-anomaly-detect" element={<QualityAnomalyDetectPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            
          {/* // === Batch 06 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-process-optimization" element={<CFAgenticProcessOptimizationPage />} />
          <Route path="/cf-contamination-risk-early-warning" element={<CFContaminationRiskEarlyWarningPage />} />
          <Route path="/cf-scale-up-protocol-generator" element={<CFScaleUpProtocolGeneratorPage />} />
          <Route path="/cf-media-optimization-ensemble" element={<CFMediaOptimizationEnsemblePage />} />
          <Route path="/cf-cross-batch-learning" element={<CFCrossBatchLearningPage />} />
          <Route path="/gap-strains-without-strain" element={<GapStrainsWithoutStrainPage />} />
          <Route path="/gap-quality-without-quality" element={<GapQualityWithoutQualityPage />} />
          <Route path="/gap-costs-without-cost" element={<GapCostsWithoutCostPage />} />
          <Route path="/gap-no-real-scada-industrial-iot-integration-only-manu" element={<GapNoRealScadaIndustrialIotIntegrationOnlyManuPage />} />
          <Route path="/gap-no-integration-with-analytical-labs-hplc-mass-spec" element={<GapNoIntegrationWithAnalyticalLabsHplcMassSpecPage />} />
          <Route path="/gap-no-integration-with-downstream-processing-purifica" element={<GapNoIntegrationWithDownstreamProcessingPurificaPage />} />
          <Route path="/gap-limited-regulatory-documentation-cgmp-fda-complian" element={<GapLimitedRegulatoryDocumentationCgmpFdaComplianPage />} />
          <Route path="/gap-no-webhooks-for-alert-delivery" element={<GapNoWebhooksForAlertDeliveryPage />} />
          <Route path="/gap-no-mobile-app-for-operators" element={<GapNoMobileAppForOperatorsPage />} />
          <Route path="/gap-limited-notifications-layer" element={<GapLimitedNotificationsLayerPage />} />
        </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
