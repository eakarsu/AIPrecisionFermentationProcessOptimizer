import React, { useState } from 'react';
import { FiZap, FiCpu, FiTrendingUp, FiTool, FiBookOpen, FiFileText, FiBarChart2, FiMaximize, FiSend } from 'react-icons/fi';
import { api } from '../api';
import AIResponseDisplay from '../components/AIResponseDisplay';
import { useToast } from '../components/Toast';

const aiFeatures = [
  { id: 'general-analysis', icon: FiZap, label: 'General Analysis', desc: 'Get AI-powered analysis of any fermentation topic', color: '#3b82f6', placeholder: 'Ask anything about precision fermentation...' },
  { id: 'process-optimization', icon: FiCpu, label: 'Process Optimization', desc: 'Optimize fermentation process parameters', color: '#10b981', placeholder: 'Describe your process parameters to optimize...' },
  { id: 'predictive-modeling', icon: FiTrendingUp, label: 'Predictive Modeling', desc: 'Predict outcomes based on your parameters', color: '#8b5cf6', placeholder: 'Enter parameters for yield/growth prediction...' },
  { id: 'troubleshooting', icon: FiTool, label: 'Troubleshooting', desc: 'Diagnose and solve fermentation issues', color: '#ef4444', placeholder: 'Describe the issue you are experiencing...' },
  { id: 'literature-search', icon: FiBookOpen, label: 'Literature Search', desc: 'Find relevant research and publications', color: '#f59e0b', placeholder: 'What research topic are you interested in?' },
  { id: 'protocol-generator', icon: FiFileText, label: 'Protocol Generator', desc: 'Generate detailed fermentation protocols', color: '#ec4899', placeholder: 'Describe the protocol you need (organism, product, scale)...' },
  { id: 'data-interpreter', icon: FiBarChart2, label: 'Data Interpreter', desc: 'Interpret experimental data and results', color: '#06b6d4', placeholder: 'Paste your experimental data or describe results...' },
  { id: 'scale-up-advisor', icon: FiMaximize, label: 'Scale-Up Advisor', desc: 'Get advice on scaling up production', color: '#f97316', placeholder: 'Describe your current scale and target scale...' },
];

export default function AICenterPage() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!prompt.trim() || !selectedFeature) return;
    setLoading(true);
    setResponse('');
    try {
      const data = await api.post(`/ai/${selectedFeature.id}`, { prompt, context: '' });
      setResponse(data.analysis || data.result || JSON.stringify(data));
    } catch {
      showToast('AI analysis failed. Check your API key.', 'error');
      setResponse('Analysis failed. Please verify your OpenRouter API key in the .env file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feature-page">
      <div className="page-header">
        <h1><FiZap style={{ color: '#10b981' }} /> AI Center</h1>
        <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>All AI-powered fermentation tools in one place</p>
      </div>

      <div className="ai-center-grid">
        {aiFeatures.map(feature => (
          <div
            key={feature.id}
            className={`ai-feature-card ${selectedFeature?.id === feature.id ? 'ai-feature-card--active' : ''}`}
            onClick={() => { setSelectedFeature(feature); setResponse(''); }}
            style={{ '--accent': feature.color }}
          >
            <div className="ai-feature-icon" style={{ background: `${feature.color}22`, color: feature.color }}>
              <feature.icon size={28} />
            </div>
            <h3>{feature.label}</h3>
            <p>{feature.desc}</p>
          </div>
        ))}
      </div>

      {selectedFeature && (
        <div className="ai-prompt-section" style={{ marginTop: '2rem' }}>
          <div className="ai-prompt-card">
            <div className="ai-prompt-header">
              <selectedFeature.icon size={20} style={{ color: selectedFeature.color }} />
              <h3>{selectedFeature.label}</h3>
            </div>
            <div className="ai-prompt-body">
              <textarea
                className="form-textarea"
                rows={4}
                placeholder={selectedFeature.placeholder}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit(); }}
              />
              <button className="btn btn-success" onClick={handleSubmit} disabled={loading || !prompt.trim()} style={{ marginTop: '1rem' }}>
                <FiSend size={16} /> {loading ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
            </div>
          </div>

          {(loading || response) && (
            <div style={{ marginTop: '1.5rem' }}>
              <AIResponseDisplay response={response} loading={loading} title={`${selectedFeature.label} Results`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
