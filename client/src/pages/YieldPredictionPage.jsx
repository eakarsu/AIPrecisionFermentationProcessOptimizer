import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FiTrendingUp, FiTarget } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const confidenceColors = { high: 'bg-green-100 text-green-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-red-100 text-red-800' };

export default function YieldPredictionPage() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/batches?limit=100').then(r => setBatches(r.data || [])).catch(() => {});
  }, []);

  const runPrediction = async () => {
    if (!selectedBatch) return setError('Please select a batch');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.post(`/ai/batches/${selectedBatch}/ai-yield-predict`, {});
      setResult(data);
    } catch (err) {
      setError(err.message || 'Yield prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;

  const probData = parsed?.probability_distribution?.map(p => ({
    yield: `${p.yield_pct_of_target}%`,
    probability: Math.round(p.probability * 100),
  })) || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FiTrendingUp className="text-2xl text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yield Predictor</h1>
          <p className="text-sm text-gray-500">AI-powered fermentation yield forecasting</p>
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
        <button onClick={runPrediction} disabled={loading || !selectedBatch} className="btn-primary flex items-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiTrendingUp />}
          {loading ? 'Predicting...' : 'Predict Yield'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is predicting yield...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-5">
          {/* Main prediction */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <FiTarget className="text-blue-600" />
                <p className="text-sm font-medium text-gray-600">Predicted Yield</p>
              </div>
              <p className="text-3xl font-bold text-blue-700">
                {parsed.predicted_yield?.value} <span className="text-lg">{parsed.predicted_yield?.unit}</span>
              </p>
              {parsed.confidence && (
                <span className={`mt-2 inline-block px-2 py-0.5 rounded text-xs font-medium ${confidenceColors[parsed.confidence] || 'bg-gray-100 text-gray-700'}`}>
                  {parsed.confidence} confidence
                </span>
              )}
            </div>

            <div className="card p-5 sm:col-span-2">
              <p className="text-sm font-medium text-gray-600 mb-2">Yield Range</p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Low</p>
                  <p className="text-2xl font-bold text-orange-600">{parsed.yield_range?.low}</p>
                </div>
                <div className="flex-1 h-3 bg-gradient-to-r from-orange-200 via-blue-300 to-green-200 rounded-full" />
                <div className="text-center">
                  <p className="text-xs text-gray-400">High</p>
                  <p className="text-2xl font-bold text-green-600">{parsed.yield_range?.high}</p>
                </div>
                <div className="text-sm text-gray-400">{parsed.yield_range?.unit}</div>
              </div>
            </div>
          </div>

          {/* Probability distribution */}
          {probData.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Probability Distribution</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={probData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="yield" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                    {probData.map((_, i) => (
                      <Cell key={i} fill={i === Math.floor(probData.length / 2) ? '#3b82f6' : '#93c5fd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Key factors */}
          {parsed.key_factors?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Factors</h2>
              <div className="space-y-2">
                {parsed.key_factors.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 ${
                      f.impact === 'positive' ? 'bg-green-100 text-green-800' :
                      f.impact === 'negative' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                    }`}>{f.impact}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{f.factor}</p>
                      <p className="text-xs text-gray-500">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Harvest recommendation */}
          {parsed.harvest_recommendation && (
            <div className="card p-4 bg-blue-50 border-blue-200">
              <h2 className="text-sm font-semibold text-blue-800 mb-1">Harvest Recommendation</h2>
              <p className="text-sm text-blue-700">{parsed.harvest_recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
