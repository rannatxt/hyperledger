'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fabricClient = require('../services/fabricClient');
const ipfsService = require('../services/ipfsService');
const perceptualHashService = require('../services/perceptualHash');

const STRICT_FABRIC_WARNING = 'Duplicate Detected (Rejected) - Hyperledger Fabric Security: This media file (or its cropped/filtered/trimmed/rotated variant) has already been immutably registered on the channel ledger.';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB for video support
});

// Create post (handles file upload to IPFS -> commits metadata to Fabric ledger)
router.post('/', upload.single('media'), async (req, res) => {
  try {
    let {
      authorId,
      caption,
      contentHash,
      mediaUrl,
      perceptualHash,
      perceptualHashReversed,
      mediaType = 'image',
      videoFingerprint = '',
      thumbnailUrl = '',
      pHashFlippedY = '',
      pHashRot180 = ''
    } = req.body;

    if (!authorId) {
      return res.status(400).json({ error: 'authorId is required' });
    }

    // If file was uploaded in the request, store it in IPFS mock and compute multi-media fingerprint
    if (req.file) {
      const isVideo = req.file.mimetype.startsWith('video/') || perceptualHashService.isVideoBuffer(req.file.buffer);
      mediaType = isVideo ? 'video' : 'image';

      const ipfsRecord = await ipfsService.uploadBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      contentHash = ipfsRecord.cid;
      mediaUrl = `/api/ipfs/${ipfsRecord.cid}`;

      const fp = perceptualHashService.computePerceptualFingerprint(req.file.buffer, req.file.mimetype);
      perceptualHash = fp.pHash;
      perceptualHashReversed = fp.pHashReversed;
      pHashFlippedY = fp.pHashFlippedY || '';
      pHashRot180 = fp.pHashRot180 || '';
      if (isVideo) {
        videoFingerprint = fp.videoFingerprint;
      }
    }

    if (!contentHash) {
      return res.status(400).json({ error: 'Either media file or contentHash (IPFS CID) is required' });
    }

    // Prior global check against all world state posts before ledger commit
    try {
      const rawFeed = await fabricClient.evaluateTransaction('getFeed');
      const allPosts = JSON.parse(rawFeed);
      const uniqueness = perceptualHashService.checkGlobalUniqueness(
        contentHash,
        perceptualHash,
        perceptualHashReversed,
        allPosts,
        12,
        mediaType,
        videoFingerprint,
        pHashFlippedY
      );
      if (uniqueness.isDuplicate) {
        return res.status(409).json({
          error: STRICT_FABRIC_WARNING,
          tamperProofError: true,
          matchType: uniqueness.matchType,
          existingPost: uniqueness.existingPost
        });
      }
    } catch (checkErr) {
      if (checkErr.message && (checkErr.message.includes('Tamper-Proof') || checkErr.message.includes('Duplicate Detected'))) {
        return res.status(409).json({
          error: STRICT_FABRIC_WARNING,
          tamperProofError: true
        });
      }
    }

    const postId = 'post_' + crypto.randomBytes(8).toString('hex');

    if (mediaType === 'video' && !thumbnailUrl) {
      thumbnailUrl = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80';
    }

    // Submit transaction to Hyperledger Fabric
    const result = await fabricClient.submitTransaction(
      'createPost',
      postId,
      authorId,
      contentHash,
      caption || '',
      mediaUrl || `/api/ipfs/${contentHash}`,
      perceptualHash || '',
      perceptualHashReversed || '',
      mediaType || 'image',
      videoFingerprint || '',
      thumbnailUrl || ''
    );

    const postRecord = JSON.parse(result);
    res.status(201).json(postRecord);
  } catch (err) {
    console.error('Error creating post on ledger:', err);
    if (
      err.message &&
      (err.message.includes('Tamper-Proof Security Error') ||
       err.message.includes('Tamper-Proof Blockchain Security') ||
       err.message.includes('Blockchain Security Alert') ||
       err.message.includes('Tamper-proof') ||
       err.message.includes('Duplicate Detected'))
    ) {
      return res.status(409).json({
        error: STRICT_FABRIC_WARNING,
        tamperProofError: true
      });
    }
    res.status(400).json({ error: err.message });
  }
});

// Check duplicate media hash (handles cryptographic, perceptual, & temporal video frame sequence matching)
router.post('/check-duplicate', upload.single('media'), async (req, res) => {
  try {
    let {
      contentHash,
      perceptualHash,
      perceptualHashReversed,
      mediaType = 'image',
      videoFingerprint = '',
      pHashFlippedY = '',
      pHashRot180 = ''
    } = req.body;

    // If a media file was attached, compute SHA-256 and multi-media fingerprints on the fly
    if (req.file) {
      const fp = perceptualHashService.computePerceptualFingerprint(req.file.buffer, req.file.mimetype);
      contentHash = fp.sha256;
      perceptualHash = fp.pHash;
      perceptualHashReversed = fp.pHashReversed;
      pHashFlippedY = fp.pHashFlippedY || '';
      pHashRot180 = fp.pHashRot180 || '';
      mediaType = fp.mediaType;
      videoFingerprint = fp.videoFingerprint || '';
    }

    if (!contentHash && !perceptualHash && !videoFingerprint) {
      return res.status(400).json({ error: 'Either media file, contentHash, perceptualHash, or videoFingerprint is required' });
    }

    // 1. Evaluate against Fabric chaincode
    let chaincodeDuplicate = false;
    let checkResult = {};
    try {
      const rawCheck = await fabricClient.evaluateTransaction(
        'checkDuplicateMedia',
        contentHash || '',
        perceptualHash || '',
        perceptualHashReversed || '',
        mediaType || 'image',
        videoFingerprint || ''
      );
      checkResult = JSON.parse(rawCheck);
      if (checkResult.isDuplicate) {
        chaincodeDuplicate = true;
      }
    } catch (e) {
      console.warn('Chaincode check duplicate evaluation warning:', e.message);
    }

    // 2. Cross-verify against all world state posts via perceptualHashService
    let globalMatch = false;
    let globalResult = {};
    try {
      const rawFeed = await fabricClient.evaluateTransaction('getFeed');
      const allPosts = JSON.parse(rawFeed);
      globalResult = perceptualHashService.checkGlobalUniqueness(
        contentHash,
        perceptualHash,
        perceptualHashReversed,
        allPosts,
        12,
        mediaType,
        videoFingerprint,
        pHashFlippedY
      );
      if (globalResult.isDuplicate) {
        globalMatch = true;
      }
    } catch (e) {
      console.warn('Global check evaluation warning:', e.message);
    }

    if (chaincodeDuplicate || globalMatch) {
      const resMatch = chaincodeDuplicate ? checkResult : globalResult;
      return res.json({
        isDuplicate: true,
        matchType: resMatch.matchType || 'perceptual',
        distance: resMatch.distance,
        similarity: resMatch.similarity,
        existingPost: resMatch.existingPost,
        error: STRICT_FABRIC_WARNING
      });
    }

    res.json({
      isDuplicate: false,
      message: 'Cryptographically, temporally, and perceptually unique',
      contentHash,
      perceptualHash,
      perceptualHashReversed,
      mediaType,
      videoFingerprint
    });
  } catch (err) {
    console.error('Error in check-duplicate:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get global shared feed
router.get('/feed', async (req, res) => {
  try {
    const raw = await fabricClient.evaluateTransaction('getFeed');
    const posts = JSON.parse(raw);

    const viewerId = req.query.viewerId;
    if (viewerId) {
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

// Get community explore posts (shared across all accounts on the network)
router.get('/explore', async (req, res) => {
  try {
    const raw = await fabricClient.evaluateTransaction('getFeed');
    const posts = JSON.parse(raw);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get posts by author
router.get('/user/:userId', async (req, res) => {
  try {
    const raw = await fabricClient.evaluateTransaction('getPostsByAuthor', req.params.userId);
    const posts = JSON.parse(raw);
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

// Delete post by ID (validates author ownership on Fabric chaincode)
router.delete('/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.body?.authorId || req.query?.authorId || '';
    const result = await fabricClient.submitTransaction('deletePost', postId, authorId);
    res.json(JSON.parse(result));
  } catch (err) {
    console.error('Error deleting post on ledger:', err);
    const isUnauthorized = err.message && err.message.includes('Unauthorized');
    res.status(isUnauthorized ? 403 : 400).json({ error: err.message });
  }
});

module.exports = router;
