import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'batch_name', label: 'Batch Name', type: 'text' },
  { key: 'recipe_name', label: 'Recipe', type: 'text' },
  { key: 'bioreactor_name', label: 'Bioreactor', type: 'text' },
  { key: 'start_date', label: 'Start Date', type: 'text' },
  { key: 'end_date', label: 'End Date', type: 'text' },
  { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
  { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in_progress', 'completed', 'cancelled'] },
  { key: 'assigned_to', label: 'Assigned To', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const cardRender = (item, getStatusClass) => (
  <>
    <div className="card-header">
      <h3 className="card-title">{item.batch_name}</h3>
      <span className={`card-status ${getStatusClass(item)}`}>{item.status}</span>
    </div>
    <div className="card-body">
      <p className="card-subtitle">{item.recipe_name} → {item.bioreactor_name}</p>
      <div className="card-metrics-row">
        <span>📅 {item.start_date ? new Date(item.start_date).toLocaleDateString() : '—'}</span>
        <span>👤 {item.assigned_to}</span>
      </div>
    </div>
    <div className="card-footer">
      <span className={`card-status ${getStatusClass({ status: item.priority })}`}>Priority: {item.priority}</span>
    </div>
  </>
);

export default function BatchesPage() {
  return <FeaturePage title="Batch Schedules" apiPath="/batches" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} batch schedules. Optimize scheduling for bioreactor utilization and minimize downtime.`} />;
}
