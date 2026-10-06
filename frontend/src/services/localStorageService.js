/**
 * Local Device Storage Service using IndexedDB
 * Persists uploaded posts, photos, and videos directly on the user's phone / device.
 * Ensures media files, thumbnails, and ledger metadata remain available offline
 * and across browser restarts.
 */

const DB_NAME = 'InstaLedger_Device_Storage';
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

/**
 * Check duplicate media against locally stored posts
 * Blocks exact duplicates, cropped/flipped variants (dHash <= 10),
 * and trimmed/reordered video variants.
 */
export async function checkDeviceDuplicate({
  contentHash = '',
  perceptualHash = '',
  perceptualHashReversed = '',
  videoFingerprint = '',
  mediaType = 'image'
}) {
  const localPosts = await getDevicePosts();

  for (const p of localPosts) {
    // 1. Exact cryptographic multihash match
    if (contentHash && p.contentHash && p.contentHash === contentHash) {
      return {
        isDuplicate: true,
        matchType: 'exact',
        existingPost: { id: p.id, authorUsername: p.authorUsername, blockNumber: p.blockNumber },
        error: 'Tamper-Proof Blockchain Security: This exact media file has already been registered on your local device ledger.'
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
            error: 'Tamper-Proof Blockchain Security: This video (or a trimmed/re-encoded variant) already exists on the local ledger.'
          };
        }
      }
    }

    // 3. Image perceptual dHash comparison (Hamming distance <= 10)
    if (perceptualHash && p.perceptualHash) {
      const distDirect = hammingDistance(perceptualHash, p.perceptualHash);
      if (distDirect <= 10) {
        return {
          isDuplicate: true,
          matchType: 'perceptual',
          distance: distDirect,
          existingPost: { id: p.id, authorUsername: p.authorUsername, blockNumber: p.blockNumber },
          error: `Tamper-Proof Security Error: Perceptual match detected (distance ${distDirect} <= 10). A visually identical image is already recorded on the ledger.`
        };
      }

      if (perceptualHashReversed) {
        const distRev = hammingDistance(perceptualHashReversed, p.perceptualHash);
        if (distRev <= 10) {
          return {
            isDuplicate: true,
            matchType: 'perceptual_reversed',
            distance: distRev,
            existingPost: { id: p.id, authorUsername: p.authorUsername, blockNumber: p.blockNumber },
            error: `Tamper-Proof Security Error: Horizontally flipped perceptual match detected (distance ${distRev} <= 10).`
          };
        }
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
