const BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '' : 'http://localhost:5000');

function getAuthHeader() {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('instaledger_token');
    if (token) return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

async function json(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.tamperProofError = data.tamperProofError;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Authentication & Session
  login: (username, password) =>
    fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(json),

  signup: (payload) =>
    fetch(`${BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(json),

  getMe: (token) =>
    fetch(`${BASE}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token || (typeof window !== 'undefined' ? window.localStorage.getItem('instaledger_token') : '')}`
      }
    }).then(json),

  getUsers: () => fetch(`${BASE}/api/auth/users`).then(json),
  getProfile: (id) => fetch(`${BASE}/api/auth/profile/${id}`).then(json),
  getLedger: () => fetch(`${BASE}/api/ledger/status`).then(json),
  getBlocks: () => fetch(`${BASE}/api/ledger/blocks`).then(json),

  // Shared Feeds
  getFeed: (viewerId) =>
    fetch(`${BASE}/api/posts/feed${viewerId ? `?viewerId=${viewerId}` : ''}`, {
      headers: getAuthHeader()
    }).then(json),

  getExplore: () =>
    fetch(`${BASE}/api/posts/explore`, {
      headers: getAuthHeader()
    }).then(json),

  getUserPosts: (userId) =>
    fetch(`${BASE}/api/posts/user/${userId}`, {
      headers: getAuthHeader()
    }).then(json),

  createPost: (formData) =>
    fetch(`${BASE}/api/posts`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData
    }).then(json),

  deletePost: (postId, authorId) =>
    fetch(`${BASE}/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ authorId })
    }).then(json),

  checkDuplicate: (payload) => {
    if (typeof payload === 'string') {
      return fetch(`${BASE}/api/posts/check-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ contentHash: payload }),
      }).then(res => res.json());
    }
    if (payload instanceof FormData) {
      return fetch(`${BASE}/api/posts/check-duplicate`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: payload,
      }).then(res => res.json());
    }
    return fetch(`${BASE}/api/posts/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    }).then(res => res.json());
  },

  toggleLike: (postId, userId) =>
    fetch(`${BASE}/api/interactions/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ postId, userId }),
    }).then(json),

  getComments: (postId) =>
    fetch(`${BASE}/api/interactions/comments/${postId}`, {
      headers: getAuthHeader()
    }).then(json),

  addComment: (postId, authorId, text) =>
    fetch(`${BASE}/api/interactions/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ postId, authorId, text }),
    }).then(json),
};
