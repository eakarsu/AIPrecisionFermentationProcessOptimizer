import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'regulation_name', label: 'Regulation', type: 'text' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'requirement', label: 'Requirement', type: 'textarea' },
  { key: 'status', label: 'Status', type: 'select', options: ['compliant', 'non_compliant', 'pending_review', 'in_progress'] },
  { key: 'due_date', label: 'Due Date', type: 'text' },
  { key: 'assigned_to', label: 'Assigned To', type: 'text' },
  { key: 'evidence', label: 'Evidence', type: 'textarea' },
  { key: 'last_audit_date', label: 'Last Audit', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const cardRender = (item, getStatusClass) => {
  const statusMap = { compliant: 'status-active', non_compliant: 'status-critical', pending_review: 'status-planned', in_progress: 'status-maintenance' };
  return (
    <>
      <div className="card-header">
        <h3 className="card-title">{item.regulation_name}</h3>
        <span className={`card-status ${statusMap[item.status] || 'status-planned'}`}>
          {item.status?.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="card-body">
        <p className="card-subtitle">{item.category}</p>
        <p className="card-text">{item.requirement?.substring(0, 100)}...</p>
      </div>
      <div className="card-footer">
        <span className="card-metric-sm">👤 {item.assigned_to}</span>
        {item.due_date && <span className="card-metric-sm">📅 Due: {new Date(item.due_date).toLocaleDateString()}</span>}
      </div>
    </>
  );
};

export default function CompliancePage() {
  return <FeaturePage title="Regulatory Compliance" apiPath="/compliance" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} compliance records. Identify non-compliant items, assess risk, and recommend remediation steps.`} />;
}
