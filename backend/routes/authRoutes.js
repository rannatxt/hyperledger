'use strict';

const express = require('express');
const router = express.Router();
const fabricClient = require('../services/fabricClient');

// Register profile
router.post('/register', async (req, res) => {
  try {
    const { userId, username, displayName, bio, avatarUrl } = req.body;
    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' });
    }

    const result = await fabricClient.submitTransaction(
      'createProfile',
      userId,
      username,
      displayName || username,
      bio || '',
      avatarUrl || ''
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
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Get profile by username
router.get('/profile/username/:username', async (req, res) => {
  try {
    const result = await fabricClient.evaluateTransaction('getProfileByUsername', req.params.username);
    res.json(JSON.parse(result));
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

// List all profiles
router.get('/users', async (req, res) => {
  try {
    const result = await fabricClient.evaluateTransaction('getAllProfiles');
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
