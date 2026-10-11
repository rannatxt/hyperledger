'use strict';

const crypto = require('crypto');
const fabricClient = require('./fabricClient');

const JWT_SECRET = process.env.JWT_SECRET || 'instaledger_hyperledger_fabric_jwt_secret_2026';

// Known default/genesis passwords
const DEFAULT_PASSWORDS = {
  ranna: 'password123',
  elena: 'password123',
  elena_crypto: 'password123',
  marcus: 'password123',
  marcus_art: 'password123'
};

const MSP_MAP = {
  ranna: 'Org1MSP',
  elena: 'Org2MSP',
  elena_crypto: 'Org2MSP',
  marcus: 'Org3MSP',
  marcus_art: 'Org3MSP'
};

function hashPassword(password, salt) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, storedHash, salt) {
  if (!storedHash || !salt) return false;
  const { hash } = hashPassword(password, salt);
  return hash === storedHash;
}

function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    mspId: user.mspId || 'Org1MSP',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Get profile and ensure auth record exists
 */
async function authenticateUser(username, password) {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  const cleanUser = username.trim().toLowerCase();

  // Try retrieving profile from Fabric ledger
  let profile = null;
  try {
    const res = await fabricClient.evaluateTransaction('getProfileByUsername', cleanUser);
    profile = JSON.parse(res);
  } catch (err) {
    // If user typed 'elena' instead of 'elena_crypto' or vice versa
    if (cleanUser === 'elena') {
      try {
        const res = await fabricClient.evaluateTransaction('getProfileByUsername', 'elena_crypto');
        profile = JSON.parse(res);
      } catch (e) {}
    } else if (cleanUser === 'marcus') {
      try {
        const res = await fabricClient.evaluateTransaction('getProfileByUsername', 'marcus_art');
        profile = JSON.parse(res);
      } catch (e) {}
    }
  }

  if (!profile) {
    throw new Error(`Account @${username} does not exist. Please sign up.`);
  }

  // Check auth record on ledger
  let authRecord = null;
  try {
    const rawAuth = await fabricClient.evaluateTransaction('getUserAuth', profile.username);
    authRecord = JSON.parse(rawAuth);
  } catch (e) {}

  const defaultPass = DEFAULT_PASSWORDS[cleanUser] || DEFAULT_PASSWORDS[profile.username];
  let isValid = false;

  if (authRecord && authRecord.passwordHash && authRecord.salt) {
    isValid = verifyPassword(password, authRecord.passwordHash, authRecord.salt);
  }

  // Fallback for default seed accounts (ranna, elena, marcus)
  if (!isValid && defaultPass && password === defaultPass) {
    isValid = true;
    const { hash, salt } = hashPassword(password);
    authRecord = {
      userId: profile.id,
      username: profile.username,
      passwordHash: hash,
      salt,
      mspId: profile.mspId || MSP_MAP[profile.username] || 'Org1MSP'
    };
    try {
      await fabricClient.submitTransaction(
        'registerUserAuth',
        profile.id,
        profile.username,
        hash,
        salt,
        authRecord.mspId
      );
    } catch (errSubmit) {
      console.warn('Could not persist seed user auth to ledger:', errSubmit.message);
    }
  }

  if (!isValid) {
    throw new Error('Incorrect password');
  }

  const enrichedProfile = {
    ...profile,
    mspId: profile.mspId || authRecord.mspId || MSP_MAP[profile.username] || 'Org1MSP'
  };

  const token = generateToken(enrichedProfile);

  return {
    user: enrichedProfile,
    token
  };
}

/**
 * Register a new user on the Fabric ledger
 */
async function registerUser({ username, displayName, password, bio, avatarUrl, mspId }) {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  const cleanUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
    throw new Error('Username must be 3-24 characters containing only letters, numbers, and underscores');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const userId = 'user_' + cleanUsername;
  const resolvedMsp = mspId || (cleanUsername.length % 2 === 0 ? 'Org2MSP' : 'Org1MSP');
  const resolvedAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;
  const resolvedName = displayName || username;

  const { hash, salt } = hashPassword(password);

  // Submit createProfile transaction to Fabric
  const profileResult = await fabricClient.submitTransaction(
    'createProfile',
    userId,
    cleanUsername,
    resolvedName,
    bio || '',
    resolvedAvatar,
    resolvedMsp
  );
  const profile = JSON.parse(profileResult);

  // Submit auth registration transaction to Fabric
  try {
    await fabricClient.submitTransaction(
      'registerUserAuth',
      userId,
      cleanUsername,
      hash,
      salt,
      resolvedMsp
    );
  } catch (authErr) {
    console.warn('Warning storing user auth on ledger:', authErr.message);
  }

  const enrichedProfile = {
    ...profile,
    mspId: resolvedMsp
  };

  const token = generateToken(enrichedProfile);

  return {
    user: enrichedProfile,
    token
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  authenticateUser,
  registerUser,
  DEFAULT_PASSWORDS,
  MSP_MAP
};
