import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FiBarChart2, FiArrowRight, FiStar } from 'react-icons/fi';

const priorityColors = { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' };

export default function BatchComparisonPage() {
  const [batches, setBatches] = useState([]);
  const [batch1, setBatch1] = useState('');
  const [batch2, setBatch2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/batches?limit=100').then(r => setBatches(r.data || [])).catch(() => {});
  }, []);

  const runComparison = async () => {
    if (!batch1 || !batch2) return setError('Please select two batches');
    if (batch1 === batch2) return setError('Please select two different batches');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.post('/ai/compare-batches', {
        batch_id_1: parseInt(batch1),
        batch_id_2: parseInt(batch2),
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Batch comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;
  const batch1Name = batches.find(b => String(b.id) === String(batch1))?.batch_name || `Batch ${batch1}`;
  const batch2Name = batches.find(b => String(b.id) === String(batch2))?.batch_name || `Batch ${batch2}`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FiBarChart2 className="text-2xl text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Comparison</h1>
          <p className="text-sm text-gray-500">AI-powered comparative analysis of two batches</p>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch 1</label>
            <select value={batch1} onChange={e => setBatch1(e.target.value)} className="input-field">
              <option value="">Select batch...</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
            </select>
          </div>
          <div className="flex justify-center">
            <div className="p-2 bg-gray-100 rounded-full text-gray-500">
              <FiArrowRight className="text-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch 2</label>
            <select value={batch2} onChange={e => setBatch2(e.target.value)} className="input-field">
              <option value="">Select batch...</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={runComparison} disabled={loading || !batch1 || !batch2} className="btn-primary flex items-center gap-2 mt-4">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiBarChart2 />}
          {loading ? 'Comparing...' : 'Compare Batches'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is performing comparative analysis...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-5">
          {/* Winner card */}
          {parsed.winner_batch_id && (
            <div className="card p-5 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <div className="flex items-center gap-3">
                <FiStar className="text-yellow-600 text-2xl" />
                <div>
                  <p className="text-sm text-gray-500">Winner</p>
                  <p className="text-xl font-bold text-gray-900">
                    {parsed.winner_batch_id == parseInt(batch1) ? batch1Name : batch2Name}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-700">{parsed.overall_comparison}</p>
            </div>
          )}

          {/* Scores */}
          {parsed.statistical_summary && (
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">{batch1Name}</p>
                <p className="text-3xl font-bold text-blue-600">{parsed.statistical_summary.batch_1_score}</p>
                <p className="text-xs text-gray-400">Score</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">{batch2Name}</p>
                <p className="text-3xl font-bold text-purple-600">{parsed.statistical_summary.batch_2_score}</p>
                <p className="text-xs text-gray-400">Score</p>
              </div>
              <div className="card p-3 col-span-2 text-sm text-gray-600 text-center">
                {parsed.statistical_summary.scoring_rationale}
              </div>
            </div>
          )}

          {/* Key differences */}
          {parsed.key_differences?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Differences</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Parameter</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{batch1Name}</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{batch2Name}</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsed.key_differences.map((d, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-medium text-gray-900">{d.parameter}</td>
                        <td className="px-4 py-3 text-gray-600">{d.batch_1_value}</td>
                        <td className="px-4 py-3 text-gray-600">{d.batch_2_value}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{d.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Success factors */}
          {parsed.success_factors?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Success Factors</h2>
              <ul className="space-y-2">
                {parsed.success_factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <FiStar className="text-yellow-500 flex-shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {parsed.improvement_recommendations?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Improvement Recommendations</h2>
              <div className="space-y-2">
                {parsed.improvement_recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 ${priorityColors[rec.priority] || 'bg-gray-100 text-gray-700'}`}>
                      {rec.priority}
                    </span>
                    <div>
                      <span className="text-xs text-blue-600 font-medium">
                        For: {rec.for_batch_id == parseInt(batch1) ? batch1Name : batch2Name}
                      </span>
                      <p className="text-sm text-gray-700">{rec.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
