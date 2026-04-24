import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'type', label: 'Type', type: 'text' },
  { key: 'capacity_liters', label: 'Capacity (L)', type: 'number' },
  { key: 'material', label: 'Material', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['available', 'in_use', 'maintenance'] },
  { key: 'current_process', label: 'Current Process', type: 'text' },
  { key: 'installation_date', label: 'Installed', type: 'text' },
  { key: 'last_maintenance', label: 'Last Maintenance', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const cardRender = (item, getStatusClass) => (
  <>
    <div className="card-header">
      <h3 className="card-title">{item.name}</h3>
      <span className={`card-status ${getStatusClass(item)}`}>{item.status}</span>
    </div>
    <div className="card-body">
      <p className="card-subtitle">{item.type} — {item.material}</p>
      <div className="card-metrics-row">
        <span>📦 {item.capacity_liters}L</span>
        <span>📍 {item.location}</span>
      </div>
    </div>
    <div className="card-footer">
      <span className="card-metric-sm">{item.current_process || 'No active process'}</span>
    </div>
  </>
);

export default function BioreactorsPage() {
  return <FeaturePage title="Bioreactors" apiPath="/bioreactors" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} bioreactors. Recommend maintenance schedules, capacity planning, and scale-up strategies.`} />;
}
