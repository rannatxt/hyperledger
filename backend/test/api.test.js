'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { app, server } = require('../server');

// Helper to make HTTP requests against the running Express app
async function request(path, options = {}) {
  const port = server.address().port;
  const url = `http://localhost:${port}${path}`;
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  let body;
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, headers: res.headers, body };
}

test('InstaLedger Backend API Integration Tests', async (t) => {
  // Wait a moment for fabricEngine initialization
  await new Promise((r) => setTimeout(r, 500));

  await t.test('GET /api/health returns 200 OK', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'OK');
  });

  await t.test('GET /api/auth/users returns seeded genesis profiles', async () => {
    const res = await request('/api/auth/users');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 3);
    const usernames = res.body.map(u => u.username);
    assert.ok(usernames.includes('ranna'));
  });

  await t.test('POST /api/auth/register creates a new decentralized profile', async () => {
    const uniqueUser = 'testuser_' + Date.now();
    const res = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: uniqueUser,
        username: uniqueUser,
        displayName: 'Test User',
        bio: 'Just testing the ledger'
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.username, uniqueUser);
  });

  await t.test('IPFS upload buffer and fetch by CID', async () => {
    // Test direct IPFS upload via FormData
    const boundary = '----WebKitFormBoundaryTest1234';
    const sampleContent = 'Decentralized image content placeholder';
    const postData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="sample.png"',
      'Content-Type: image/png',
      '',
      sampleContent,
      `--${boundary}--`
    ].join('\r\n');

    const res = await request('/api/ipfs/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: postData
    });

    assert.equal(res.status, 201);
    assert.ok(res.body.cid.startsWith('bafk'));

    // Now retrieve media by CID
    const getRes = await request(`/api/ipfs/${res.body.cid}`);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body, sampleContent);
  });

  await t.test('GET /api/posts/feed returns posts from ledger', async () => {
    const res = await request('/api/posts/feed');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 3);
  });

  let createdPostId = '';
  await t.test('POST /api/posts creates new post with IPFS CID on ledger', async () => {
    const res = await request('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId: 'user_ranna',
        contentHash: 'bafybeigcustomcid987654321',
        caption: 'Testing post submission to Fabric ledger!',
        mediaUrl: 'https://example.com/art.jpg'
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.authorUsername, 'ranna');
    assert.equal(res.body.contentHash, 'bafybeigcustomcid987654321');
    createdPostId = res.body.id;
  });

  await t.test('POST /api/interactions/posts/:id/like updates likeCount atomically', async () => {
    const res = await request(`/api/interactions/posts/${createdPostId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_elena' })
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.liked, true);
    assert.equal(res.body.likeCount, 1);
  });

  await t.test('POST /api/interactions/posts/:id/comments records comment on ledger', async () => {
    const res = await request(`/api/interactions/posts/${createdPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorId: 'user_marcus',
        text: 'Awesome decentralized architecture!'
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.authorUsername, 'marcus_art');

    const getRes = await request(`/api/interactions/posts/${createdPostId}/comments`);
    assert.equal(getRes.status, 200);
    assert.ok(Array.isArray(getRes.body));
    assert.equal(getRes.body.length, 1);
    assert.equal(getRes.body[0].text, 'Awesome decentralized architecture!');
  });

  await t.test('GET /api/ledger/blocks returns block height and transactions', async () => {
    const res = await request('/api/ledger/blocks');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 3);
    assert.ok(res.body[0].blockHash);
  });

  t.after(() => {
    server.close();
  });
});
