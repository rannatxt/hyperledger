const BASE = import.meta.env.VITE_API_URL || '';

async function json(res) {
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.tamperProofError = data.tamperProofError;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  getFeed:    (viewerId) => fetch(`${BASE}/api/posts/feed${viewerId ? `?viewerId=${viewerId}` : ''}`).then(json),
  getUsers:   ()         => fetch(`${BASE}/api/auth/users`).then(json),
  getProfile: (id)       => fetch(`${BASE}/api/auth/profile/${id}`).then(json),
  getLedger:  ()         => fetch(`${BASE}/api/ledger/status`).then(json),
  getBlocks:  ()         => fetch(`${BASE}/api/ledger/blocks`).then(json),

  createPost: (formData) =>
    fetch(`${BASE}/api/posts`, { method: 'POST', body: formData }).then(json),

  checkDuplicate: (contentHash) =>
    fetch(`${BASE}/api/posts/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentHash }),
    }).then(res => res.json()),

  toggleLike: (postId, userId) =>
    fetch(`${BASE}/api/interactions/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, userId }),
    }).then(json),

  getComments: (postId) =>
    fetch(`${BASE}/api/interactions/comments/${postId}`).then(json),

  addComment: (postId, authorId, text) =>
    fetch(`${BASE}/api/interactions/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, authorId, text }),
    }).then(json),
};
