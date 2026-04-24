import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'process_name', label: 'Process', type: 'text' },
  { key: 'strain_name', label: 'Strain', type: 'text' },
  { key: 'predicted_yield', label: 'Predicted Yield (g/L)', type: 'number' },
  { key: 'actual_yield', label: 'Actual Yield (g/L)', type: 'number' },
  { key: 'confidence_score', label: 'Confidence %', type: 'number' },
  { key: 'parameters_json', label: 'Parameters', type: 'textarea' },
  { key: 'prediction_date', label: 'Prediction Date', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['pending', 'verified', 'missed'] },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const cardRender = (item, getStatusClass) => {
  const accuracy = item.actual_yield ? ((1 - Math.abs(item.predicted_yield - item.actual_yield) / item.predicted_yield) * 100).toFixed(1) : null;
  return (
    <>
      <div className="card-header">
        <h3 className="card-title">{item.process_name}</h3>
        <span className={`card-status ${getStatusClass(item)}`}>{item.status}</span>
      </div>
      <div className="card-body">
        <p className="card-subtitle">Strain: {item.strain_name}</p>
        <div className="card-metrics-row">
          <span>📊 Predicted: {item.predicted_yield} g/L</span>
          <span>✅ Actual: {item.actual_yield || '—'} g/L</span>
        </div>
      </div>
      <div className="card-footer">
        <span className="card-metric-sm">Confidence: {item.confidence_score}%</span>
        {accuracy && <span className="card-metric-sm">Accuracy: {accuracy}%</span>}
      </div>
    </>
  );
};

export default function YieldsPage() {
  return <FeaturePage title="Yield Predictions" apiPath="/yields" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} yield predictions. Compare predicted vs actual yields and suggest ways to improve prediction accuracy.`} />;
}
