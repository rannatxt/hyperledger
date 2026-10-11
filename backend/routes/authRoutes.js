'use strict';

const express = require('express');
const router = express.Router();
const fabricClient = require('../services/fabricClient');
const authService = require('../services/authService');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const authResult = await authService.authenticateUser(username, password);
    res.json(authResult);
  } catch (err) {
    console.warn('Login failure:', err.message);
    res.status(401).json({ error: err.message || 'Authentication failed' });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, displayName, password, bio, avatarUrl, mspId } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const regResult = await authService.registerUser({
      username,
      displayName,
      password,
      bio,
      avatarUrl,
      mspId
    });

    res.status(201).json(regResult);
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/auth/me (Resolves current user identity from Bearer token)
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    // Fetch fresh profile from Fabric ledger
    try {
      const raw = await fabricClient.evaluateTransaction('getProfile', decoded.id);
      const profile = JSON.parse(raw);
      return res.json({
        user: {
          ...profile,
          mspId: profile.mspId || decoded.mspId || 'Org1MSP'
        }
      });
    } catch (e) {
      // Return decoded if user not yet fetched
      return res.json({ user: decoded });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register profile (legacy endpoint)
router.post('/register', async (req, res) => {
  try {
    const { userId, username, displayName, bio, avatarUrl, mspId } = req.body;
    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }

    const result = await fabricClient.submitTransaction(
      'createProfile',
      userId,
      username,
      displayName || username,
      bio || '',
      avatarUrl || '',
      mspId || 'Org1MSP'
    );

    res.status(201).json(JSON.parse(result));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get profile by ID
router.get('/profile/:id', async (req, res) => {
  try {
    const result = await fabricClient.evaluateTransaction('getProfile', req.params.id);
    const profile = JSON.parse(result);
    profile.mspId = profile.mspId || authService.MSP_MAP[profile.username] || 'Org1MSP';
    res.json(profile);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Get profile by username
router.get('/profile/username/:username', async (req, res) => {
  try {
    const result = await fabricClient.evaluateTransaction('getProfileByUsername', req.params.username);
    const profile = JSON.parse(result);
    profile.mspId = profile.mspId || authService.MSP_MAP[profile.username] || 'Org1MSP';
    res.json(profile);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Update profile
router.put('/profile/:id', async (req, res) => {
  try {
    const { displayName, bio, avatarUrl } = req.body;
    const result = await fabricClient.submitTransaction(
      'updateProfile',
      req.params.id,
      displayName,
      bio,
      avatarUrl
    );
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List all profiles on Fabric
router.get('/users', async (req, res) => {
  try {
    const result = await fabricClient.evaluateTransaction('getAllProfiles');
    const profiles = JSON.parse(result);
    const enriched = profiles.map(p => ({
      ...p,
      mspId: p.mspId || authService.MSP_MAP[p.username] || 'Org1MSP'
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
