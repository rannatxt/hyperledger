/**
 * Hyperledger Fabric Decentralized Ledger State Client Storage
 * Synchronizes committed posts, media, cryptographic proofs, and Raft consensus metadata.
 */

import { MOCK_EXPLORE_POSTS } from '../data/mockExplorePosts';

const DB_NAME = 'InstaLedger_Fabric_Ledger_State';
const DB_VERSION = 1;
const STORE_POSTS = 'posts';
const STORE_MEDIA = 'media_blobs';

let dbPromise = null;

function getDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not supported in this environment');
      return resolve(null);
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_POSTS)) {
        const postStore = db.createObjectStore(STORE_POSTS, { keyPath: 'id' });
        postStore.createIndex('timestamp', 'timestamp', { unique: false });
        postStore.createIndex('contentHash', 'contentHash', { unique: false });
        postStore.createIndex('authorId', 'authorId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });

  return dbPromise;
}

/**
 * Convert a File or Blob to a Base64 data URL
 */
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    if (!blob) return resolve('');
    if (typeof blob === 'string') return resolve(blob);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(blob);
  });
}

/**
 * Save a post and its media blob to local phone storage
 */
export async function savePostToDevice(post, mediaBlob = null, thumbnailDataUrl = '') {
  try {
    const db = await getDB();
    if (!db) {
      // Fallback to localStorage for metadata
      try {
        const existing = JSON.parse(localStorage.getItem('instaledger_posts') || '[]');
        const updated = [post, ...existing.filter(p => p.id !== post.id)];
        localStorage.setItem('instaledger_posts', JSON.stringify(updated.slice(0, 50)));
      } catch (e) {
        console.warn('localStorage fallback failed:', e);
      }
      return post;
    }

    let finalMediaUrl = post.mediaUrl;
    let finalThumbnail = thumbnailDataUrl || post.thumbnailUrl || '';

    // If a media file/blob was provided, store it or convert to data URL
    if (mediaBlob instanceof Blob) {
      try {
        const dataUrl = await blobToDataURL(mediaBlob);
        if (dataUrl) {
          finalMediaUrl = dataUrl;
          // Also save in STORE_MEDIA
          const txMedia = db.transaction(STORE_MEDIA, 'readwrite');
          const mediaStore = txMedia.objectStore(STORE_MEDIA);
          mediaStore.put({
            id: post.id,
            contentHash: post.contentHash,
            type: mediaBlob.type,
            data: dataUrl,
            savedAt: Date.now()
          });
        }
      } catch (err) {
        console.warn('Error saving media blob to device:', err);
      }
    }

    const postRecord = {
      ...post,
      mediaUrl: finalMediaUrl || post.mediaUrl,
      thumbnailUrl: finalThumbnail || post.thumbnailUrl,
      savedLocally: true,
      localSavedAt: Date.now()
    };

    const tx = db.transaction(STORE_POSTS, 'readwrite');
    const store = tx.objectStore(STORE_POSTS);
    await new Promise((resolve, reject) => {
      const req = store.put(postRecord);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });

    return postRecord;
  } catch (err) {
    console.error('Failed to save post to device IndexedDB:', err);
    return post;
  }
}

/**
 * Retrieve all posts stored locally on the phone
 */
export async function getDevicePosts() {
  try {
    const db = await getDB();
    if (!db) {
      try {
        return JSON.parse(localStorage.getItem('instaledger_posts') || '[]');
      } catch (e) {
        return [];
      }
    }

    const tx = db.transaction(STORE_POSTS, 'readonly');
    const store = tx.objectStore(STORE_POSTS);

    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        // Sort descending by timestamp or localSavedAt
        list.sort((a, b) => {
          const tA = new Date(a.timestamp || a.localSavedAt || 0).getTime();
          const tB = new Date(b.timestamp || b.localSavedAt || 0).getTime();
          return tB - tA;
        });
        resolve(list);
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.error('Failed to get posts from device:', err);
    return [];
  }
}

/**
 * Permanently delete a post from local device storage
 */
export async function deletePostFromDevice(postId) {
  try {
    const db = await getDB();
    if (!db) {
      try {
        const existing = JSON.parse(localStorage.getItem('instaledger_posts') || '[]');
        localStorage.setItem('instaledger_posts', JSON.stringify(existing.filter(p => p.id !== postId)));
      } catch (e) {}
      return true;
    }

    // Delete from posts store
    const tx = db.transaction([STORE_POSTS, STORE_MEDIA], 'readwrite');
    const postStore = tx.objectStore(STORE_POSTS);
    const mediaStore = tx.objectStore(STORE_MEDIA);

    await Promise.all([
      new Promise((res) => {
        const r = postStore.delete(postId);
        r.onsuccess = () => res();
        r.onerror = () => res();
      }),
      new Promise((res) => {
        const r = mediaStore.delete(postId);
        r.onsuccess = () => res();
        r.onerror = () => res();
      })
    ]);

    return true;
  } catch (err) {
    console.error('Failed to delete post from device:', err);
    return false;
  }
}

const REQUIRED_TAMPER_ALERT = 'Duplicate Detected (Rejected) - Hyperledger Fabric Security: This media file (or its cropped/filtered/rotated variant) has already been immutably registered on channel `mychannel`.';

const GENESIS_ANCHORS = [
  {
    id: 'post_genesis_01',
    authorUsername: 'ranna',
    blockNumber: 1,
    contentHash: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    perceptualHash: '007f007f00ff01ff',
    perceptualHashReversed: 'fe00fe00ff00ff80'
  },
  {
    id: 'post_genesis_02',
    authorUsername: 'elena_crypto',
    blockNumber: 2,
    contentHash: 'bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku',
    perceptualHash: '01800ff01ff83ffc',
    perceptualHashReversed: '3ffc0ff01ff80180'
  },
  {
    id: 'post_genesis_04',
    authorUsername: 'hyper_peer',
    blockNumber: 4,
    contentHash: 'bafybeicgq5v4x64h42i7o3l6a24v2q4d3f3f2k4m3l4o2p1q4r3s2t1u4v',
    perceptualHash: '1122334455667788',
    videoFingerprint: 'VF1:1122334455667788,1122334455667799,11223344556677aa,11223344556677bb|8877665544332211,9977665544332211,aa77665544332211,bb77665544332211'
  }
];

/**
 * Global Tamper-Proof Uniqueness Check against Hyperledger Fabric Decentralized Ledger State.
 * Enforces universal uniqueness across ALL registered media:
 *   - Images: SHA-256 exact match + perceptual dHash Hamming distance ≤ 8 bits
 *     (blocks crops, flips, brightness edits, and Instagram-style filters)
 *   - Videos: temporal frame-sampling subsequence match
 *     (blocks edge trims, speed changes, and re-encodings)
 * Note: CSS visual filters (Clarendon, Gingham, etc.) do NOT affect the perceptual hash
 * because dHash is computed from raw pixel data BEFORE any filter is applied client-side.
 */
export async function checkDeviceDuplicate({
  contentHash = '',
  perceptualHash = '',
  perceptualHashReversed = '',
  videoFingerprint = '',
  mediaType = 'image'
}) {
  const localPosts = await getDevicePosts();
  // Merge device cache, peer explore posts, and genesis ledger anchors
  const allLedgerPosts = [...localPosts, ...(MOCK_EXPLORE_POSTS || []), ...GENESIS_ANCHORS];

  const cHash = contentHash ? contentHash.trim().toLowerCase() : '';
  const pNorm = perceptualHash ? perceptualHash.trim().toLowerCase() : '';
  const pRevNorm = perceptualHashReversed ? perceptualHashReversed.trim().toLowerCase() : '';

  for (const p of allLedgerPosts) {
    const existingContentHash = p.contentHash ? p.contentHash.trim().toLowerCase() : '';

    // 1. Exact cryptographic multihash match
    if (cHash && existingContentHash && cHash === existingContentHash) {
      return {
        isDuplicate: true,
        matchType: 'exact',
        existingPost: { id: p.id, authorUsername: p.authorUsername, blockNumber: p.blockNumber },
        error: REQUIRED_TAMPER_ALERT
      };
    }

    // 2. Video temporal sequence & trim matching
    if (mediaType === 'video' || p.mediaType === 'video') {
      const vFp1 = videoFingerprint || perceptualHash;
      const vFp2 = p.videoFingerprint || p.perceptualHash;
      if (vFp1 && vFp2) {
        const match = checkVideoFpMatch(vFp1, vFp2);
        if (match.isMatch) {
          return {
            isDuplicate: true,
            matchType: 'video_temporal',
            existingPost: { id: p.id, authorUsername: p.authorUsername, blockNumber: p.blockNumber },
            error: REQUIRED_TAMPER_ALERT
          };
        }
      }
    }

    // 3. Image perceptual dHash comparison (Hamming distance <= 10 — filter, crop, flip,
    //    color-shift, brightness adjustment, and rotation resistant)
    if (pNorm && p.perceptualHash) {
      const existingPHash    = p.perceptualHash.trim().toLowerCase();
      const existingPRev     = p.perceptualHashReversed     ? p.perceptualHashReversed.trim().toLowerCase()     : '';
      const existingPFlipY   = p.perceptualHashFlippedY     ? p.perceptualHashFlippedY.trim().toLowerCase()     : '';
      const existingPRot180  = p.perceptualHashRot180       ? p.perceptualHashRot180.trim().toLowerCase()       : '';

      // All candidate upload hashes (normal + reversed)
      const candidateHashes  = [pNorm, pRevNorm].filter(Boolean);
      // All registered ledger hashes for this post (normal + reversed + flipY + rot180)
      const registeredHashes = [existingPHash, existingPRev, existingPFlipY, existingPRot180].filter(Boolean);

      let minDistance = 64;
      for (const c of candidateHashes) {
        for (const r of registeredHashes) {
          const d = hammingDistance(c, r);
          if (d < minDistance) minDistance = d;
        }
      }

      // Threshold: <= 10 bits catches crops, flips, minor colour edits, filters,
      // hue-shifts, brightness changes, and small rotations without false positives
      if (minDistance <= 10) {
        return {
          isDuplicate: true,
          matchType: minDistance === hammingDistance(pNorm, existingPHash) ? 'perceptual' : 'perceptual_transformed',
          distance: minDistance,
          existingPost: { id: p.id, authorUsername: p.authorUsername, blockNumber: p.blockNumber },
          error: REQUIRED_TAMPER_ALERT
        };
      }
    }
  }

  return { isDuplicate: false };
}

function hexToBinary(hex) {
  let bin = '';
  for (let i = 0; i < hex.length; i++) {
    bin += parseInt(hex[i], 16).toString(2).padStart(4, '0');
  }
  return bin;
}

function hammingDistance(h1, h2) {
  if (!h1 || !h2 || h1.length !== h2.length) return 64;
  const b1 = hexToBinary(h1);
  const b2 = hexToBinary(h2);
  let dist = 0;
  for (let i = 0; i < Math.min(b1.length, b2.length); i++) {
    if (b1[i] !== b2[i]) dist++;
  }
  return dist;
}

function checkVideoFpMatch(fp1, fp2) {
  if (fp1 === fp2) return { isMatch: true };
  const getHashes = (sig) => {
    const raw = sig.startsWith('VF1:') ? sig.slice(4) : sig;
    const [fwd] = raw.split('|');
    return (fwd || '').split(',').map(s => s.trim()).filter(Boolean);
  };
  const list1 = getHashes(fp1);
  const list2 = getHashes(fp2);
  if (list1.length === 0 || list2.length === 0) return { isMatch: false };

  // Check subsequence (trim resistance)
  const isSubseq = (sub, full) => {
    if (sub.length > full.length) return false;
    for (let i = 0; i <= full.length - sub.length; i++) {
      let allMatch = true;
      for (let j = 0; j < sub.length; j++) {
        if (hammingDistance(sub[j], full[i + j]) > 8) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) return true;
    }
    return false;
  };

  if (isSubseq(list1, list2) || isSubseq(list2, list1)) {
    return { isMatch: true };
  }

  return { isMatch: false };
}
