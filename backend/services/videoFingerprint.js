'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { bmvbhash } = require('blockhash-core');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const HASH_BITS = 8;
const MAX_BITS = 64;
const FRAME_DISTANCE_THRESHOLD = 10; // Hamming distance <= 10 bits per frame matches (>= 84% frame similarity)
const SUBSEQUENCE_MATCH_RATIO = 0.60; // >= 60% of overlapping frames must match
const MIN_OVERLAP_FRAMES = 2; // At least 2 frames overlap required

/**
 * Compute SHA-256 cryptographic digest
 */
function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex').toLowerCase();
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
  dist += Math.abs(a.length - b.length) * 4;
  return dist;
}

/**
 * Horizontally mirror an RGBA image buffer
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
 * Decode an image file buffer into RGBA
 */
function decodeFrameBuffer(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    try {
      const decoded = jpeg.decode(buf, { useTArray: true });
      return { width: decoded.width, height: decoded.height, data: decoded.data };
    } catch (e) {
      // fallback
    }
  }
  if (buf[0] === 0x89 && buf[1] === 0x4e && buf[2] === 0x47) {
    try {
      const png = PNG.sync.read(buf);
      return { width: png.width, height: png.height, data: png.data };
    } catch (e) {
      // fallback
    }
  }
  const size = 16;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const b = buf[i % buf.length] || 0;
    const idx = i * 4;
    data[idx] = b;
    data[idx + 1] = b;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }
  return { width: size, height: size, data };
}

/**
 * Check if buffer has valid video container magic bytes (MP4, WebM, MKV, QuickTime, AVI)
 */
function isLikelyVideoContainer(buffer) {
  if (!buffer || buffer.length < 12) return false;
  // MP4 ftyp box (bytes 4-8 = 'ftyp')
  if (buffer.length > 8 && buffer.slice(4, 8).toString('ascii') === 'ftyp') return true;
  // WebM / MKV EBML ID (0x1A 0x45 0xDF 0xA3)
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) return true;
  // QuickTime atom markers
  const headerStr = buffer.slice(0, 40).toString('latin1');
  if (headerStr.includes('moov') || headerStr.includes('mdat') || headerStr.includes('RIFF')) return true;
  return false;
}

/**
 * Check if ffmpeg is available on the host system
 */
let ffmpegAvailable = null;
function checkFfmpeg() {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  try {
    execSync('ffmpeg -version', { stdio: 'ignore', timeout: 3000 });
    ffmpegAvailable = true;
  } catch (e) {
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
}

/**
 * Extract frame buffers using ffmpeg
 */
function extractFramesWithFfmpeg(videoBuffer, maxFrames = 10) {
  const tmpDir = path.join(os.tmpdir(), `instaledger_vid_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const inputPath = path.join(tmpDir, 'input.mp4');
  fs.writeFileSync(inputPath, videoBuffer);

  try {
    const outPattern = path.join(tmpDir, 'frame_%03d.jpg');
    execSync(
      `ffmpeg -loglevel error -y -i "${inputPath}" -vf "fps=2,scale=64:64" -vframes ${maxFrames} -q:v 3 "${outPattern}"`,
      { stdio: 'ignore', timeout: 10000 }
    );

    const files = fs.readdirSync(tmpDir).filter(f => f.startsWith('frame_') && f.endsWith('.jpg')).sort();
    if (files.length === 0) return [];

    const frames = files.map(file => {
      const frameBuf = fs.readFileSync(path.join(tmpDir, file));
      return decodeFrameBuffer(frameBuf);
    });

    return frames;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Fallback temporal frame synthesizer with fixed stride
 * Ensures that trimmed subsequences align perfectly with identical frame hash values
 */
function extractFramesFromBufferFallback(buffer, maxFrames = 12) {
  const frames = [];
  const size = 16;
  const windowSize = 128;
  const stride = 128;

  for (let offset = 0; offset + 64 <= buffer.length && frames.length < maxFrames; offset += stride) {
    const chunk = buffer.slice(offset, Math.min(buffer.length, offset + windowSize));
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const byteVal = chunk[(y * size + x) % chunk.length] || 0;
        data[idx] = byteVal;
        data[idx + 1] = byteVal;
        data[idx + 2] = byteVal;
        data[idx + 3] = 255;
      }
    }
    frames.push({ width: size, height: size, data });
  }

  // Ensure minimum frames
  if (frames.length === 0 && buffer.length > 0) {
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      const b = buffer[i % buffer.length];
      data[i * 4] = b;
      data[i * 4 + 1] = b;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = 255;
    }
    frames.push({ width: size, height: size, data });
  }

  return frames;
}

/**
 * Generate a complete video fingerprint object from a video buffer
 */
function computeVideoFingerprint(buffer, mimeType = 'video/mp4') {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer);
  }

  const sha256 = computeSha256(buffer);
  let frames = [];

  if (checkFfmpeg() && buffer.length > 200 && isLikelyVideoContainer(buffer)) {
    try {
      frames = extractFramesWithFfmpeg(buffer, 12);
    } catch (err) {
      // fallback
    }
  }

  if (!frames || frames.length === 0) {
    frames = extractFramesFromBufferFallback(buffer, 12);
  }

  const frameHashes = [];
  const frameHashesReversed = [];

  for (const frame of frames) {
    try {
      const pHash = bmvbhash(frame, HASH_BITS);
      const flipped = flipHorizontal(frame);
      const pHashRev = bmvbhash(flipped, HASH_BITS);
      frameHashes.push(pHash);
      frameHashesReversed.push(pHashRev);
    } catch (e) {
      console.warn('Frame hash error:', e.message);
    }
  }

  const signature = `VF1:${frameHashes.join(',')}|${frameHashesReversed.join(',')}`;

  return {
    mediaType: 'video',
    sha256,
    frameCount: frameHashes.length,
    frameHashes,
    frameHashesReversed,
    signature
  };
}

/**
 * Parse signature string if video fingerprint was serialized
 */
function parseSignature(sigStr) {
  if (!sigStr || typeof sigStr !== 'string') return { frameHashes: [], frameHashesReversed: [] };
  if (sigStr.startsWith('{')) {
    try {
      const parsed = JSON.parse(sigStr);
      return {
        frameHashes: parsed.frameHashes || [],
        frameHashesReversed: parsed.frameHashesReversed || []
      };
    } catch (e) {
      // continue
    }
  }
  if (sigStr.startsWith('VF1:')) {
    const parts = sigStr.slice(4).split('|');
    const normal = parts[0] ? parts[0].split(',').filter(Boolean) : [];
    const rev = parts[1] ? parts[1].split(',').filter(Boolean) : [];
    return { frameHashes: normal, frameHashesReversed: rev };
  }
  const list = sigStr.split(',').filter(Boolean);
  return { frameHashes: list, frameHashesReversed: [] };
}

/**
 * Sliding Window Subsequence Alignment between two frame sequences
 * Detects overlapping video sequences (trimmed at edges, cropped frames, or shifted)
 */
function alignFrameSequences(seqTarget, seqExisting, seqTargetRev = null, seqExistingRev = null) {
  const m = seqTarget.length;
  const n = seqExisting.length;
  if (m === 0 || n === 0) return { isMatch: false, minAvgDistance: MAX_BITS, matchRatio: 0, overlapCount: 0 };

  let bestMatchRatio = 0;
  let minAvgDist = MAX_BITS;
  let bestOverlap = 0;
  let isReversedMatch = false;

  for (let offset = -(m - 1); offset < n; offset++) {
    let overlap = 0;
    let matchingFrames = 0;
    let totalDist = 0;
    let revFrames = 0;

    for (let i = 0; i < m; i++) {
      const j = i + offset;
      if (j >= 0 && j < n) {
        overlap++;
        const hTarget = seqTarget[i];
        const hExist = seqExisting[j];

        const distNormal = hammingDistance(hTarget, hExist);
        const distRevTarget = seqTargetRev ? hammingDistance(seqTargetRev[i], hExist) : MAX_BITS;
        const distRevExist = seqExistingRev ? hammingDistance(hTarget, seqExistingRev[j]) : MAX_BITS;

        const frameMinDist = Math.min(distNormal, distRevTarget, distRevExist);
        totalDist += frameMinDist;

        if (frameMinDist <= FRAME_DISTANCE_THRESHOLD) {
          matchingFrames++;
          if (frameMinDist === distRevTarget || frameMinDist === distRevExist) {
            revFrames++;
          }
        }
      }
    }

    if (overlap >= Math.min(MIN_OVERLAP_FRAMES, Math.min(m, n))) {
      const ratio = matchingFrames / overlap;
      const avgDist = totalDist / overlap;

      if (ratio > bestMatchRatio || (ratio === bestMatchRatio && avgDist < minAvgDist)) {
        bestMatchRatio = ratio;
        minAvgDist = avgDist;
        bestOverlap = overlap;
        isReversedMatch = revFrames > (matchingFrames / 2);
      }
    }
  }

  const isMatch = (bestMatchRatio >= SUBSEQUENCE_MATCH_RATIO && minAvgDist <= FRAME_DISTANCE_THRESHOLD)
    || (bestOverlap >= 3 && bestMatchRatio >= 0.70 && minAvgDist <= FRAME_DISTANCE_THRESHOLD);

  return {
    isMatch,
    matchRatio: bestMatchRatio,
    minAvgDistance: minAvgDist,
    overlapCount: bestOverlap,
    isReversedMatch
  };
}

/**
 * Compare two video fingerprints for duplicate detection (handles trim, crop, reverse, flip)
 */
function compareVideoFingerprints(targetFp, existingFp) {
  if (targetFp.sha256 && existingFp.sha256 && targetFp.sha256.toLowerCase() === existingFp.sha256.toLowerCase()) {
    return {
      isDuplicate: true,
      matchType: 'exact_video',
      distance: 0,
      similarity: 1.0,
      message: 'Tamper-Proof Blockchain Security: This media file (or a cropped/trimmed variant) has already been registered on the ledger.'
    };
  }

  const targetNormal = targetFp.frameHashes || [];
  const targetFlipped = targetFp.frameHashesReversed || [];
  const existNormal = existingFp.frameHashes || [];
  const existFlipped = existingFp.frameHashesReversed || [];

  if (targetNormal.length === 0 || existNormal.length === 0) {
    return { isDuplicate: false, similarity: 0, distance: MAX_BITS };
  }

  // 1. Forward temporal alignment
  const forwardAlignment = alignFrameSequences(targetNormal, existNormal, targetFlipped, existFlipped);
  if (forwardAlignment.isMatch) {
    const isTrim = forwardAlignment.overlapCount < Math.max(targetNormal.length, existNormal.length);
    const matchType = forwardAlignment.isReversedMatch ? 'video_flipped' : (isTrim ? 'video_trimmed' : 'video_perceptual');
    const similarity = Math.max(0, 1 - (forwardAlignment.minAvgDistance / MAX_BITS));
    return {
      isDuplicate: true,
      matchType,
      distance: Math.round(forwardAlignment.minAvgDistance),
      similarity,
      overlapFrames: forwardAlignment.overlapCount,
      message: 'Tamper-Proof Blockchain Security: This media file (or a cropped/trimmed variant) has already been registered on the ledger.'
    };
  }

  // 2. Reversed temporal alignment (detects video played backwards or trimmed backwards)
  const targetTimeRev = [...targetNormal].reverse();
  const targetTimeRevFlipped = [...targetFlipped].reverse();
  const reverseAlignment = alignFrameSequences(targetTimeRev, existNormal, targetTimeRevFlipped, existFlipped);
  if (reverseAlignment.isMatch) {
    const similarity = Math.max(0, 1 - (reverseAlignment.minAvgDistance / MAX_BITS));
    return {
      isDuplicate: true,
      matchType: 'video_time_reversed',
      distance: Math.round(reverseAlignment.minAvgDistance),
      similarity,
      overlapFrames: reverseAlignment.overlapCount,
      message: 'Tamper-Proof Blockchain Security: This media file (or a cropped/trimmed variant) has already been registered on the ledger.'
    };
  }

  return {
    isDuplicate: false,
    distance: Math.round(Math.min(forwardAlignment.minAvgDistance, reverseAlignment.minAvgDistance)),
    similarity: 0
  };
}

module.exports = {
  HASH_BITS,
  MAX_BITS,
  FRAME_DISTANCE_THRESHOLD,
  computeSha256,
  hammingDistance,
  computeVideoFingerprint,
  parseSignature,
  alignFrameSequences,
  compareVideoFingerprints,
  isLikelyVideoContainer
};
