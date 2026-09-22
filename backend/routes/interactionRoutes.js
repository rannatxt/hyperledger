'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fabricClient = require('../services/fabricClient');

// LIKE a post
router.post('/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const result = await fabricClient.submitTransaction('likePost', req.params.id, userId);
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UNLIKE a post
router.delete('/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const result = await fabricClient.submitTransaction('unlikePost', req.params.id, userId);
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Check if liked
router.get('/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId query param is required' });
    }
    const result = await fabricClient.evaluateTransaction('checkIfLiked', req.params.id, userId);
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADD COMMENT to post
router.post('/posts/:id/comments', async (req, res) => {
  try {
    const { authorId, text } = req.body;
    if (!authorId || !text) {
      return res.status(400).json({ error: 'authorId and text are required' });
    }
    const commentId = 'cmt_' + crypto.randomBytes(6).toString('hex');
    const result = await fabricClient.submitTransaction(
      'addComment',
      req.params.id,
      commentId,
      authorId,
      text
    );
    res.status(201).json(JSON.parse(result));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET COMMENTS for post
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const result = await fabricClient.evaluateTransaction('getComments', req.params.id);
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// FOLLOW a user
router.post('/users/:id/follow', async (req, res) => {
  try {
    const { followerId } = req.body;
    if (!followerId) {
      return res.status(400).json({ error: 'followerId is required' });
    }
    const result = await fabricClient.submitTransaction('followUser', followerId, req.params.id);
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UNFOLLOW a user
router.delete('/users/:id/follow', async (req, res) => {
  try {
    const { followerId } = req.body;
    if (!followerId) {
      return res.status(400).json({ error: 'followerId is required' });
    }
    const result = await fabricClient.submitTransaction('unfollowUser', followerId, req.params.id);
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Check if following
router.get('/users/:id/follow', async (req, res) => {
  try {
    const { followerId } = req.query;
    if (!followerId) {
      return res.status(400).json({ error: 'followerId query param is required' });
    }
    const result = await fabricClient.evaluateTransaction('checkIfFollowing', followerId, req.params.id);
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
