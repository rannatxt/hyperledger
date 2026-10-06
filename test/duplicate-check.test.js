'use strict';

const assert = require('assert');
const crypto = require('crypto');
const perceptualHash = require('../backend/services/perceptualHash');
const videoFingerprint = require('../backend/services/videoFingerprint');

console.log('🧪 Running Comprehensive Global Tamper-Proof & Multi-Media Fingerprinting Duplicate Verification Test...\n');

// In-memory ledger simulation implementing the Hyperledger Fabric chaincode logic
const worldStatePosts = new Map();
const contentHashes = new Set();
const perceptualHashes = new Set();

const REQUIRED_ALERT = 'Tamper-Proof Security Error: This media (or a cropped/trimmed variant) already exists on the ledger.';

function submitPostToLedger(authorId, caption, mediaBuffer, mimeType = 'image/jpeg', mediaType = 'image', thumbnailUrl = '') {
  let sha256 = '';
  let pHash = '';
  let pHashReversed = '';
  let pHashFlippedY = '';
  let videoSignature = '';

  const isVideo = mediaType === 'video' || (mimeType && mimeType.startsWith('video/'));

  if (isVideo) {
    const vFp = videoFingerprint.computeVideoFingerprint(mediaBuffer, mimeType);
    sha256 = vFp.sha256;
    pHash = vFp.frameHashes[0] || '';
    pHashReversed = vFp.frameHashesReversed[0] || '';
    videoSignature = vFp.signature;
    if (!thumbnailUrl) thumbnailUrl = 'data:image/jpeg;base64,mockVideoKeyframeThumb';
  } else {
    const fp = perceptualHash.computePerceptualFingerprint(mediaBuffer, mimeType);
    sha256 = fp.sha256;
    pHash = fp.pHash;
    pHashReversed = fp.pHashReversed;
    pHashFlippedY = fp.pHashFlippedY || '';
  }

  // 1. Exact cryptographic hash check
  if (contentHashes.has(sha256)) {
    throw new Error(REQUIRED_ALERT);
  }

  // 2. Global perceptual & temporal multi-media similarity check against all registered ledger posts
  const uniqueness = perceptualHash.checkGlobalUniqueness(
    sha256,
    pHash,
    pHashReversed,
    Array.from(worldStatePosts.values()),
    perceptualHash.DEFAULT_DISTANCE_THRESHOLD,
    isVideo ? 'video' : 'image',
    videoSignature,
    pHashFlippedY
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
    perceptualHashFlippedY: pHashFlippedY,
    mediaType: isVideo ? 'video' : 'image',
    videoFingerprint: videoSignature,
    thumbnailUrl: thumbnailUrl || '',
    timestamp: new Date().toISOString()
  };

  worldStatePosts.set(postId, postRecord);
  contentHashes.add(sha256);
  if (pHash) perceptualHashes.add(pHash);

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

// Helper to flip image vertically
function flipImgVertical(img) {
  const { width, height, data } = img;
  const flipped = new Uint8Array(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = ((height - 1 - y) * width + x) * 4;
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
  return { width, cropH, data: cropped };
}

// Prepare image test fixtures
const imgOriginal = generateGradientImage(64, 64, 0);
const imgFlipped = flipImg(imgOriginal);
const imgFlippedY = flipImgVertical(imgOriginal);
const imgCropped = cropImg(imgOriginal, 0.85);
const imgDifferent = { width: 64, height: 64, data: new Uint8Array(64 * 64 * 4) };
for (let y = 0; y < 64; y++) {
  for (let x = 0; x < 64; x++) {
    const idx = (y * 64 + x) * 4;
    const dist = Math.sqrt((x - 32) ** 2 + (y - 32) ** 2);
    const ring = Math.floor(dist / 4) % 2 === 0 ? 230 : 20;
    imgDifferent.data[idx] = ring;
    imgDifferent.data[idx + 1] = ring;
    imgDifferent.data[idx + 2] = 200;
    imgDifferent.data[idx + 3] = 255;
  }
}

const bufOriginal = Buffer.from(imgOriginal.data);
const bufFlipped = Buffer.from(imgFlipped.data);
const bufFlippedY = Buffer.from(imgFlippedY.data);
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

// ── TEST 2: Exact binary photo duplicate uploaded by user_elena ──
console.log('\n2. User @elena attempts exact binary duplicate of photo A...');
let exactCaught = false;
try {
  submitPostToLedger('user_elena', 'Trying to repost exact photo A', bufOriginal);
} catch (err) {
  exactCaught = true;
  assert.strictEqual(err.message, REQUIRED_ALERT);
  console.log('   ✅ Rejected immediately with required tamper-proof security alert:');
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
  console.log('   ✅ Rejected immediately with required tamper-proof security alert:');
  console.log(`   "${err.message}"`);
}
assert.strictEqual(reversedCaught, true, 'Reversed/flipped photo must be rejected');

// ── TEST 3B: Vertically reversed (flipped Y) photo A uploaded by user_invert ──
console.log('\n3b. User @invert attempts vertically reversed upload of photo A...');
let vertCaught = false;
try {
  submitPostToLedger('user_invert', 'Flipped vertically to bypass hash comparison', bufFlippedY);
} catch (err) {
  vertCaught = true;
  assert.strictEqual(err.message, REQUIRED_ALERT);
  console.log('   ✅ Rejected immediately with required tamper-proof security alert:');
  console.log(`   "${err.message}"`);
}
assert.strictEqual(vertCaught, true, 'Vertically flipped photo must be rejected');

// ── TEST 4: Cropped / compressed photo A uploaded by user_copycat ──
console.log('\n4. User @copycat attempts cropped/compressed upload of photo A...');
let croppedCaught = false;
try {
  submitPostToLedger('user_copycat', 'Cropped border variant of photo A', bufCropped);
} catch (err) {
  croppedCaught = true;
  assert.strictEqual(err.message, REQUIRED_ALERT);
  console.log('   ✅ Rejected immediately with required tamper-proof security alert:');
  console.log(`   "${err.message}"`);
}
assert.strictEqual(croppedCaught, true, 'Cropped/modified photo must be rejected');

// ── VIDEO TEST FIXTURES ──
function createSyntheticVideoBuffer(framePats, length = 1280) {
  const buf = Buffer.alloc(length);
  for (let i = 0; i < length; i++) {
    const patIdx = Math.floor((i / length) * framePats.length);
    buf[i] = (framePats[patIdx] * 7 + (i % 53)) & 0xff;
  }
  return buf;
}

const vidOriginal = createSyntheticVideoBuffer([11, 44, 77, 110, 143, 176, 209, 242], 1280);
// Trimmed video: trimmed by 128 bytes at start and end (subsequence alignment)
const vidTrimmed = vidOriginal.slice(128, 1280 - 128);
// Cropped / re-encoded video: slightly modified payload (delta noise < 5)
const vidReencoded = Buffer.from(vidOriginal);
for (let i = 0; i < vidReencoded.length; i += 9) {
  vidReencoded[i] = (vidReencoded[i] + 1) & 0xff;
}
// Distinct video: completely different temporal signature
const vidUnique = Buffer.alloc(1280);
for (let i = 0; i < 1280; i++) {
  vidUnique[i] = Math.floor(Math.sin(i / 15) * 120 + 128);
}

// ── TEST 5: Original Video V1 uploaded by user_ranna ──
console.log('\n5. User @ranna uploads original video V1...');
const postV1 = submitPostToLedger('user_ranna', 'Original 4K drone reel on Fabric', vidOriginal, 'video/mp4', 'video');
assert.ok(postV1.id);
assert.equal(postV1.mediaType, 'video');
assert.ok(postV1.videoFingerprint);
console.log('   ✅ Successfully committed video to ledger:', postV1.id);
console.log('   Video Signature:', postV1.videoFingerprint.slice(0, 45) + '...');

// ── TEST 6: Exact duplicate video V1 uploaded by user_elena ──
console.log('\n6. User @elena attempts exact duplicate upload of video V1...');
let exactVidCaught = false;
try {
  submitPostToLedger('user_elena', 'Exact video repost attempt', vidOriginal, 'video/mp4', 'video');
} catch (err) {
  exactVidCaught = true;
  assert.strictEqual(err.message, REQUIRED_ALERT);
  console.log('   ✅ Rejected immediately with required tamper-proof security alert:');
  console.log(`   "${err.message}"`);
}
assert.strictEqual(exactVidCaught, true, 'Exact video duplicate must be rejected');

// ── TEST 7: Trimmed variant of video V1 uploaded by user_pirate (Trim Resistance) ──
console.log('\n7. User @pirate attempts trimmed edge variant of video V1 (Trim-Resistance Verification)...');
let trimCaught = false;
try {
  submitPostToLedger('user_pirate', 'Trimmed intro/outro to bypass detection', vidTrimmed, 'video/mp4', 'video');
} catch (err) {
  trimCaught = true;
  assert.strictEqual(err.message, REQUIRED_ALERT);
  console.log('   ✅ Blocked immediately! Overlapping sequence detected:');
  console.log(`   "${err.message}"`);
}
assert.strictEqual(trimCaught, true, 'Trimmed video must be rejected via subsequence alignment');

// ── TEST 8: Re-encoded / cropped variant of video V1 uploaded by user_bot ──
console.log('\n8. User @bot attempts re-encoded/cropped compression variant of video V1...');
let reencodeCaught = false;
try {
  submitPostToLedger('user_bot', 'Compressed re-encode', vidReencoded, 'video/mp4', 'video');
} catch (err) {
  reencodeCaught = true;
  assert.strictEqual(err.message, REQUIRED_ALERT);
  console.log('   ✅ Blocked immediately! Compression/crop delta detected:');
  console.log(`   "${err.message}"`);
}
assert.strictEqual(reencodeCaught, true, 'Re-encoded video must be rejected');

// ── TEST 9: Genuine unique photo B uploaded by user_marcus ──
console.log('\n9. User @marcus uploads a genuine unique photo B...');
const postB = submitPostToLedger('user_marcus', 'New unique digital creation', bufDifferent);
assert.ok(postB.id);
assert.notStrictEqual(postB.id, postA.id);
console.log('   ✅ Unique photo successfully committed to ledger:', postB.id);

// ── TEST 10: Genuine unique video V2 uploaded by user_marcus ──
console.log('\n10. User @marcus uploads a genuine unique video V2...');
const postV2 = submitPostToLedger('user_marcus', 'Brand new original animation video', vidUnique, 'video/mp4', 'video');
assert.ok(postV2.id);
assert.notStrictEqual(postV2.id, postV1.id);
console.log('   ✅ Unique video successfully committed to ledger:', postV2.id);

console.log('\n🎉 ALL 10 GLOBAL TAMPER-PROOF & MULTI-MEDIA FINGERPRINTING TESTS PASSED PERFECTLY!\n');
