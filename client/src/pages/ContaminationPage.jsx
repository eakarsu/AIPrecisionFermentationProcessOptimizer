import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'process_name', label: 'Process', type: 'text' },
  { key: 'contaminant_type', label: 'Contaminant', type: 'text' },
  { key: 'detection_method', label: 'Detection Method', type: 'text' },
  { key: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
  { key: 'action_taken', label: 'Action Taken', type: 'textarea' },
  { key: 'resolved', label: 'Resolved', type: 'select', options: ['true', 'false'] },
  { key: 'detection_date', label: 'Detection Date', type: 'text' },
  { key: 'resolution_date', label: 'Resolution Date', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const cardRender = (item, getStatusClass) => (
  <>
    <div className="card-header">
      <h3 className="card-title">{item.contaminant_type}</h3>
      <span className={`card-status ${getStatusClass({ status: item.severity })}`}>{item.severity}</span>
    </div>
    <div className="card-body">
      <p className="card-subtitle">Process: {item.process_name}</p>
      <div className="card-metrics-row">
        <span>🔬 {item.detection_method}</span>
        <span>{item.resolved ? '✅ Resolved' : '⚠️ Active'}</span>
      </div>
    </div>
    <div className="card-footer">
      <span className="card-metric-sm">Detected: {new Date(item.detection_date).toLocaleDateString()}</span>
    </div>
  </>
);

export default function ContaminationPage() {
  return <FeaturePage title="Contamination Records" apiPath="/contamination" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} contamination records. Identify patterns, common sources, and recommend prevention strategies.`} />;
}
