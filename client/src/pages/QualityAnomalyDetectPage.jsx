import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FiAlertTriangle, FiActivity } from 'react-icons/fi';

function safeParseJSON(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export default function QualityAnomalyDetectPage() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [qcText, setQcText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/batches?limit=100')
      .then((r) => setBatches(r.data || r || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {};
      if (batchId) payload.batch_id = batchId;
      if (qcText.trim()) {
        const parsed = safeParseJSON(qcText.trim(), null);
        if (Array.isArray(parsed)) payload.qc_results = parsed;
        else payload.qc_text = qcText.trim();
      }
      const data = await api.post('/ai/quality-anomaly-detect', payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.parsed;
  const anomalies = parsed?.anomalies || parsed?.flagged || [];

  const severityClass = (sev) => {
    const s = String(sev || '').toLowerCase();
    if (s === 'critical' || s === 'high') return 'bg-red-100 text-red-800';
    if (s === 'medium') return 'bg-yellow-100 text-yellow-800';
    if (s === 'low') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FiAlertTriangle className="text-2xl text-orange-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Anomaly Detector</h1>
          <p className="text-sm text-gray-500">
            Flag QC anomalies with severity and corrective actions
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-4 mb-6 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch (optional)</label>
          <select
            className="input-field"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
          >
            <option value="">Choose a batch...</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_name || `Batch ${b.id}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            QC Results (JSON array or free text)
          </label>
          <textarea
            rows={6}
            className="input-field"
            value={qcText}
            onChange={(e) => setQcText(e.target.value)}
            placeholder='[{"metric":"OD600","value":4.2,"spec":"4.5-5.0"}, {"metric":"pH","value":5.8,"spec":"6.5-7.0"}]'
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FiActivity />
          )}
          {loading ? 'Detecting...' : 'Detect Anomalies'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-600 font-medium">AI is reviewing QC data...</p>
        </div>
      )}

      {parsed && !loading && (
        <div className="space-y-4">
          {anomalies.length === 0 ? (
            <div className="card p-4 bg-green-50 border-green-200">
              <p className="text-sm text-green-800 font-medium">No anomalies flagged.</p>
            </div>
          ) : (
            <div className="card p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Flagged Anomalies ({anomalies.length})
              </h2>
              <div className="space-y-2">
                {anomalies.map((a, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 rounded-lg flex flex-col sm:flex-row sm:items-start gap-2"
                  >
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${severityClass(
                        a.severity
                      )}`}
                    >
                      {a.severity || 'unknown'}
                    </span>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-gray-900">
                        {a.metric || a.parameter || a.name || `Anomaly ${i + 1}`}
                      </p>
                      {a.description && <p className="text-gray-600">{a.description}</p>}
                      {a.value !== undefined && (
                        <p className="text-xs text-gray-500">
                          Value: {String(a.value)}
                          {a.expected ? ` (expected ${a.expected})` : ''}
                          {a.spec ? ` (spec ${a.spec})` : ''}
                        </p>
                      )}
                      {a.corrective_action && (
                        <p className="text-xs text-blue-700 mt-1">
                          <strong>Action:</strong> {a.corrective_action}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsed.summary && (
            <div className="card p-4 bg-blue-50 border-blue-200">
              <h2 className="text-sm font-semibold text-blue-800 mb-1">Summary</h2>
              <p className="text-sm text-blue-700">
                {typeof parsed.summary === 'string' ? parsed.summary : JSON.stringify(parsed.summary)}
              </p>
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
