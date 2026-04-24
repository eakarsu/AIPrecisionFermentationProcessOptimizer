const API_BASE = '/api';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

export const api = {
  get: async (url) => {
    const res = await fetch(`${API_BASE}${url}`, { headers: headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async (url, data) => {
    const res = await fetch(`${API_BASE}${url}`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  put: async (url, data) => {
    const res = await fetch(`${API_BASE}${url}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  delete: async (url) => {
    const res = await fetch(`${API_BASE}${url}`, { method: 'DELETE', headers: headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export const login = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  localStorage.setItem('token', data.token);
  return data;
};

export const logout = () => {
  localStorage.removeItem('token');
};
