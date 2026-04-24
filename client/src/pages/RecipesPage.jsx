import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'name', label: 'Recipe Name', type: 'text' },
  { key: 'product_type', label: 'Product Type', type: 'text' },
  { key: 'strain_name', label: 'Strain', type: 'text' },
  { key: 'media_name', label: 'Media', type: 'text' },
  { key: 'fermentation_type', label: 'Fermentation Type', type: 'select', options: ['batch', 'fed-batch', 'continuous'] },
  { key: 'duration_hours', label: 'Duration (hrs)', type: 'number' },
  { key: 'temperature', label: 'Temperature (°C)', type: 'number' },
  { key: 'ph_level', label: 'pH Level', type: 'number' },
  { key: 'agitation_rpm', label: 'Agitation (RPM)', type: 'number' },
  { key: 'aeration_rate', label: 'Aeration (vvm)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'draft', 'archived'] },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const cardRender = (item, getStatusClass) => (
  <>
    <div className="card-header">
      <h3 className="card-title">{item.name}</h3>
      <span className={`card-status ${getStatusClass(item)}`}>{item.status}</span>
    </div>
    <div className="card-body">
      <p className="card-subtitle">{item.product_type} — {item.fermentation_type}</p>
      <div className="card-metrics-row">
        <span>🧬 {item.strain_name}</span>
        <span>⏱ {item.duration_hours}h</span>
      </div>
    </div>
    <div className="card-footer">
      <span className="card-metric-sm">🌡 {item.temperature}°C | pH {item.ph_level} | {item.agitation_rpm} RPM</span>
    </div>
  </>
);

export default function RecipesPage() {
  return <FeaturePage title="Recipes" apiPath="/recipes" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} fermentation recipes. Suggest optimizations for yield, efficiency, and cost.`} />;
}
