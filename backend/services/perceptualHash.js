'use strict';

const crypto = require('crypto');
const { bmvbhash } = require('blockhash-core');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');
const videoFingerprint = require('./videoFingerprint');

/**
 * 64-bit perceptual hash (8x8 grid -> 16 hex chars)
 * Threshold: distance <= 10 bits difference flags a perceptual match (approx. >= 84% similarity)
 */
const HASH_BITS = 8;
const MAX_BITS = HASH_BITS * HASH_BITS; // 64
const DEFAULT_DISTANCE_THRESHOLD = 10;

const REQUIRED_SECURITY_ALERT = 'Tamper-Proof Blockchain Security: This media file (or a cropped/trimmed variant) has already been registered on the ledger.';

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
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x4e && buffer[2] === 0x47;
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
  const isVideo = (mimeType && mimeType.startsWith('video/')) || isVideoBuffer(buffer);
  if (isVideo) {
    const vFp = videoFingerprint.computeVideoFingerprint(buffer, mimeType);
    return {
      mediaType: 'video',
      sha256: vFp.sha256,
      pHash: vFp.frameHashes[0] || '',
      pHashReversed: vFp.frameHashesReversed[0] || '',
      videoFingerprint: vFp.signature,
      vFp
    };
  }

  const sha256 = computeSha256(buffer);
  const img = decodeImage(buffer, mimeType);
  const pHash = bmvbhash(img, HASH_BITS);

  const flippedImg = flipHorizontal(img);
  const pHashReversed = bmvbhash(flippedImg, HASH_BITS);

  return {
    mediaType: 'image',
    sha256,
    pHash,
    pHashReversed
  };
}

/**
 * Quick magic bytes check for common video containers (MP4, WebM, MKV, QuickTime)
 */
function isVideoBuffer(buffer) {
  if (!buffer || buffer.length < 12) return false;
  // MP4 ftyp box check
  if (buffer.length > 8 && buffer.slice(4, 8).toString('ascii') === 'ftyp') return true;
  // WebM / MKV EBML ID check (0x1A 0x45 0xDF 0xA3)
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return true;
  // QuickTime 'moov' or 'mdat' at start
  const str = buffer.slice(0, 30).toString('ascii');
  if (str.includes('moov') || str.includes('mdat')) return true;
  return false;
}

/**
 * Compute Hamming distance between two hex hash strings
 */
function hammingDistance(hexA, hexB) {
  return videoFingerprint.hammingDistance(hexA, hexB);
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
 * Handles both image perceptual hashing and video frame sequence hashes
 */
function checkGlobalUniqueness(
  targetSha256,
  targetPHash,
  targetPHashReversed,
  existingPosts,
  distanceThreshold = DEFAULT_DISTANCE_THRESHOLD,
  mediaType = 'image',
  targetVideoFingerprint = ''
) {
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
        message: REQUIRED_SECURITY_ALERT
      };
    }

    // 2. Video Temporal-Spatial Frame Sequence Matching (Trim, Crop, Reverse, Flip Resistant)
    const isTargetVideo = mediaType === 'video' || (targetVideoFingerprint && targetVideoFingerprint.length > 0);
    const isPostVideo = post.mediaType === 'video' || (post.videoFingerprint && post.videoFingerprint.length > 0);

    if (isTargetVideo && isPostVideo) {
      const targetVObj = videoFingerprint.parseSignature(targetVideoFingerprint);
      const postVObj = videoFingerprint.parseSignature(post.videoFingerprint);

      const vMatch = videoFingerprint.compareVideoFingerprints(
        { sha256: normSha256, frameHashes: targetVObj.frameHashes, frameHashesReversed: targetVObj.frameHashesReversed },
        { sha256: post.contentHash, frameHashes: postVObj.frameHashes, frameHashesReversed: postVObj.frameHashesReversed }
      );

      if (vMatch.isDuplicate) {
        return {
          isDuplicate: true,
          matchType: vMatch.matchType,
          distance: vMatch.distance,
          similarity: vMatch.similarity,
          existingPost: post,
          message: REQUIRED_SECURITY_ALERT
        };
      }
    }

    // 3. Image Perceptual Similarity Check (including reversed / flipped check)
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
          message: REQUIRED_SECURITY_ALERT
        };
      }
    }

    // 4. Cross-Media: Keyframe check if one is video and the other is photo
    if (isTargetVideo && !isPostVideo && post.perceptualHash) {
      const targetVObj = videoFingerprint.parseSignature(targetVideoFingerprint);
      for (const fHash of targetVObj.frameHashes) {
        const d = hammingDistance(fHash, post.perceptualHash);
        if (d <= distanceThreshold) {
          return {
            isDuplicate: true,
            matchType: 'video_keyframe_match',
            distance: d,
            similarity: Math.max(0, 1 - (d / MAX_BITS)),
            existingPost: post,
            message: REQUIRED_SECURITY_ALERT
          };
        }
      }
    }
  }

  return {
    isDuplicate: false,
    message: 'Cryptographically, temporally, and perceptually unique'
  };
}

module.exports = {
  HASH_BITS,
  MAX_BITS,
  DEFAULT_DISTANCE_THRESHOLD,
  REQUIRED_SECURITY_ALERT,
  computeSha256,
  decodeImage,
  flipHorizontal,
  computePerceptualFingerprint,
  hammingDistance,
  similarityScore,
  checkGlobalUniqueness,
  isVideoBuffer,
  videoFingerprint
};
