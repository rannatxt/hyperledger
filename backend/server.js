'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/config');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const ipfsRoutes = require('./routes/ipfsRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static uploads serving fallback with cloud storage layer
app.use('/uploads', express.static(config.uploadDir));
app.get('/uploads/:filename', (req, res, next) => {
  try {
    const cloudStorage = require('./services/cloudStorage');
    const filename = req.params.filename;
    const cid = filename.split('.')[0];
    const fileEntry = cloudStorage.get(cid);
    if (fileEntry && fileEntry.buffer) {
      res.setHeader('Content-Type', fileEntry.meta?.mimeType || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.end(fileEntry.buffer);
    }
    next();
  } catch (e) {
    next();
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/ledger', ledgerRoutes);

// System Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'InstaLedger Backend Middleware',
    time: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: `Path not found: ${req.method} ${req.url}` });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

let server = null;
if (!process.env.VERCEL) {
  server = app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 InstaLedger Backend running on http://localhost:${config.port}`);
    console.log(`⛓️  Channel: ${config.channelName} | Chaincode: ${config.chaincodeName}`);
    console.log(`📦 IPFS simulated storage directory: ${config.uploadDir}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
module.exports.app = app;
module.exports.server = server;
