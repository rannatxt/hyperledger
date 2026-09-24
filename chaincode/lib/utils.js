'use strict';

/**
 * Utility functions for Hyperledger Fabric chaincode data manipulation.
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

module.exports = {
  toBuffer,
  fromBuffer,
  iteratorToList,
  hammingDistance,
};
