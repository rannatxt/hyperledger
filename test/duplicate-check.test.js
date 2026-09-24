'use strict';

const assert = require('assert');
const crypto = require('crypto');
const perceptualHash = require('../backend/services/perceptualHash');

console.log('🧪 Running Comprehensive Global Tamper-Proof & Perceptual Hashing Duplicate Verification Test...\n');

// In-memory ledger simulation implementing the Hyperledger Fabric chaincode logic
const worldStatePosts = new Map();
const contentHashes = new Set();
const perceptualHashes = new Set();

const REQUIRED_ALERT = 'Blockchain Security Alert: This image (or a heavily similar variant) has already been immutably registered on the ledger by another user.';

function submitPostToLedger(authorId, caption, imageBuffer, mimeType = 'image/jpeg') {
  const fp = perceptualHash.computePerceptualFingerprint(imageBuffer, mimeType);
  const { sha256, pHash, pHashReversed } = fp;

  // 1. Exact cryptographic hash check
  if (contentHashes.has(sha256)) {
    throw new Error(REQUIRED_ALERT);
  }

  // 2. Global perceptual similarity check against all registered ledger posts
  const uniqueness = perceptualHash.checkGlobalUniqueness(
    sha256,
    pHash,
    pHashReversed,
    Array.from(worldStatePosts.values()),
    perceptualHash.DEFAULT_DISTANCE_THRESHOLD
  );

  if (uniqueness.isDuplicate) {
    throw new Error(uniqueness.message || REQUIRED_ALERT);
  }

  const postId = 'post_' + crypto.randomBytes(6).toString('hex');
  const postRecord = {
    id: postId,
    authorId,
    caption,
    contentHash: sha256,
    perceptualHash: pHash,
    perceptualHashReversed: pHashReversed,
    timestamp: new Date().toISOString()
  };

  worldStatePosts.set(postId, postRecord);
  contentHashes.add(sha256);
  perceptualHashes.add(pHash);

  return postRecord;
}

// Generate test image buffers
function generateGradientImage(w, h, noise = 0) {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const n = (Math.random() - 0.5) * noise * 255;
      data[idx] = Math.min(255, Math.max(0, Math.floor((x / w) * 255 + n)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.floor((y / h) * 255 + n)));
      data[idx + 2] = 120;
      data[idx + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

// Helper to flip image horizontally
function flipImg(img) {
  const { width, height, data } = img;
  const flipped = new Uint8Array(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = (y * width + (width - 1 - x)) * 4;
      flipped[dstIdx] = data[srcIdx];
      flipped[dstIdx + 1] = data[srcIdx + 1];
      flipped[dstIdx + 2] = data[srcIdx + 2];
      flipped[dstIdx + 3] = data[srcIdx + 3];
    }
  }
  return { width, height, data: flipped };
}

// Helper to center-crop image
function cropImg(img, factor = 0.85) {
  const { width, height, data } = img;
  const cropW = Math.max(1, Math.floor(width * factor));
  const cropH = Math.max(1, Math.floor(height * factor));
  const startX = Math.floor((width - cropW) / 2);
  const startY = Math.floor((height - cropH) / 2);
  const cropped = new Uint8Array(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((startY + y) * width + (startX + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;
      cropped[dstIdx] = data[srcIdx];
      cropped[dstIdx + 1] = data[srcIdx + 1];
      cropped[dstIdx + 2] = data[srcIdx + 2];
      cropped[dstIdx + 3] = data[srcIdx + 3];
    }
  }
  return { width: cropW, height: cropH, data: cropped };
}

// Convert image data object to mock buffer for test
const imgOriginal = generateGradientImage(64, 64, 0);
const imgFlipped = flipImg(imgOriginal);
const imgCropped = cropImg(imgOriginal, 0.85);
const imgDifferent = generateGradientImage(64, 64, 0);
// Invert colors to make it completely distinct
for (let i = 0; i < imgDifferent.data.length; i += 4) {
  imgDifferent.data[i] = 255 - imgDifferent.data[i];
  imgDifferent.data[i + 1] = 255 - imgDifferent.data[i + 1];
}

const bufOriginal = Buffer.from(imgOriginal.data);
const bufFlipped = Buffer.from(imgFlipped.data);
const bufCropped = Buffer.from(imgCropped.data);
const bufDifferent = Buffer.from(imgDifferent.data);

// ── TEST 1: Initial upload of photo A by user_ranna ──
console.log('1. User @ranna uploads original photo A...');
const postA = submitPostToLedger('user_ranna', 'Original sunset shot on Fabric', bufOriginal);
assert.ok(postA.id);
assert.ok(postA.contentHash);
assert.ok(postA.perceptualHash);
console.log('   ✅ Successfully committed to ledger:', postA.id);
console.log('   SHA-256:', postA.contentHash);
console.log('   pHash:  ', postA.perceptualHash);
console.log('   pHashRev:', postA.perceptualHashReversed);

// ── TEST 2: Exact binary duplicate uploaded by user_elena ──
console.log('\n2. User @elena attempts exact binary duplicate of photo A...');
let exactCaught = false;
try {
  submitPostToLedger('user_elena', 'Trying to repost exact photo A', bufOriginal);
} catch (err) {
  exactCaught = true;
  assert.strictEqual(err.message, REQUIRED_ALERT);
  console.log('   ✅ Rejected immediately with required security alert:');
  console.log(`   "${err.message}"`);
}
assert.strictEqual(exactCaught, true, 'Exact duplicate must be rejected');

// ── TEST 3: Horizontally reversed (flipped) photo A uploaded by user_marcus ──
console.log('\n3. User @marcus attempts reversed (horizontally flipped) upload of photo A...');
let reversedCaught = false;
try {
  submitPostToLedger('user_marcus', 'Flipped horizontally to evade duplicate checks', bufFlipped);
} catch (err) {
  reversedCaught = true;
  assert.strictEqual(err.message, REQUIRED_ALERT);
  console.log('   ✅ Rejected immediately with required security alert:');
  console.log(`   "${err.message}"`);
}
assert.strictEqual(reversedCaught, true, 'Reversed/flipped photo must be rejected');

// ── TEST 4: Cropped / compressed photo A uploaded by user_copycat ──
console.log('\n4. User @copycat attempts cropped/compressed upload of photo A...');
let croppedCaught = false;
try {
  submitPostToLedger('user_copycat', 'Cropped border variant of photo A', bufCropped);
} catch (err) {
  croppedCaught = true;
  assert.strictEqual(err.message, REQUIRED_ALERT);
  console.log('   ✅ Rejected immediately with required security alert:');
  console.log(`   "${err.message}"`);
}
assert.strictEqual(croppedCaught, true, 'Cropped/modified photo must be rejected');

// ── TEST 5: Distinct unique photo B uploaded by user_marcus ──
console.log('\n5. User @marcus uploads a genuine unique photo B...');
const postB = submitPostToLedger('user_marcus', 'New unique digital creation', bufDifferent);
assert.ok(postB.id);
assert.notStrictEqual(postB.id, postA.id);
console.log('   ✅ Unique photo successfully committed to ledger:', postB.id);
console.log('   SHA-256:', postB.contentHash);
console.log('   pHash:  ', postB.perceptualHash);

console.log('\n🎉 ALL GLOBAL TAMPER-PROOF & PERCEPTUAL HASHING TESTS PASSED PERFECTLY!\n');
