import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'name', label: 'Strain Name', type: 'text' },
  { key: 'organism_type', label: 'Organism Type', type: 'text' },
  { key: 'source', label: 'Source', type: 'text' },
  { key: 'genetic_modifications', label: 'Genetic Modifications', type: 'textarea' },
  { key: 'optimal_temp', label: 'Optimal Temp (°C)', type: 'number' },
  { key: 'optimal_ph', label: 'Optimal pH', type: 'number' },
  { key: 'growth_rate', label: 'Growth Rate (h⁻¹)', type: 'number' },
  { key: 'product_yield', label: 'Product Yield (g/L)', type: 'number' },
  { key: 'resistance_markers', label: 'Resistance Markers', type: 'text' },
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
      <p className="card-subtitle">{item.organism_type}</p>
      <div className="card-metrics-row">
        <span>🌡 {item.optimal_temp}°C</span>
        <span>pH {item.optimal_ph}</span>
        <span>📈 {item.growth_rate} h⁻¹</span>
      </div>
    </div>
    <div className="card-footer">
      <span className="card-metric-sm">Yield: {item.product_yield} g/L</span>
    </div>
  </>
);

export default function StrainsPage() {
  return <FeaturePage title="Strain Library" apiPath="/strains" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} microbial strains and recommend modifications for improved performance.`} />;
}
