const API_BASE = '/api';

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth & Profiles
  async getUsers() {
    const res = await fetch(`${API_BASE}/auth/users`);
    return handleResponse(res);
  },

  async getProfile(userId) {
    const res = await fetch(`${API_BASE}/auth/profile/${userId}`);
    return handleResponse(res);
  },

  async registerUser(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  async updateProfile(userId, data) {
    const res = await fetch(`${API_BASE}/auth/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Posts
  async getFeed(viewerId = '') {
    const query = viewerId ? `?viewerId=${encodeURIComponent(viewerId)}` : '';
    const res = await fetch(`${API_BASE}/posts/feed${query}`);
    return handleResponse(res);
  },

  async getPost(postId, viewerId = '') {
    const query = viewerId ? `?viewerId=${encodeURIComponent(viewerId)}` : '';
    const res = await fetch(`${API_BASE}/posts/${postId}${query}`);
    return handleResponse(res);
  },

  async getPostsByAuthor(authorId) {
    const res = await fetch(`${API_BASE}/posts/author/${authorId}`);
    return handleResponse(res);
  },

  async createPost(formData) {
    // formData can contain 'media' file, 'authorId', 'caption'
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  // Interactions: Likes
  async likePost(postId, userId) {
    const res = await fetch(`${API_BASE}/interactions/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return handleResponse(res);
  },

  async unlikePost(postId, userId) {
    const res = await fetch(`${API_BASE}/interactions/posts/${postId}/like`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return handleResponse(res);
  },

  // Interactions: Comments
  async addComment(postId, authorId, text) {
    const res = await fetch(`${API_BASE}/interactions/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId, text }),
    });
    return handleResponse(res);
  },

  async getComments(postId) {
    const res = await fetch(`${API_BASE}/interactions/posts/${postId}/comments`);
    return handleResponse(res);
  },

  // Interactions: Follows
  async followUser(followerId, targetId) {
    const res = await fetch(`${API_BASE}/interactions/users/${targetId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId }),
    });
    return handleResponse(res);
  },

  async unfollowUser(followerId, targetId) {
    const res = await fetch(`${API_BASE}/interactions/users/${targetId}/follow`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId }),
    });
    return handleResponse(res);
  },

  async checkFollowing(followerId, targetId) {
    const res = await fetch(`${API_BASE}/interactions/users/${targetId}/follow?followerId=${encodeURIComponent(followerId)}`);
    return handleResponse(res);
  },

  // IPFS Storage
  async uploadToIpfs(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/ipfs/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  // Ledger Exploration
  async getLedgerBlocks() {
    const res = await fetch(`${API_BASE}/ledger/blocks`);
    return handleResponse(res);
  },

  async getLedgerStatus() {
    const res = await fetch(`${API_BASE}/ledger/status`);
    return handleResponse(res);
  },
};
