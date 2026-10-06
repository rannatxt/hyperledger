'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
process.env.VERCEL = 'true';
const app = require('../backend/server');
const fabricClient = require('../backend/services/fabricClient');
const cloudStorage = require('../backend/services/cloudStorage');
const ipfsService = require('../backend/services/ipfsService');

test('API Features: Video thumbnails, delete post, and cloud storage', async (t) => {
  let server;
  let port;

  await t.test('setup server', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  let createdPostId;
  const testThumbnail = 'data:image/svg+xml;utf8,<svg><text>VideoThumb</text></svg>';

  await t.test('create video post with thumbnail and cloud storage', async () => {
    // 1. Upload mock video buffer
    const videoBuffer = Buffer.from('mock video bytes for automated testing ' + Date.now());
    const uploadRes = await cloudStorage.upload(videoBuffer, 'test_video.mp4', 'video/mp4');
    assert.ok(uploadRes.cid);
    assert.ok(uploadRes.cloudUrl);

    // Retrieve through ipfsService & cloud storage
    const retrieved = ipfsService.getFile(uploadRes.cid);
    assert.ok(retrieved);
    assert.ok(retrieved.buffer);
    assert.equal(retrieved.buffer.length, videoBuffer.length);

    // 2. Submit post to ledger
    const postRes = await fabricClient.submitTransaction(
      'createPost',
      'post_vid_test_' + Date.now(),
      'user_ranna',
      uploadRes.cid,
      'Test Video with Extracted Thumbnail',
      `/api/ipfs/${uploadRes.cid}`,
      'a1b2c3d4e5f60718',
      '1807f6e5d4c3b2a1',
      'video',
      'VF1:a1b2c3d4e5f60718,b2c3d4e5f60718a1|1807f6e5d4c3b2a1,a11807f6e5d4c3b2',
      testThumbnail
    );

    const postObj = JSON.parse(postRes);
    createdPostId = postObj.id;
    assert.equal(postObj.mediaType, 'video');
    assert.equal(postObj.thumbnailUrl, testThumbnail);
  });

  await t.test('verify post exists in feed with thumbnail', async () => {
    const rawFeed = await fabricClient.evaluateTransaction('getFeed');
    const feed = JSON.parse(rawFeed);
    const found = feed.find(p => p.id === createdPostId);
    assert.ok(found);
    assert.equal(found.thumbnailUrl, testThumbnail);
  });

  await t.test('unauthorized user cannot delete post', async () => {
    const res = await fetch(`http://localhost:${port}/api/posts/${createdPostId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId: 'user_elena' })
    });
    assert.equal(res.status, 403);
  });

  await t.test('post author can delete post and it vanishes from feed', async () => {
    const res = await fetch(`http://localhost:${port}/api/posts/${createdPostId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId: 'user_ranna' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.deletedPostId, createdPostId);

    // Verify gone from feed
    const rawFeed = await fabricClient.evaluateTransaction('getFeed');
    const feed = JSON.parse(rawFeed);
    const found = feed.find(p => p.id === createdPostId);
    assert.equal(found, undefined);
  });

  await t.test('teardown server', async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });
});
