import React, { useState } from 'react';
import { FiCopy, FiCheck, FiZap } from 'react-icons/fi';

function formatAIText(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let listType = null;

  const flushList = () => {
    if (listItems.length > 0) {
      const Tag = listType === 'ol' ? 'ol' : 'ul';
      elements.push(<Tag key={`list-${elements.length}`}>{listItems}</Tag>);
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={i}>{trimmed.slice(4)}</h4>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={i}>{trimmed.slice(3)}</h3>);
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={i}>{trimmed.slice(2)}</h2>);
      return;
    }

    // Bold headers (like **Something:**)
    if (/^\*\*[^*]+\*\*:?\s*$/.test(trimmed)) {
      flushList();
      const text = trimmed.replace(/\*\*/g, '').replace(/:$/, '');
      elements.push(<h4 key={i} className="ai-bold-header">{text}</h4>);
      return;
    }

    // Bullet points
    if (/^[-*•]\s/.test(trimmed)) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      const content = trimmed.replace(/^[-*•]\s+/, '');
      listItems.push(<li key={i}>{formatInline(content)}</li>);
      return;
    }

    // Numbered list
    if (/^\d+[.)]\s/.test(trimmed)) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      const content = trimmed.replace(/^\d+[.)]\s+/, '');
      listItems.push(<li key={i}>{formatInline(content)}</li>);
      return;
    }

    flushList();
    elements.push(<p key={i}>{formatInline(trimmed)}</p>);
  });

  flushList();
  return elements;
}

function formatInline(text) {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Inline code
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cp, j) => {
      if (cp.startsWith('`') && cp.endsWith('`')) {
        return <code key={`${i}-${j}`}>{cp.slice(1, -1)}</code>;
      }
      return cp;
    });
  });
}

export default function AIResponseDisplay({ response, loading, title = 'AI Analysis Results' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="ai-response">
        <div className="ai-response-header">
          <FiZap className="ai-icon" size={20} />
          <span>{title}</span>
        </div>
        <div className="ai-response-body">
          <div className="ai-loading">
            <div className="spinner spinner-sm" />
            <span>AI is analyzing your data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!response) return null;

  return (
    <div className="ai-response">
      <div className="ai-response-header">
        <FiZap className="ai-icon" size={20} />
        <span>{title}</span>
        <button className="btn btn-sm btn-secondary" onClick={handleCopy} style={{ marginLeft: 'auto' }}>
          {copied ? <><FiCheck size={14} /> Copied</> : <><FiCopy size={14} /> Copy</>}
        </button>
      </div>
      <div className="ai-response-body">
        {formatAIText(response)}
      </div>
      <div className="ai-response-footer">
        <span className="ai-timestamp">Analysis generated at {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
