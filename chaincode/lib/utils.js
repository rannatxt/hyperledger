'use strict';

/**
 * Utility functions for Hyperledger Fabric chaincode data manipulation and multi-media fingerprint matching.
 */

function toBuffer(obj) {
  return Buffer.from(JSON.stringify(obj));
}

function fromBuffer(buf) {
  if (!buf || buf.length === 0) {
    return null;
  }
  return JSON.parse(buf.toString('utf8'));
}

/**
 * Collect all results from a Fabric state iterator
 * @param {object} iterator - StateQueryIterator
 * @returns {Promise<Array>}
 */
async function iteratorToList(iterator) {
  const allResults = [];
  try {
    let res = await iterator.next();
    while (!res.done) {
      if (res.value && res.value.value.toString()) {
        const jsonRes = {};
        try {
          jsonRes.key = res.value.key;
          jsonRes.record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          jsonRes.key = res.value.key;
          jsonRes.record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      res = await iterator.next();
    }
  } finally {
    if (iterator && typeof iterator.close === 'function') {
      await iterator.close();
    }
  }
  return allResults;
}

function hammingDistance(hexA, hexB) {
  if (!hexA || !hexB) return 64;
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

function parseVideoSignature(sigStr) {
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
 * Sliding window alignment between frame hash sequences
 * Detects overlapping/trimmed subsequences, cropping variations, and reversed playback
 */
function alignFrameSequences(seqTarget, seqExisting, seqTargetRev = null, seqExistingRev = null, threshold = 12) {
  const m = seqTarget.length;
  const n = seqExisting.length;
  if (m === 0 || n === 0) return { isMatch: false, minAvgDistance: 64, matchRatio: 0, overlapCount: 0 };

  let bestMatchRatio = 0;
  let minAvgDist = 64;
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
        const distRevTarget = seqTargetRev ? hammingDistance(seqTargetRev[i], hExist) : 64;
        const distRevExist = seqExistingRev ? hammingDistance(hTarget, seqExistingRev[j]) : 64;

        const frameMinDist = Math.min(distNormal, distRevTarget, distRevExist);
        totalDist += frameMinDist;

        if (frameMinDist <= threshold) {
          matchingFrames++;
          if (frameMinDist === distRevTarget || frameMinDist === distRevExist) {
            revFrames++;
          }
        }
      }
    }

    if (overlap >= Math.min(2, Math.min(m, n))) {
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

  const isMatch = (bestMatchRatio >= 0.50 && minAvgDist <= threshold)
    || (bestOverlap >= 2 && bestMatchRatio >= 0.60 && minAvgDist <= threshold);

  return {
    isMatch,
    matchRatio: bestMatchRatio,
    minAvgDistance: minAvgDist,
    overlapCount: bestOverlap,
    isReversedMatch
  };
}

/**
 * Compare video signatures (handles trimming, cropping, reversing, horizontal flipping)
 */
function compareVideoSignatures(targetSig, existingSig) {
  const target = parseVideoSignature(targetSig);
  const exist = parseVideoSignature(existingSig);

  if (target.frameHashes.length === 0 || exist.frameHashes.length === 0) {
    return { isDuplicate: false, distance: 64, similarity: 0 };
  }

  // 1. Forward alignment
  const forward = alignFrameSequences(target.frameHashes, exist.frameHashes, target.frameHashesReversed, exist.frameHashesReversed);
  if (forward.isMatch) {
    const isTrim = forward.overlapCount < Math.max(target.frameHashes.length, exist.frameHashes.length);
    const matchType = forward.isReversedMatch ? 'video_flipped' : (isTrim ? 'video_trimmed' : 'video_perceptual');
    return {
      isDuplicate: true,
      matchType,
      distance: Math.round(forward.minAvgDistance),
      similarity: Math.max(0, 1 - (forward.minAvgDistance / 64)),
      overlapFrames: forward.overlapCount
    };
  }

  // 2. Temporally reversed alignment (video playback in reverse)
  const revTarget = [...target.frameHashes].reverse();
  const revTargetFlipped = [...target.frameHashesReversed].reverse();
  const reverse = alignFrameSequences(revTarget, exist.frameHashes, revTargetFlipped, exist.frameHashesReversed);
  if (reverse.isMatch) {
    return {
      isDuplicate: true,
      matchType: 'video_time_reversed',
      distance: Math.round(reverse.minAvgDistance),
      similarity: Math.max(0, 1 - (reverse.minAvgDistance / 64)),
      overlapFrames: reverse.overlapCount
    };
  }

  return {
    isDuplicate: false,
    distance: Math.round(Math.min(forward.minAvgDistance, reverse.minAvgDistance)),
    similarity: 0
  };
}

module.exports = {
  toBuffer,
  fromBuffer,
  iteratorToList,
  hammingDistance,
  parseVideoSignature,
  alignFrameSequences,
  compareVideoSignatures
};
