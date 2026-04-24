import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'batch_id', label: 'Batch ID', type: 'text' },
  { key: 'product_name', label: 'Product', type: 'text' },
  { key: 'test_type', label: 'Test Type', type: 'text' },
  { key: 'test_result', label: 'Result', type: 'number' },
  { key: 'specification_min', label: 'Spec Min', type: 'number' },
  { key: 'specification_max', label: 'Spec Max', type: 'number' },
  { key: 'unit', label: 'Unit', type: 'text' },
  { key: 'passed', label: 'Passed', type: 'select', options: ['true', 'false'] },
  { key: 'tested_by', label: 'Tested By', type: 'text' },
  { key: 'test_date', label: 'Test Date', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const cardRender = (item, getStatusClass) => (
  <>
    <div className="card-header">
      <h3 className="card-title">{item.product_name}</h3>
      <span className={`card-status ${item.passed ? 'status-active' : 'status-critical'}`}>
        {item.passed ? 'PASS' : 'FAIL'}
      </span>
    </div>
    <div className="card-body">
      <p className="card-subtitle">{item.test_type}</p>
      <div className="card-metrics-row">
        <span>📊 Result: {item.test_result} {item.unit}</span>
        <span>📋 Spec: {item.specification_min}–{item.specification_max}</span>
      </div>
    </div>
    <div className="card-footer">
      <span className="card-metric-sm">Batch #{item.batch_id} — {item.tested_by}</span>
    </div>
  </>
);

export default function QualityPage() {
  return <FeaturePage title="Quality Assurance" apiPath="/quality" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} quality test results. Identify trends, failure patterns, and suggest quality improvement measures.`} />;
}
