import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FiThermometer, FiDroplet, FiActivity, FiAlertTriangle, FiPlus, FiRefreshCw } from 'react-icons/fi';

const COLORS = {
  temperature: '#ef4444',
  ph: '#3b82f6',
  dissolved_oxygen: '#22c55e',
  pressure: '#f59e0b',
};

function StatCard({ icon: Icon, label, value, unit, color, alert }) {
  return (
    <div className={`card p-4 ${alert ? 'border-red-400 bg-red-50' : ''}`}>
      <div className="flex items-center gap-3 mb-1">
        <div style={{ color }} className="text-xl"><Icon /></div>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        {alert && <FiAlertTriangle className="text-red-500 ml-auto" />}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {value != null ? `${value} ${unit}` : '—'}
      </div>
    </div>
  );
}

export default function SensorDashboardPage() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ temperature: '', pH: '', dissolved_oxygen: '', pressure: '' });
  const [lastAlert, setLastAlert] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/batches?limit=100').then(r => setBatches(r.data || [])).catch(() => {});
  }, []);

  const fetchReadings = useCallback(async (batchId) => {
    if (!batchId) return;
    setLoading(true);
    try {
      const data = await api.get(`/fermentation-batches/${batchId}/sensor-readings?limit=200`);
      setReadings((data.data || []).slice().reverse());
    } catch (err) {
      setError('Failed to load sensor readings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReadings(selectedBatch);
  }, [selectedBatch, fetchReadings]);

  const handleSubmitReading = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return setError('Please select a batch first');
    setPosting(true);
    setError('');
    setSuccess('');
    try {
      const payload = {};
      if (form.temperature !== '') payload.temperature = parseFloat(form.temperature);
      if (form.pH !== '') payload.pH = parseFloat(form.pH);
      if (form.dissolved_oxygen !== '') payload.dissolved_oxygen = parseFloat(form.dissolved_oxygen);
      if (form.pressure !== '') payload.pressure = parseFloat(form.pressure);
      const result = await api.post(`/fermentation-batches/${selectedBatch}/sensor-reading`, payload);
      if (result.alert_triggered) {
        setLastAlert(result.alert_message);
      } else {
        setLastAlert(null);
      }
      setSuccess('Reading submitted successfully');
      setForm({ temperature: '', pH: '', dissolved_oxygen: '', pressure: '' });
      fetchReadings(selectedBatch);
    } catch (err) {
      setError(err.message || 'Failed to submit reading');
    } finally {
      setPosting(false);
    }
  };

  const latest = readings[readings.length - 1];
  const alertReadings = readings.filter(r => r.alert_triggered);

  const chartData = readings.map((r, i) => ({
    index: i + 1,
    time: new Date(r.timestamp).toLocaleTimeString(),
    temperature: r.temperature != null ? parseFloat(r.temperature) : undefined,
    ph: r.ph != null ? parseFloat(r.ph) : undefined,
    dissolved_oxygen: r.dissolved_oxygen != null ? parseFloat(r.dissolved_oxygen) : undefined,
    pressure: r.pressure != null ? parseFloat(r.pressure) : undefined,
  }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FiActivity className="text-2xl text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sensor Dashboard</h1>
          <p className="text-sm text-gray-500">Real-time fermentation sensor monitoring</p>
        </div>
      </div>

      {/* Batch selector */}
      <div className="card p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
          <select
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
            className="input-field"
          >
            <option value="">Choose a batch...</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.batch_name} — {b.status}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => fetchReadings(selectedBatch)}
          disabled={!selectedBatch}
          className="btn-secondary flex items-center gap-2 mt-5"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {lastAlert && (
        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
          <FiAlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Threshold Alert</p>
            <p className="text-sm text-red-700">{lastAlert}</p>
          </div>
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      {/* Stat cards */}
      {latest && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={FiThermometer} label="Temperature" value={latest.temperature} unit="°C" color={COLORS.temperature} alert={alertReadings.some(r => r.id === latest.id)} />
          <StatCard icon={FiDroplet} label="pH" value={latest.ph} unit="" color={COLORS.ph} />
          <StatCard icon={FiActivity} label="Dissolved O₂" value={latest.dissolved_oxygen} unit="%" color={COLORS.dissolved_oxygen} />
          <StatCard icon={FiActivity} label="Pressure" value={latest.pressure} unit="bar" color={COLORS.pressure} />
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sensor Trends ({readings.length} readings)</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke={COLORS.temperature} dot={false} name="Temp (°C)" strokeWidth={2} />
              <Line type="monotone" dataKey="ph" stroke={COLORS.ph} dot={false} name="pH" strokeWidth={2} />
              <Line type="monotone" dataKey="dissolved_oxygen" stroke={COLORS.dissolved_oxygen} dot={false} name="DO (%)" strokeWidth={2} />
              <Line type="monotone" dataKey="pressure" stroke={COLORS.pressure} dot={false} name="Pressure (bar)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* New reading form */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiPlus /> Submit New Reading
        </h2>
        <form onSubmit={handleSubmitReading}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              { key: 'temperature', label: 'Temperature (°C)' },
              { key: 'pH', label: 'pH' },
              { key: 'dissolved_oxygen', label: 'Dissolved O₂ (%)' },
              { key: 'pressure', label: 'Pressure (bar)' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type="number"
                  step="0.01"
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="input-field"
                  placeholder="Enter value"
                />
              </div>
            ))}
          </div>
          <button type="submit" disabled={posting || !selectedBatch} className="btn-primary flex items-center gap-2">
            {posting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiPlus />}
            {posting ? 'Submitting...' : 'Submit Reading'}
          </button>
        </form>
      </div>

      {/* Alert history */}
      {alertReadings.length > 0 && (
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Alert History ({alertReadings.length})</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alertReadings.slice().reverse().map(r => (
              <div key={r.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg text-sm">
                <FiAlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-red-800">{new Date(r.timestamp).toLocaleString()}</span>
                  <p className="text-red-700">{r.alert_message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
