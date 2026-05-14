import React, { useState } from 'react';
import { api } from '../api';
import { FiFileText, FiDownload, FiCheckCircle, FiAlertOctagon } from 'react-icons/fi';

export default function SOPGeneratorPage() {
  const [form, setForm] = useState({
    product_type: '',
    batch_size: '',
    target_temperature: '',
    target_ph: '',
    target_do: '',
    target_yield: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        product_type: form.product_type,
        batch_size: parseFloat(form.batch_size),
        target_parameters: {
          temperature: form.target_temperature || undefined,
          pH: form.target_ph || undefined,
          dissolved_oxygen: form.target_do || undefined,
          yield: form.target_yield || undefined,
        },
      };
      const data = await api.post('/ai/generate-sop', payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'SOP generation failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;

  const downloadSOP = () => {
    if (!parsed) return;
    const text = JSON.stringify(parsed, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOP_${parsed.document_id || Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FiFileText className="text-2xl text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOP Generator</h1>
          <p className="text-sm text-gray-500">AI-generated standard operating procedures with CCPs</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Process Parameters</h2>
        <form onSubmit={handleGenerate}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Type <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.product_type}
                onChange={e => setForm({ ...form, product_type: e.target.value })}
                className="input-field"
                placeholder="e.g., Recombinant protein, Lactic acid, Ethanol..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size (L) <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min="1"
                value={form.batch_size}
                onChange={e => setForm({ ...form, batch_size: e.target.value })}
                className="input-field"
                placeholder="e.g., 500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Temperature (°C)</label>
              <input type="text" value={form.target_temperature} onChange={e => setForm({ ...form, target_temperature: e.target.value })} className="input-field" placeholder="e.g., 37" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target pH</label>
              <input type="text" value={form.target_ph} onChange={e => setForm({ ...form, target_ph: e.target.value })} className="input-field" placeholder="e.g., 7.0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Dissolved O₂ (%)</label>
              <input type="text" value={form.target_do} onChange={e => setForm({ ...form, target_do: e.target.value })} className="input-field" placeholder="e.g., 30" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiFileText />}
            {loading ? 'Generating SOP...' : 'Generate SOP'}
          </button>
        </form>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is generating your SOP...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-5">
          {/* Header */}
          <div className="card p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{parsed.sop_title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>Doc ID: <strong className="text-gray-700">{parsed.document_id}</strong></span>
                  <span>Version: <strong className="text-gray-700">{parsed.version}</strong></span>
                </div>
              </div>
              <button onClick={downloadSOP} className="btn-secondary flex items-center gap-2 text-sm">
                <FiDownload /> Export JSON
              </button>
            </div>
          </div>

          {/* Sections */}
          {parsed.sections?.map((section, i) => (
            <div key={i} className="card p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
              <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">{section.content}</p>
              {section.critical_control_points?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <FiAlertOctagon /> Critical Control Points
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-red-50">
                          <th className="px-3 py-2 text-left font-semibold text-red-700">CCP</th>
                          <th className="px-3 py-2 text-left font-semibold text-red-700">Critical Limit</th>
                          <th className="px-3 py-2 text-left font-semibold text-red-700">Monitoring</th>
                          <th className="px-3 py-2 text-left font-semibold text-red-700">Corrective Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {section.critical_control_points.map((ccp, j) => (
                          <tr key={j}>
                            <td className="px-3 py-2 font-medium text-gray-900">{ccp.ccp}</td>
                            <td className="px-3 py-2 text-gray-700">{ccp.critical_limit}</td>
                            <td className="px-3 py-2 text-gray-600">{ccp.monitoring}</td>
                            <td className="px-3 py-2 text-gray-600">{ccp.corrective_action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Equipment */}
          {parsed.required_equipment?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Equipment</h3>
              <div className="flex flex-wrap gap-2">
                {parsed.required_equipment.map((eq, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{eq}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quality checkpoints */}
          {parsed.quality_checkpoints?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality Checkpoints</h3>
              <div className="space-y-2">
                {parsed.quality_checkpoints.map((qc, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{qc.checkpoint}</p>
                      <p className="text-xs text-gray-500">Criteria: {qc.acceptance_criteria} | Frequency: {qc.frequency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety */}
          {parsed.safety_requirements?.length > 0 && (
            <div className="card p-5 bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">Safety Requirements</h3>
              <ul className="space-y-1">
                {parsed.safety_requirements.map((req, i) => (
                  <li key={i} className="text-sm text-yellow-800 flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span> {req}
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
