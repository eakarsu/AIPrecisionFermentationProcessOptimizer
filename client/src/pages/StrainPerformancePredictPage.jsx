import React, { useState } from 'react';
import { api } from '../api';
import { FiTrendingUp, FiTarget, FiAlertOctagon } from 'react-icons/fi';

export default function StrainPerformancePredictPage() {
  const [form, setForm] = useState({
    strain_name: '',
    organism_type: '',
    target_product: '',
    media: '',
    temperature_c: '',
    ph: '',
    notes: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        strain_name: form.strain_name,
        organism_type: form.organism_type || undefined,
        target_product: form.target_product || undefined,
        conditions: {
          media: form.media || undefined,
          temperature_c: form.temperature_c ? Number(form.temperature_c) : undefined,
          pH: form.ph ? Number(form.ph) : undefined,
        },
        notes: form.notes || undefined,
      };
      const data = await api.post('/ai/strain-performance-predict', payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FiTrendingUp className="text-2xl text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Strain Performance Predictor</h1>
          <p className="text-sm text-gray-500">
            AI-predicted growth, yield, titer, stress response and risks
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strain Name *</label>
            <input
              required
              className="input-field"
              value={form.strain_name}
              onChange={(e) => setForm({ ...form, strain_name: e.target.value })}
              placeholder="e.g., E. coli BL21(DE3)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organism Type</label>
            <input
              className="input-field"
              value={form.organism_type}
              onChange={(e) => setForm({ ...form, organism_type: e.target.value })}
              placeholder="bacteria, yeast, fungi..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Product</label>
            <input
              className="input-field"
              value={form.target_product}
              onChange={(e) => setForm({ ...form, target_product: e.target.value })}
              placeholder="recombinant protein, lactic acid..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Media</label>
            <input
              className="input-field"
              value={form.media}
              onChange={(e) => setForm({ ...form, media: e.target.value })}
              placeholder="e.g., LB, YPD, defined-media"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              value={form.temperature_c}
              onChange={(e) => setForm({ ...form, temperature_c: e.target.value })}
              placeholder="37"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              value={form.ph}
              onChange={(e) => setForm({ ...form, ph: e.target.value })}
              placeholder="7.0"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={3}
            className="input-field"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional context, prior batches, scaleup details..."
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FiTrendingUp />
          )}
          {loading ? 'Predicting...' : 'Predict Performance'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is analyzing your strain...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {parsed.growth_rate !== undefined && (
              <div className="card p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Growth Rate</p>
                <p className="text-2xl font-bold text-purple-700">
                  {typeof parsed.growth_rate === 'object'
                    ? JSON.stringify(parsed.growth_rate)
                    : parsed.growth_rate}
                </p>
              </div>
            )}
            {parsed.yield !== undefined && (
              <div className="card p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Yield</p>
                <p className="text-2xl font-bold text-blue-700">
                  {typeof parsed.yield === 'object' ? JSON.stringify(parsed.yield) : parsed.yield}
                </p>
              </div>
            )}
            {parsed.titer !== undefined && (
              <div className="card p-4">
                <p className="text-xs text-gray-500 uppercase font-medium">Titer</p>
                <p className="text-2xl font-bold text-green-700">
                  {typeof parsed.titer === 'object' ? JSON.stringify(parsed.titer) : parsed.titer}
                </p>
              </div>
            )}
          </div>

          {parsed.fermentation_time && (
            <div className="card p-4 bg-blue-50 border-blue-200">
              <h2 className="text-sm font-semibold text-blue-800 mb-1">
                <FiTarget className="inline mr-2" />
                Fermentation Time
              </h2>
              <p className="text-sm text-blue-700">
                {typeof parsed.fermentation_time === 'object'
                  ? JSON.stringify(parsed.fermentation_time)
                  : parsed.fermentation_time}
              </p>
            </div>
          )}

          {parsed.stress_response && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-1">Stress Response</h2>
              <p className="text-sm text-gray-700">
                {typeof parsed.stress_response === 'object'
                  ? JSON.stringify(parsed.stress_response)
                  : parsed.stress_response}
              </p>
            </div>
          )}

          {parsed.risks?.length > 0 && (
            <div className="card p-4 bg-red-50 border-red-200">
              <h2 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1">
                <FiAlertOctagon /> Risks
              </h2>
              <ul className="text-sm text-red-700 space-y-1 list-disc pl-5">
                {parsed.risks.map((r, i) => (
                  <li key={i}>{typeof r === 'string' ? r : JSON.stringify(r)}</li>
                ))}
              </ul>
            </div>
          )}

          <details className="card p-3">
            <summary className="cursor-pointer text-sm text-gray-500">Raw response</summary>
            <pre className="text-xs overflow-auto mt-2">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
