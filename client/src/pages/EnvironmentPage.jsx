import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'bioreactor_id', label: 'Bioreactor ID', type: 'text' },
  { key: 'parameter_name', label: 'Parameter', type: 'text' },
  { key: 'set_value', label: 'Set Value', type: 'number' },
  { key: 'actual_value', label: 'Actual Value', type: 'number' },
  { key: 'unit', label: 'Unit', type: 'text' },
  { key: 'tolerance', label: 'Tolerance', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['normal', 'warning', 'critical'] },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const cardRender = (item, getStatusClass) => {
  const deviation = Math.abs(item.actual_value - item.set_value).toFixed(2);
  return (
    <>
      <div className="card-header">
        <h3 className="card-title">{item.parameter_name}</h3>
        <span className={`card-status ${getStatusClass(item)}`}>{item.status}</span>
      </div>
      <div className="card-body">
        <p className="card-subtitle">Bioreactor #{item.bioreactor_id}</p>
        <div className="card-metrics-row">
          <span>🎯 Set: {item.set_value} {item.unit}</span>
          <span>📏 Actual: {item.actual_value} {item.unit}</span>
        </div>
      </div>
      <div className="card-footer">
        <span className="card-metric-sm">Deviation: {deviation} {item.unit}</span>
        <span className="card-metric-sm">Tolerance: ±{item.tolerance}</span>
      </div>
    </>
  );
};

export default function EnvironmentPage() {
  return <FeaturePage title="Environment Controls" apiPath="/environment" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} environmental control readings. Identify any parameters outside tolerance and recommend adjustments.`} />;
}
