import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'name', label: 'Media Name', type: 'text' },
  { key: 'base_type', label: 'Base Type', type: 'text' },
  { key: 'carbon_source', label: 'Carbon Source', type: 'text' },
  { key: 'nitrogen_source', label: 'Nitrogen Source', type: 'text' },
  { key: 'minerals', label: 'Minerals', type: 'text' },
  { key: 'vitamins', label: 'Vitamins', type: 'text' },
  { key: 'ph_target', label: 'pH Target', type: 'number' },
  { key: 'sterilization_method', label: 'Sterilization', type: 'text' },
  { key: 'cost_per_liter', label: 'Cost/Liter ($)', type: 'number' },
  { key: 'shelf_life_days', label: 'Shelf Life (days)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'archived', 'testing'] },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const cardRender = (item, getStatusClass) => (
  <>
    <div className="card-header">
      <h3 className="card-title">{item.name}</h3>
      <span className={`card-status ${getStatusClass(item)}`}>{item.status}</span>
    </div>
    <div className="card-body">
      <p className="card-subtitle">{item.base_type} — C: {item.carbon_source}</p>
      <div className="card-metrics-row">
        <span>pH {item.ph_target}</span>
        <span>💰 ${item.cost_per_liter}/L</span>
      </div>
    </div>
    <div className="card-footer">
      <span className="card-metric-sm">Shelf life: {item.shelf_life_days} days</span>
    </div>
  </>
);

export default function NutrientsPage() {
  return <FeaturePage title="Nutrient Media" apiPath="/nutrients" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} nutrient media formulations and suggest optimizations for cost-effectiveness and performance.`} />;
}
