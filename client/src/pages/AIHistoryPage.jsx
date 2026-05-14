import React, { useState, useEffect } from 'react';
import { api } from '../api';

function AIHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/ai/history?page=${p}&limit=20`);
      setHistory(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      setError('Failed to load history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(1); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          AI Analysis History
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} analyses stored for your account
        </p>
      </div>

      {error && (
        <div className="card p-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History List */}
        <div className="lg:col-span-1 card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">Past Analyses</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No analyses yet. Run some AI analyses first.</div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {history.map(item => (
                  <li
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === item.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mb-1">
                          {item.endpoint}
                        </span>
                        <div className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                        {item.process_id && (
                          <div className="text-xs text-gray-400">Process #{item.process_id}</div>
                        )}
                      </div>
                      {item.result_json && (
                        <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">JSON</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => fetchHistory(page - 1)}
                    disabled={page === 1}
                    className="btn btn-secondary text-xs px-2 py-1"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => fetchHistory(page + 1)}
                    disabled={page === totalPages}
                    className="btn btn-secondary text-xs px-2 py-1"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="card p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-purple-100 text-purple-800">
                    {selected.endpoint}
                  </span>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(selected.created_at).toLocaleString()}
                    {selected.process_id ? ` • Process #${selected.process_id}` : ''}
                  </div>
                </div>
              </div>

              {selected.result_json && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Structured JSON Output</h3>
                  <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-auto max-h-64 font-mono">
                    {JSON.stringify(selected.result_json, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Raw AI Response</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-auto leading-relaxed">
                  {selected.result}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center text-center text-gray-400">
              <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Select an analysis to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIHistoryPage;
