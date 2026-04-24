import React, { useState, useEffect } from 'react';
import { FiPlus, FiZap, FiSearch } from 'react-icons/fi';
import { api } from '../api';
import DetailModal from './DetailModal';
import AIResponseDisplay from './AIResponseDisplay';
import { useToast } from './Toast';

export default function FeaturePage({ title, apiPath, fields, cardRender, aiPromptBuilder }) {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [modalOpen, setModalOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const { showToast } = useToast();

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await api.get(apiPath);
      setItems(data);
      setFiltered(data);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [apiPath]);

  useEffect(() => {
    if (!search) { setFiltered(items); return; }
    const q = search.toLowerCase();
    setFiltered(items.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(q))
    ));
  }, [search, items]);

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedItem(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (modalMode === 'create') {
        await api.post(apiPath, formData);
        showToast('Item created successfully', 'success');
      } else {
        await api.put(`${apiPath}/${formData.id}`, formData);
        showToast('Item updated successfully', 'success');
      }
      fetchItems();
    } catch (err) {
      showToast('Failed to save', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`${apiPath}/${id}`);
      showToast('Item deleted', 'success');
      fetchItems();
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  const handleAIAnalyze = async () => {
    setAiLoading(true);
    setAiResponse('');
    try {
      const prompt = aiPromptBuilder ? aiPromptBuilder(items) : `Analyze these ${title.toLowerCase()} records and provide insights.`;
      const data = await api.post(`${apiPath}/ai-analyze`, { data: items, prompt });
      setAiResponse(data.analysis || data.result || JSON.stringify(data));
    } catch (err) {
      setAiResponse('AI analysis failed. Please check your OpenRouter API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const getStatusClass = (item) => {
    const status = (item.status || item.severity || item.priority || '').toLowerCase();
    if (['active', 'running', 'normal', 'available'].includes(status)) return 'status-active';
    if (['completed', 'resolved', 'passed'].includes(status)) return 'status-completed';
    if (['planned', 'scheduled', 'pending', 'testing', 'low'].includes(status)) return 'status-planned';
    if (['critical', 'high', 'urgent', 'cancelled'].includes(status)) return 'status-critical';
    if (['maintenance', 'warning', 'medium'].includes(status)) return 'status-maintenance';
    return 'status-planned';
  };

  return (
    <div className="feature-page">
      <div className="page-header">
        <h1>{title}</h1>
        <div className="page-header-actions">
          <div className="search-bar">
            <FiSearch size={16} />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleNew}><FiPlus size={16} /> New Item</button>
          <button className="btn btn-success" onClick={handleAIAnalyze}><FiZap size={16} /> AI Analyze</button>
        </div>
      </div>

      {aiLoading || aiResponse ? (
        <AIResponseDisplay response={aiResponse} loading={aiLoading} title={`${title} AI Analysis`} />
      ) : null}

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No {title.toLowerCase()} found</p>
          <button className="btn btn-primary" onClick={handleNew}>Create your first item</button>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map(item => (
            <div key={item.id} className="card" onClick={() => handleCardClick(item)}>
              {cardRender ? cardRender(item, getStatusClass) : (
                <>
                  <div className="card-header">
                    <h3 className="card-title">{item.name || item.batch_name || item.process_name || `Item #${item.id}`}</h3>
                    {(item.status || item.severity || item.priority) && (
                      <span className={`card-status ${getStatusClass(item)}`}>
                        {item.status || item.severity || item.priority}
                      </span>
                    )}
                  </div>
                  <div className="card-body">
                    <p className="card-subtitle">{item.notes || item.organism || item.product_name || ''}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <DetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={title}
        data={selectedItem}
        fields={fields}
        onSave={handleSave}
        onDelete={handleDelete}
        mode={modalMode}
      />
    </div>
  );
}
