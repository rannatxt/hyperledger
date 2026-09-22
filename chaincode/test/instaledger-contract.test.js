'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const InstaLedgerContract = require('../lib/instaledger-contract');
const { fromBuffer } = require('../lib/utils');

class MockIterator {
  constructor(items) {
    this.items = items;
    this.currentIndex = 0;
  }

  async next() {
    if (this.currentIndex < this.items.length) {
      const item = this.items[this.currentIndex++];
      return { value: item, done: false };
    }
    return { value: null, done: true };
  }

  async close() {
    this.items = [];
  }
}

class MockChaincodeStub {
  constructor() {
    this.state = new Map();
  }

  async putState(key, value) {
    this.state.set(key, Buffer.isBuffer(value) ? value : Buffer.from(value));
  }

  async getState(key) {
    return this.state.get(key) || Buffer.alloc(0);
  }

  async deleteState(key) {
    this.state.delete(key);
  }

  createCompositeKey(objectType, attributes) {
    return `\u0000${objectType}\u0000${attributes.join('\u0000')}\u0000`;
  }

  splitCompositeKey(compositeKey) {
    const parts = compositeKey.split('\u0000').filter(p => p.length > 0);
    return {
      objectType: parts[0],
      attributes: parts.slice(1)
    };
  }

  async getStateByRange(startKey, endKey) {
    const results = [];
    for (const [key, value] of this.state.entries()) {
      if (key >= startKey && (endKey === '' || key <= endKey)) {
        results.push({ key, value });
      }
    }
    return new MockIterator(results);
  }

  async getStateByPartialCompositeKey(objectType, attributes) {
    const prefix = `\u0000${objectType}\u0000${attributes.join('\u0000')}`;
    const results = [];
    for (const [key, value] of this.state.entries()) {
      if (key.startsWith(prefix)) {
        results.push({ key, value });
      }
    }
    return new MockIterator(results);
  }
}

function createMockContext() {
  return {
    stub: new MockChaincodeStub()
  };
}

test('InstaLedgerContract test suite', async (t) => {
  const contract = new InstaLedgerContract();

  await t.test('initLedger seeds genesis profiles, posts, and interactions', async () => {
    const ctx = createMockContext();
    const result = await contract.initLedger(ctx);
    assert.ok(result.includes('SUCCESS'));

    const profile = JSON.parse(await contract.getProfile(ctx, 'user_ranna'));
    assert.equal(profile.username, 'ranna');
    assert.equal(profile.followerCount, 3);

    const feed = JSON.parse(await contract.getFeed(ctx));
    assert.equal(feed.length, 3);
    assert.equal(feed[0].id, 'post_genesis_03'); // newest first
  });

  await t.test('createProfile and getProfile', async () => {
    const ctx = createMockContext();
    const res = await contract.createProfile(
      ctx,
      'user_vitalik',
      'vitalik_eth',
      'Vitalik Buterin',
      'Ethereum co-founder',
      'https://example.com/vitalik.png'
    );
    const profile = JSON.parse(res);
    assert.equal(profile.id, 'user_vitalik');
    assert.equal(profile.username, 'vitalik_eth');

    const fetched = JSON.parse(await contract.getProfile(ctx, 'user_vitalik'));
    assert.equal(fetched.displayName, 'Vitalik Buterin');

    // Duplicate ID should reject
    await assert.rejects(async () => {
      await contract.createProfile(ctx, 'user_vitalik', 'vitalik_eth2', 'Vitalik 2', '', '');
    }, /already exists/);

    // Duplicate username should reject
    await assert.rejects(async () => {
      await contract.createProfile(ctx, 'user_another', 'vitalik_eth', 'Duplicate', '', '');
    }, /already taken/);
  });

  await t.test('createPost and getFeed', async () => {
    const ctx = createMockContext();
    await contract.createProfile(ctx, 'user_alice', 'alice_crypto', 'Alice', 'Bio', '');
    const postRes = await contract.createPost(
      ctx,
      'post_101',
      'user_alice',
      'bafybeigtestcid12345',
      'My first decentralized post! #web3',
      'https://example.com/photo.jpg'
    );
    const post = JSON.parse(postRes);
    assert.equal(post.id, 'post_101');
    assert.equal(post.contentHash, 'bafybeigtestcid12345');
    assert.equal(post.authorUsername, 'alice_crypto');

    const feed = JSON.parse(await contract.getFeed(ctx));
    assert.equal(feed.length, 1);
    assert.equal(feed[0].caption, 'My first decentralized post! #web3');
  });

  await t.test('likePost and unlikePost with atomic counter', async () => {
    const ctx = createMockContext();
    await contract.createProfile(ctx, 'user_bob', 'bob_crypto', 'Bob', '', '');
    await contract.createProfile(ctx, 'user_carol', 'carol_crypto', 'Carol', '', '');
    await contract.createPost(ctx, 'post_bob_1', 'user_bob', 'bafytest', 'Hello world', '');

    // Carol likes Bob's post
    const likeResult = JSON.parse(await contract.likePost(ctx, 'post_bob_1', 'user_carol'));
    assert.equal(likeResult.liked, true);
    assert.equal(likeResult.likeCount, 1);

    // Duplicate like must throw error
    await assert.rejects(async () => {
      await contract.likePost(ctx, 'post_bob_1', 'user_carol');
    }, /already liked/);

    // Verify post asset has likeCount 1
    const post = JSON.parse(await contract.getPost(ctx, 'post_bob_1'));
    assert.equal(post.likeCount, 1);

    // Check status
    const status = JSON.parse(await contract.checkIfLiked(ctx, 'post_bob_1', 'user_carol'));
    assert.equal(status.liked, true);

    // Unlike post
    const unlikeResult = JSON.parse(await contract.unlikePost(ctx, 'post_bob_1', 'user_carol'));
    assert.equal(unlikeResult.liked, false);
    assert.equal(unlikeResult.likeCount, 0);
  });

  await t.test('followUser and unfollowUser', async () => {
    const ctx = createMockContext();
    await contract.createProfile(ctx, 'user_dave', 'dave_node', 'Dave', '', '');
    await contract.createProfile(ctx, 'user_eve', 'eve_peer', 'Eve', '', '');

    // Prevent self-follow
    await assert.rejects(async () => {
      await contract.followUser(ctx, 'user_dave', 'user_dave');
    }, /cannot follow themselves/);

    // Dave follows Eve
    const followRes = JSON.parse(await contract.followUser(ctx, 'user_dave', 'user_eve'));
    assert.equal(followRes.following, true);
    assert.equal(followRes.followerFollowingCount, 1);
    assert.equal(followRes.targetFollowerCount, 1);

    // Duplicate follow should fail
    await assert.rejects(async () => {
      await contract.followUser(ctx, 'user_dave', 'user_eve');
    }, /already following/);

    // Unfollow
    const unfollowRes = JSON.parse(await contract.unfollowUser(ctx, 'user_dave', 'user_eve'));
    assert.equal(unfollowRes.following, false);
    assert.equal(unfollowRes.followerFollowingCount, 0);
    assert.equal(unfollowRes.targetFollowerCount, 0);
  });

  await t.test('addComment and getComments', async () => {
    const ctx = createMockContext();
    await contract.createProfile(ctx, 'user_frank', 'frank_web', 'Frank', '', '');
    await contract.createProfile(ctx, 'user_grace', 'grace_web', 'Grace', '', '');
    await contract.createPost(ctx, 'post_frank_1', 'user_frank', 'bafytest', 'Scenic view', '');

    await contract.addComment(ctx, 'post_frank_1', 'cmt_1', 'user_grace', 'Looks gorgeous! ✨');
    await contract.addComment(ctx, 'post_frank_1', 'cmt_2', 'user_frank', 'Thank you Grace!');

    const comments = JSON.parse(await contract.getComments(ctx, 'post_frank_1'));
    assert.equal(comments.length, 2);
    assert.equal(comments[0].text, 'Looks gorgeous! ✨');
    assert.equal(comments[1].text, 'Thank you Grace!');

    const post = JSON.parse(await contract.getPost(ctx, 'post_frank_1'));
    assert.equal(post.commentCount, 2);
  });
});
