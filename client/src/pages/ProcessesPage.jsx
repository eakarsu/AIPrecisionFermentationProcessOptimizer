import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'name', label: 'Process Name', type: 'text' },
  { key: 'organism', label: 'Organism', type: 'text' },
  { key: 'substrate', label: 'Substrate', type: 'text' },
  { key: 'target_product', label: 'Target Product', type: 'text' },
  { key: 'temperature', label: 'Temperature (°C)', type: 'number' },
  { key: 'ph_level', label: 'pH Level', type: 'number' },
  { key: 'duration_hours', label: 'Duration (hrs)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['running', 'completed', 'planned'] },
  { key: 'yield_percentage', label: 'Yield %', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const cardRender = (item, getStatusClass) => (
  <>
    <div className="card-header">
      <h3 className="card-title">{item.name}</h3>
      <span className={`card-status ${getStatusClass(item)}`}>{item.status}</span>
    </div>
    <div className="card-body">
      <p className="card-subtitle">{item.organism} — {item.target_product}</p>
      <div className="card-metrics-row">
        <span>🌡 {item.temperature}°C</span>
        <span>pH {item.ph_level}</span>
        <span>⏱ {item.duration_hours}h</span>
      </div>
    </div>
    <div className="card-footer">
      <span className="card-metric-sm">Yield: {item.yield_percentage}%</span>
    </div>
  </>
);

export default function ProcessesPage() {
  return <FeaturePage title="Fermentation Processes" apiPath="/processes" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} fermentation processes and suggest optimizations for yield improvement.`} />;
}
