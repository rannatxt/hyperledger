'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fabricClient = require('../services/fabricClient');
const ipfsService = require('../services/ipfsService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Create post (handles file upload to IPFS -> commits metadata to Fabric ledger)
router.post('/', upload.single('media'), async (req, res) => {
  try {
    let { authorId, caption, contentHash, mediaUrl } = req.body;

    if (!authorId) {
      return res.status(400).json({ error: 'authorId is required' });
    }

    // If file was uploaded in the request, store it in IPFS mock first
    if (req.file) {
      const ipfsRecord = await ipfsService.uploadBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      contentHash = ipfsRecord.cid;
      mediaUrl = `/api/ipfs/${ipfsRecord.cid}`;
    }

    if (!contentHash) {
      return res.status(400).json({ error: 'Either media file or contentHash (IPFS CID) is required' });
    }

    const postId = 'post_' + crypto.randomBytes(8).toString('hex');

    // Submit transaction to Hyperledger Fabric
    const result = await fabricClient.submitTransaction(
      'createPost',
      postId,
      authorId,
      contentHash,
      caption || '',
      mediaUrl || `/api/ipfs/${contentHash}`
    );

    const postRecord = JSON.parse(result);
    res.status(201).json(postRecord);
  } catch (err) {
    console.error('Error creating post on ledger:', err);
    if (err.message && err.message.includes('Tamper-proof error')) {
      return res.status(409).json({ error: err.message, tamperProofError: true });
    }
    res.status(400).json({ error: err.message });
  }
});

// Check duplicate photo hash
router.post('/check-duplicate', async (req, res) => {
  try {
    const { contentHash } = req.body;
    if (!contentHash) {
      return res.status(400).json({ error: 'contentHash is required' });
    }
    const rawFeed = await fabricClient.evaluateTransaction('getFeed');
    const posts = JSON.parse(rawFeed);
    const existing = posts.find(p => p.contentHash && p.contentHash.toLowerCase() === contentHash.trim().toLowerCase());
    if (existing) {
      return res.json({
        isDuplicate: true,
        error: 'Tamper-proof error: This exact photo has already been immutably recorded on the ledger.',
        existingPost: existing
      });
    }
    res.json({ isDuplicate: false, message: 'Cryptographically unique' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get global feed
router.get('/feed', async (req, res) => {
  try {
    const raw = await fabricClient.evaluateTransaction('getFeed');
    const posts = JSON.parse(raw);

    const viewerId = req.query.viewerId;
    if (viewerId) {
      // Check like status for viewer
      const enriched = await Promise.all(
        posts.map(async (post) => {
          try {
            const likeStatusRaw = await fabricClient.evaluateTransaction('checkIfLiked', post.id, viewerId);
            const { liked } = JSON.parse(likeStatusRaw);
            return { ...post, isLikedByViewer: liked };
          } catch (e) {
            return { ...post, isLikedByViewer: false };
          }
        })
      );
      return res.json(enriched);
    }

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const raw = await fabricClient.evaluateTransaction('getPost', req.params.id);
    const post = JSON.parse(raw);

    const viewerId = req.query.viewerId;
    if (viewerId) {
      try {
        const likeStatusRaw = await fabricClient.evaluateTransaction('checkIfLiked', post.id, viewerId);
        const { liked } = JSON.parse(likeStatusRaw);
        post.isLikedByViewer = liked;
      } catch (e) {
        post.isLikedByViewer = false;
      }
    }

    res.json(post);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Get posts by author
router.get('/author/:authorId', async (req, res) => {
  try {
    const raw = await fabricClient.evaluateTransaction('getPostsByAuthor', req.params.authorId);
    const posts = JSON.parse(raw);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
