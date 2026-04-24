import React from 'react';
import FeaturePage from '../components/FeaturePage';

const fields = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'batch_name', label: 'Batch', type: 'text' },
  { key: 'raw_material_cost', label: 'Raw Materials ($)', type: 'number' },
  { key: 'labor_cost', label: 'Labor ($)', type: 'number' },
  { key: 'energy_cost', label: 'Energy ($)', type: 'number' },
  { key: 'equipment_cost', label: 'Equipment ($)', type: 'number' },
  { key: 'overhead_cost', label: 'Overhead ($)', type: 'number' },
  { key: 'total_cost', label: 'Total Cost ($)', type: 'number' },
  { key: 'revenue', label: 'Revenue ($)', type: 'number' },
  { key: 'profit_margin', label: 'Profit Margin (%)', type: 'number' },
  { key: 'currency', label: 'Currency', type: 'text' },
  { key: 'analysis_date', label: 'Analysis Date', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const cardRender = (item, getStatusClass) => {
  const isProfit = item.profit_margin > 0;
  return (
    <>
      <div className="card-header">
        <h3 className="card-title">{item.batch_name}</h3>
        <span className={`card-status ${isProfit ? 'status-active' : 'status-critical'}`}>
          {isProfit ? 'Profitable' : 'Loss'}
        </span>
      </div>
      <div className="card-body">
        <div className="card-metrics-row">
          <span>💰 Cost: ${Number(item.total_cost).toLocaleString()}</span>
          <span>📈 Revenue: ${Number(item.revenue).toLocaleString()}</span>
        </div>
      </div>
      <div className="card-footer">
        <span className="card-metric" style={{ color: isProfit ? '#10b981' : '#ef4444', fontSize: '1.25rem' }}>
          {item.profit_margin}% margin
        </span>
      </div>
    </>
  );
};

export default function CostsPage() {
  return <FeaturePage title="Cost Analysis" apiPath="/costs" fields={fields} cardRender={cardRender}
    aiPromptBuilder={(items) => `Analyze these ${items.length} cost records. Identify the highest cost drivers and recommend cost reduction strategies.`} />;
}
