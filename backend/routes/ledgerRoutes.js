'use strict';

const express = require('express');
const router = express.Router();
const fabricClient = require('../services/fabricClient');
const ipfsService = require('../services/ipfsService');

// Get all blocks
router.get('/blocks', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
  const blocks = fabricClient.getBlocks(limit);
  res.json(blocks);
});

// Get block by number
router.get('/blocks/:number', (req, res) => {
  const block = fabricClient.getBlock(req.params.number);
  if (!block) {
    return res.status(404).json({ error: `Block #${req.params.number} not found` });
  }
  res.json(block);
});

// Get transaction by ID
router.get('/transactions/:txId', (req, res) => {
  const tx = fabricClient.getTransaction(req.params.txId);
  if (!tx) {
    return res.status(404).json({ error: `Transaction ${req.params.txId} not found` });
  }
  res.json(tx);
});

// Get ledger health and metrics
router.get('/status', (req, res) => {
  const ledgerStatus = fabricClient.getStatus();
  const ipfsStatus = ipfsService.getStats();

  res.json({
    name: 'InstaLedger Blockchain & Storage Core',
    timestamp: new Date().toISOString(),
    ledger: ledgerStatus,
    ipfs: ipfsStatus
  });
});

module.exports = router;
