'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const ipfsService = require('../services/ipfsService');

// Multer memory storage so we can hash the buffer directly for IPFS CID
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max
  }
});

// Upload file to IPFS
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided in request' });
    }

    const ipfsRecord = await ipfsService.uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.status(201).json({
      success: true,
      cid: ipfsRecord.cid,
      url: `/api/ipfs/${ipfsRecord.cid}`,
      meta: ipfsRecord
    });
  } catch (err) {
    console.error('IPFS upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Retrieve file by CID
router.get('/:cid', (req, res) => {
  try {
    const { cid } = req.params;
    const fileInfo = ipfsService.getFile(cid);

    if (!fileInfo || !fs.existsSync(fileInfo.filePath)) {
      return res.status(404).json({ error: `Content hash ${cid} not found on IPFS node` });
    }

    res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // IPFS content is immutable
    res.setHeader('X-IPFS-CID', cid);

    const stream = fs.createReadStream(fileInfo.filePath);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get CID metadata
router.get('/metadata/:cid', (req, res) => {
  const fileInfo = ipfsService.getFile(req.params.cid);
  if (!fileInfo) {
    return res.status(404).json({ error: `CID ${req.params.cid} not found` });
  }
  res.json(fileInfo);
});

// Get IPFS node stats
router.get('/node/stats', (req, res) => {
  res.json(ipfsService.getStats());
});

module.exports = router;
