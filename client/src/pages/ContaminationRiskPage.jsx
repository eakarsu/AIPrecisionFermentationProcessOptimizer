import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FiAlertTriangle, FiShield, FiCheckCircle } from 'react-icons/fi';

const riskColors = {
  low: { bg: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800', text: 'text-green-700' },
  medium: { bg: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', text: 'text-yellow-700' },
  high: { bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-800', text: 'text-orange-700' },
  critical: { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800', text: 'text-red-700' },
};

export default function ContaminationRiskPage() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/batches?limit=100').then(r => setBatches(r.data || [])).catch(() => {});
  }, []);

  const runCheck = async () => {
    if (!selectedBatch) return setError('Please select a batch');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.post(`/ai/batches/${selectedBatch}/ai-contamination-check`, {
        visual_inspection_notes: notes,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Contamination check failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;
  const risk = parsed?.contamination_risk?.toLowerCase();
  const colors = riskColors[risk] || riskColors.medium;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FiAlertTriangle className="text-2xl text-orange-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contamination Risk Detector</h1>
          <p className="text-sm text-gray-500">AI-powered contamination risk assessment</p>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
            <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className="input-field">
              <option value="">Choose a batch...</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visual Inspection Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input-field"
              placeholder="e.g., cloudiness, unusual color, sediment..."
            />
          </div>
        </div>
        <button onClick={runCheck} disabled={loading || !selectedBatch} className="btn-primary flex items-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiAlertTriangle />}
          {loading ? 'Analyzing...' : 'Run Contamination Check'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is analyzing contamination indicators...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-5">
          {/* Risk indicator */}
          <div className={`card p-6 border-2 ${colors.bg}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {risk === 'low' ? <FiShield className={`text-3xl ${colors.text}`} /> : <FiAlertTriangle className={`text-3xl ${colors.text}`} />}
                <div>
                  <p className="text-sm text-gray-500 font-medium">Contamination Risk</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${colors.badge}`}>
                    {parsed.contamination_risk?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>
              {parsed.confidence_score != null && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Confidence</p>
                  <p className="text-3xl font-bold text-gray-900">{parsed.confidence_score}%</p>
                </div>
              )}
            </div>
            {parsed.quarantine_recommended && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm font-medium">
                Quarantine Recommended — Isolate this batch immediately
              </div>
            )}
          </div>

          {/* Risk indicators */}
          {parsed.risk_indicators?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Risk Indicators</h2>
              <div className="space-y-2">
                {parsed.risk_indicators.map((ind, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${riskColors[ind.severity?.toLowerCase()] ? riskColors[ind.severity.toLowerCase()].badge : 'bg-gray-100 text-gray-700'}`}>
                      {ind.severity}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{ind.indicator}</p>
                      <p className="text-xs text-gray-500">{ind.evidence}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Probable contaminants */}
          {parsed.probable_contaminants?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Probable Contaminants</h2>
              <div className="space-y-2">
                {parsed.probable_contaminants.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{c.organism}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${c.likelihood}%` }} />
                      </div>
                      <span className="text-sm text-gray-600 w-10 text-right">{c.likelihood}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {parsed.recommended_actions?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommended Actions</h2>
              <ul className="space-y-2">
                {parsed.recommended_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
