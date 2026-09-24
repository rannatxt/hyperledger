'use strict';

const crypto = require('crypto');
const { bmvbhash } = require('blockhash-core');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

/**
 * 64-bit perceptual hash (8x8 grid -> 16 hex chars)
 * Threshold: distance <= 10 bits difference flags a perceptual match (approx. >= 84% similarity)
 */
const HASH_BITS = 8;
const MAX_BITS = HASH_BITS * HASH_BITS; // 64
const DEFAULT_DISTANCE_THRESHOLD = 10;

/**
 * Compute SHA-256 cryptographic digest of a buffer
 */
function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').toLowerCase();
}

/**
 * Decode an image buffer into { width, height, data: Uint8Array (RGBA) }
 */
function decodeImage(buffer, mimeType = '') {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer);
  }

  // Check magic bytes
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isSvg = buffer.slice(0, 100).toString('utf8').includes('<svg') || (mimeType && mimeType.includes('svg'));

  if (isJpeg) {
    try {
      const decoded = jpeg.decode(buffer, { useTArray: true });
      return { width: decoded.width, height: decoded.height, data: decoded.data };
    } catch (e) {
      console.warn('JPEG decode failed, falling back:', e.message);
    }
  }

  if (isPng) {
    try {
      const png = PNG.sync.read(buffer);
      return { width: png.width, height: png.height, data: png.data };
    } catch (e) {
      console.warn('PNG decode failed, falling back:', e.message);
    }
  }

  if (isSvg) {
    // Generate deterministic pixel grid from SVG string content
    return synthesizeGridFromSvg(buffer.toString('utf8'));
  }

  // Generic fallback: Synthesize an 8x8 luminance grid directly from buffer bytes
  return synthesizeGridFromBytes(buffer);
}

/**
 * Synthesize an RGBA pixel grid from SVG markup
 */
function synthesizeGridFromSvg(svgString) {
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  const hash = crypto.createHash('sha256').update(svgString).digest();

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const hByte = hash[(y * size + x) % hash.length];
      data[idx] = hByte;
      data[idx + 1] = (hByte * 3) % 256;
      data[idx + 2] = (hByte * 7) % 256;
      data[idx + 3] = 255;
    }
  }
  return { width: size, height: size, data };
}

/**
 * Synthesize a deterministic RGBA pixel grid from any binary buffer
 */
function synthesizeGridFromBytes(buffer) {
  const size = 16;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const b = buffer[i % buffer.length] || 0;
    const idx = i * 4;
    data[idx] = b;
    data[idx + 1] = b;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }
  return { width: size, height: size, data };
}

/**
 * Horizontally mirror / flip an image
 * Allows detecting flipped / reversed images
 */
function flipHorizontal(img) {
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

/**
 * Compute perceptual fingerprint (both normal and horizontally reversed)
 */
function computePerceptualFingerprint(buffer, mimeType = '') {
  const sha256 = computeSha256(buffer);
  const img = decodeImage(buffer, mimeType);
  const pHash = bmvbhash(img, HASH_BITS);

  const flippedImg = flipHorizontal(img);
  const pHashReversed = bmvbhash(flippedImg, HASH_BITS);

  return {
    sha256,
    pHash,
    pHashReversed
  };
}

/**
 * Compute Hamming distance between two hex hash strings
 */
function hammingDistance(hexA, hexB) {
  if (!hexA || !hexB) return MAX_BITS;
  const a = hexA.trim().toLowerCase();
  const b = hexB.trim().toLowerCase();
  const len = Math.min(a.length, b.length);
  let dist = 0;

  for (let i = 0; i < len; i++) {
    let xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (xor > 0) {
      dist += (xor & 1);
      xor >>= 1;
    }
  }

  // Account for length differences if any
  dist += Math.abs(a.length - b.length) * 4;
  return dist;
}

/**
 * Compute normalized perceptual similarity score (0.0 to 1.0)
 */
function similarityScore(hexA, hexB) {
  const dist = hammingDistance(hexA, hexB);
  return Math.max(0, 1 - (dist / MAX_BITS));
}

/**
 * Global uniqueness check against existing registered ledger posts
 */
function checkGlobalUniqueness(targetSha256, targetPHash, targetPHashReversed, existingPosts, distanceThreshold = DEFAULT_DISTANCE_THRESHOLD) {
  const normSha256 = targetSha256 ? targetSha256.trim().toLowerCase() : null;
  const normPHash = targetPHash ? targetPHash.trim().toLowerCase() : null;
  const normPReversed = targetPHashReversed ? targetPHashReversed.trim().toLowerCase() : null;

  for (const post of existingPosts) {
    if (!post) continue;

    // 1. Exact Cryptographic Hash Match
    if (normSha256 && post.contentHash && post.contentHash.trim().toLowerCase() === normSha256) {
      return {
        isDuplicate: true,
        matchType: 'exact',
        distance: 0,
        similarity: 1.0,
        existingPost: post,
        message: 'Blockchain Security Alert: This image (or a heavily similar variant) has already been immutably registered on the ledger by another user.'
      };
    }

    // 2. Perceptual Similarity Check (including reversed / flipped check)
    if (normPHash && post.perceptualHash) {
      const distNormal = hammingDistance(normPHash, post.perceptualHash);
      const distReversedTarget = normPReversed ? hammingDistance(normPReversed, post.perceptualHash) : MAX_BITS;
      const distReversedPost = post.perceptualHashReversed ? hammingDistance(normPHash, post.perceptualHashReversed) : MAX_BITS;

      const minDistance = Math.min(distNormal, distReversedTarget, distReversedPost);

      if (minDistance <= distanceThreshold) {
        const isReversedMatch = minDistance === distReversedTarget || minDistance === distReversedPost;
        return {
          isDuplicate: true,
          matchType: isReversedMatch ? 'reversed' : 'perceptual',
          distance: minDistance,
          similarity: Math.max(0, 1 - (minDistance / MAX_BITS)),
          existingPost: post,
          message: 'Blockchain Security Alert: This image (or a heavily similar variant) has already been immutably registered on the ledger by another user.'
        };
      }
    }
  }

  return {
    isDuplicate: false,
    message: 'Cryptographically and perceptually unique'
  };
}

module.exports = {
  HASH_BITS,
  MAX_BITS,
  DEFAULT_DISTANCE_THRESHOLD,
  computeSha256,
  decodeImage,
  flipHorizontal,
  computePerceptualFingerprint,
  hammingDistance,
  similarityScore,
  checkGlobalUniqueness
};
