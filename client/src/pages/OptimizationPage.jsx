import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FiZap, FiArrowRight, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi';

const priorityColors = { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' };

export default function OptimizationPage() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/batches?limit=100').then(r => setBatches(r.data || [])).catch(() => {});
  }, []);

  const runOptimization = async () => {
    if (!selectedBatch) return setError('Please select a batch');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.post(`/ai/batches/${selectedBatch}/ai-optimize`, {});
      setResult(data);
    } catch (err) {
      setError(err.message || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FiZap className="text-2xl text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Process Optimization</h1>
          <p className="text-sm text-gray-500">AI-driven recommendations for batch improvement</p>
        </div>
      </div>

      <div className="card p-4 mb-6 flex items-end gap-4 flex-wrap">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
          <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className="input-field">
            <option value="">Choose a batch...</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
          </select>
        </div>
        <button onClick={runOptimization} disabled={loading || !selectedBatch} className="btn-primary flex items-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiZap />}
          {loading ? 'Analyzing...' : 'Run AI Optimization'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is analyzing your batch data...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-6">
          {/* Expected yield impact */}
          {parsed.expected_yield_impact && (
            <div className="card p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <FiTrendingUp className="text-green-600 text-xl" />
                <h2 className="text-lg font-semibold text-green-900">Expected Yield Impact</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-4xl font-bold text-green-600">
                  +{parsed.expected_yield_impact.improvement_pct}%
                </div>
                <div>
                  <div className="text-sm font-medium text-green-800">
                    Confidence: <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[parsed.expected_yield_impact.confidence] || 'bg-gray-100 text-gray-700'}`}>{parsed.expected_yield_impact.confidence}</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">{parsed.expected_yield_impact.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {parsed.recommendations?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h2>
              <div className="space-y-3">
                {parsed.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 ${priorityColors[rec.priority] || 'bg-gray-100 text-gray-700'}`}>
                      {rec.priority}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{rec.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parameter adjustments */}
          {parsed.parameter_adjustments?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Parameter Adjustments</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Parameter</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Current</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase"></th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Recommended</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsed.parameter_adjustments.map((adj, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-medium text-gray-900">{adj.parameter}</td>
                        <td className="px-4 py-3 text-gray-600">{adj.current_value}</td>
                        <td className="px-4 py-3 text-center text-gray-400"><FiArrowRight /></td>
                        <td className="px-4 py-3 text-green-700 font-medium">{adj.recommended_value}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{adj.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw output fallback */}
          {!parsed.recommendations && result?.optimization && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">AI Analysis</h2>
              <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">{result.optimization}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
