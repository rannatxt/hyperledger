process.env.NODE_ENV = 'test';
process.env.VERCEL = 'true';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../backend/server');

let server;
let baseUrl;

function postJson(path, body, token = '') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, baseUrl);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method: 'POST', headers }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path, token = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method: 'GET', headers }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

test('Multi-User Authentication and Shared Ledger Test Suite', async (t) => {
  await t.test('setup server', async () => {
    // Reset test user teacher_eva and test hashes so test is idempotent across runs
    const fabricEngine = require('../backend/services/fabricEngine');
    fabricEngine.worldState.delete('Profile~user_teacher_eva');
    fabricEngine.worldState.delete('Username~teacher_eva');
    fabricEngine.worldState.delete('Auth~teacher_eva');
    fabricEngine.worldState.delete('PerceptualHash~1234abcd5678ef01');
    for (const [key, val] of fabricEngine.worldState.entries()) {
      if (key.startsWith('Post~')) {
        try {
          const post = JSON.parse(val.toString('utf8'));
          if (post.authorId === 'user_teacher_eva' || post.perceptualHash === '1234abcd5678ef01') {
            fabricEngine.worldState.delete(key);
            if (post.contentHash) fabricEngine.worldState.delete(`ContentHash~${post.contentHash.toLowerCase()}`);
          }
        } catch (e) {}
      }
    }

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  let rannaToken = '';
  let elenaToken = '';
  let evaToken = '';

  await t.test('1. Login as seed user @ranna with Org1MSP', async () => {
    const res = await postJson('/api/auth/login', { username: 'ranna', password: 'password123' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.username, 'ranna');
    assert.strictEqual(res.body.user.mspId, 'Org1MSP');
    assert.ok(res.body.token);
    rannaToken = res.body.token;
  });

  await t.test('2. Login as seed user @elena with Org2MSP', async () => {
    const res = await postJson('/api/auth/login', { username: 'elena', password: 'password123' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.mspId, 'Org2MSP');
    assert.ok(res.body.token);
    elenaToken = res.body.token;
  });

  await t.test('3. Failed login with bad password', async () => {
    const res = await postJson('/api/auth/login', { username: 'ranna', password: 'wrongPassword' });
    assert.strictEqual(res.status, 401);
  });

  await t.test('4. Sign up new account @teacher_eva on Org1MSP', async () => {
    const res = await postJson('/api/auth/signup', {
      username: 'teacher_eva',
      displayName: 'Professor Eva',
      password: 'profPassword123',
      mspId: 'Org1MSP',
      bio: 'Hyperledger Fabric & Distributed Systems Instructor 🎓'
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.user.username, 'teacher_eva');
    assert.strictEqual(res.body.user.displayName, 'Professor Eva');
    assert.strictEqual(res.body.user.mspId, 'Org1MSP');
    assert.ok(res.body.token);
    evaToken = res.body.token;
  });

  await t.test('5. Verify @teacher_eva can log in', async () => {
    const res = await postJson('/api/auth/login', {
      username: 'teacher_eva',
      password: 'profPassword123'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.username, 'teacher_eva');
  });

  await t.test('6. User @teacher_eva posts new unique photo on shared ledger', async () => {
    const postRes = await postJson('/api/posts', {
      authorId: 'user_teacher_eva',
      contentHash: 'bafyeva_' + Date.now(),
      caption: 'Welcome students to our Hyperledger Fabric class! 📚⛓️',
      perceptualHash: '1234abcd5678ef01',
      perceptualHashReversed: '01ef7856cdab3412',
      mediaUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800'
    });
    assert.strictEqual(postRes.status, 201);
    assert.ok(postRes.body.id);
  });

  await t.test('7. Cross-User duplicate check: @ranna tries to repost Eva\'s photo (globally rejected)', async () => {
    const checkRes = await postJson('/api/posts/check-duplicate', {
      perceptualHash: '1234abcd5678ef01',
      perceptualHashReversed: '01ef7856cdab3412'
    });
    assert.strictEqual(checkRes.status, 200);
    assert.strictEqual(checkRes.body.isDuplicate, true);
    assert.strictEqual(
      checkRes.body.error,
      'Duplicate Detected (Rejected) - Hyperledger Fabric Security: This media file (or a cropped/filtered/trimmed/rotated variant) has already been immutably registered on the channel ledger by another transaction.'
    );
  });

  await t.test('8. Cross-User post submission rejection: @elena tries to submit duplicate post', async () => {
    const dupSubmit = await postJson('/api/posts', {
      authorId: 'user_elena',
      contentHash: 'bafyelena_copy_' + Date.now(),
      caption: 'Trying to repost Eva\'s lecture slide',
      perceptualHash: '1234abcd5678ef01',
      perceptualHashReversed: '01ef7856cdab3412',
      mediaUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800'
    });
    assert.strictEqual(dupSubmit.status, 409);
    assert.strictEqual(dupSubmit.body.tamperProofError, true);
    assert.strictEqual(
      dupSubmit.body.error,
      'Duplicate Detected (Rejected) - Hyperledger Fabric Security: This media file (or a cropped/filtered/trimmed/rotated variant) has already been immutably registered on the channel ledger by another transaction.'
    );
  });

  await t.test('9. Shared feed synchronization: Eva\'s post is visible in global feed to all users', async () => {
    const feedRes = await getJson('/api/posts/feed');
    assert.strictEqual(feedRes.status, 200);
    const found = feedRes.body.find(p => p.authorId === 'user_teacher_eva');
    assert.ok(found, 'Eva\'s post must be present in the shared centralized feed');
  });

  await t.test('teardown server', async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
