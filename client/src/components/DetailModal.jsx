import React, { useState, useEffect } from 'react';
import { FiX, FiEdit2, FiTrash2, FiSave } from 'react-icons/fi';

export default function DetailModal({ isOpen, onClose, title, data, fields, onSave, onDelete, mode: initialMode = 'view' }) {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setMode(initialMode);
    if (data) {
      setFormData({ ...data });
    } else {
      const empty = {};
      fields.forEach(f => { empty[f.key] = f.defaultValue || ''; });
      setFormData(empty);
    }
  }, [data, initialMode, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDelete(data.id);
      onClose();
    }
  };

  const renderValue = (field) => {
    const val = data?.[field.key];
    if (val === null || val === undefined) return '—';
    if (field.key === 'parameters_json' || field.key === 'steps_json') {
      try {
        return typeof val === 'string' ? val : JSON.stringify(val, null, 2);
      } catch { return String(val); }
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  };

  const renderInput = (field) => {
    const val = formData[field.key] ?? '';
    if (field.type === 'select') {
      return (
        <select className="form-select" value={val} onChange={e => handleChange(field.key, e.target.value)}>
          <option value="">Select...</option>
          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (field.type === 'textarea') {
      return <textarea className="form-textarea" value={val} onChange={e => handleChange(field.key, e.target.value)} rows={4} />;
    }
    return (
      <input
        className="form-input"
        type={field.type === 'number' ? 'number' : 'text'}
        step={field.type === 'number' ? 'any' : undefined}
        value={val}
        onChange={e => handleChange(field.key, e.target.value)}
      />
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'create' ? `New ${title}` : mode === 'edit' ? `Edit ${title}` : title}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="modal-body">
          {mode === 'view' ? (
            <div className="detail-grid">
              {fields.map(field => (
                <div key={field.key} className="detail-item">
                  <span className="detail-label">{field.label}</span>
                  <span className="detail-value">{renderValue(field)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="form-grid">
              {fields.filter(f => f.key !== 'id' && f.key !== 'created_at').map(field => (
                <div key={field.key} className="form-group">
                  <label className="form-label">{field.label}</label>
                  {renderInput(field)}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          {mode === 'view' && (
            <>
              <button className="btn btn-primary" onClick={() => setMode('edit')}><FiEdit2 size={14} /> Edit</button>
              <button className="btn btn-danger" onClick={handleDelete}><FiTrash2 size={14} /> Delete</button>
            </>
          )}
          {mode === 'edit' && (
            <>
              <button className="btn btn-primary" onClick={handleSave}><FiSave size={14} /> Save</button>
              <button className="btn btn-secondary" onClick={() => setMode('view')}>Cancel</button>
            </>
          )}
          {mode === 'create' && (
            <>
              <button className="btn btn-primary" onClick={handleSave}><FiSave size={14} /> Create</button>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
