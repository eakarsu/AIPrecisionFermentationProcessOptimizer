import React, { useState, useEffect } from 'react';
import { api } from '../api';

function TelemetryPage() {
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [anomalyResult, setAnomalyResult] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [jsonPaste, setJsonPaste] = useState('');
  const [manualForm, setManualForm] = useState({
    do_pct: '', ph: '', od600: '', agitation_rpm: '', temperature_c: '', dissolved_o2: '', co2_pct: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    api.get('/processes?limit=100').then(data => {
      const rows = data.data || data;
      setProcesses(Array.isArray(rows) ? rows : []);
    }).catch(() => {});
  }, []);

  const fetchReadings = async () => {
    if (!selectedProcess) return;
    setLoading(true);
    setError('');
    try {
      let url = `/telemetry/${selectedProcess}`;
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length) url += '?' + params.join('&');
      const data = await api.get(url);
      setReadings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch telemetry: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProcess) fetchReadings();
  }, [selectedProcess]);

  const handleDetectAnomalies = async () => {
    if (!selectedProcess) return;
    setDetecting(true);
    setAnomalyResult(null);
    setError('');
    try {
      const data = await api.post(`/telemetry/${selectedProcess}/detect-anomalies`, {});
      setAnomalyResult(data);
      fetchReadings();
    } catch (err) {
      setError('Anomaly detection failed: ' + err.message);
    } finally {
      setDetecting(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/telemetry/ingest', {
        process_id: parseInt(selectedProcess),
        readings: [manualForm],
      });
      setManualForm({ do_pct: '', ph: '', od600: '', agitation_rpm: '', temperature_c: '', dissolved_o2: '', co2_pct: '' });
      fetchReadings();
    } catch (err) {
      setError('Failed to ingest: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJsonSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const parsed = JSON.parse(jsonPaste);
      const readingsArr = Array.isArray(parsed) ? parsed : [parsed];
      await api.post('/telemetry/ingest', {
        process_id: parseInt(selectedProcess),
        readings: readingsArr,
      });
      setJsonPaste('');
      fetchReadings();
    } catch (err) {
      setError('Failed to ingest JSON: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const processOptions = Array.isArray(processes) ? processes : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Process Telemetry
        </h1>
        <p className="text-sm text-gray-500 mt-1">View real-time sensor readings and detect anomalies</p>
      </div>

      {/* Process Selector */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Process</label>
            <select
              value={selectedProcess}
              onChange={e => { setSelectedProcess(e.target.value); setAnomalyResult(null); }}
              className="input"
              style={{ minWidth: 200 }}
            >
              <option value="">-- Select a process --</option>
              {processOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
          </div>
          <button onClick={fetchReadings} disabled={!selectedProcess || loading} className="btn btn-primary">
            {loading ? 'Loading...' : 'Fetch Readings'}
          </button>
          {selectedProcess && (
            <>
              <button onClick={() => setShowForm(!showForm)} className="btn btn-secondary">
                {showForm ? 'Hide Form' : '+ Add Readings'}
              </button>
              <button
                onClick={handleDetectAnomalies}
                disabled={detecting || !selectedProcess}
                className="btn"
                style={{ background: 'var(--color-warning)', color: '#fff' }}
              >
                {detecting ? 'Detecting...' : 'Detect Anomalies'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="card p-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Data Entry Form */}
      {showForm && selectedProcess && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Telemetry Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Entry */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Manual Entry</h3>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                {Object.keys(manualForm).map(key => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{key.replace(/_/g, ' ').toUpperCase()}</label>
                    <input
                      type="number"
                      step="any"
                      value={manualForm[key]}
                      onChange={e => setManualForm({ ...manualForm, [key]: e.target.value })}
                      className="input"
                      placeholder={key}
                    />
                  </div>
                ))}
                <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                  {submitting ? 'Submitting...' : 'Submit Reading'}
                </button>
              </form>
            </div>

            {/* JSON Paste */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Batch JSON Paste</h3>
              <form onSubmit={handleJsonSubmit} className="space-y-3">
                <textarea
                  value={jsonPaste}
                  onChange={e => setJsonPaste(e.target.value)}
                  className="input font-mono text-sm"
                  rows={12}
                  placeholder={`[{"do_pct": 85.2, "ph": 7.1, "od600": 12.3, "agitation_rpm": 300, "temperature_c": 37.0, "dissolved_o2": 22.5, "co2_pct": 3.2}]`}
                />
                <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                  {submitting ? 'Submitting...' : 'Import JSON'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Anomaly Detection Result */}
      {anomalyResult && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Anomaly Detection Results</h2>
          <div className="flex gap-6 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{anomalyResult.total_readings}</div>
              <div className="text-xs text-gray-500">Total Readings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{anomalyResult.anomaly_count}</div>
              <div className="text-xs text-gray-500">Anomalies Found</div>
            </div>
          </div>
          {anomalyResult.ai_analysis && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">AI Analysis</h3>
              {anomalyResult.ai_analysis.raw ? (
                <pre className="text-xs text-amber-900 whitespace-pre-wrap">{anomalyResult.ai_analysis.raw}</pre>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div><span className="font-medium text-amber-800">Type:</span> {anomalyResult.ai_analysis.anomaly_type}</div>
                  <div><span className="font-medium text-amber-800">Severity:</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      anomalyResult.ai_analysis.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      anomalyResult.ai_analysis.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      anomalyResult.ai_analysis.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {anomalyResult.ai_analysis.severity}
                    </span>
                  </div>
                  <div className="md:col-span-2"><span className="font-medium text-amber-800">Probable Cause:</span> {anomalyResult.ai_analysis.probable_cause}</div>
                  {anomalyResult.ai_analysis.recommended_actions?.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-amber-800">Recommended Actions:</span>
                      <ul className="mt-1 list-disc list-inside text-amber-900 text-xs space-y-1">
                        {anomalyResult.ai_analysis.recommended_actions.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Telemetry Table */}
      {selectedProcess && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Telemetry Readings (last 100)</h2>
            <span className="text-xs text-gray-400">{readings.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Recorded At</th>
                  <th>DO%</th>
                  <th>pH</th>
                  <th>OD600</th>
                  <th>RPM</th>
                  <th>Temp (°C)</th>
                  <th>Dissolved O2</th>
                  <th>CO2%</th>
                  <th>Anomaly</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center text-gray-400 py-8">Loading...</td></tr>
                ) : readings.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-gray-400 py-8">No readings found</td></tr>
                ) : readings.map(r => (
                  <tr key={r.id} className={r.is_anomaly ? 'bg-red-50' : ''}>
                    <td className="text-xs">{new Date(r.recorded_at).toLocaleString()}</td>
                    <td>{r.do_pct}</td>
                    <td>{r.ph}</td>
                    <td>{r.od600}</td>
                    <td>{r.agitation_rpm}</td>
                    <td>{r.temperature_c}</td>
                    <td>{r.dissolved_o2}</td>
                    <td>{r.co2_pct}</td>
                    <td>
                      {r.is_anomaly ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                          Anomaly
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default TelemetryPage;
