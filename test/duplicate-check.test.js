const assert = require('assert');
const crypto = require('crypto');

// Self-contained duplicate prevention verification
console.log('🧪 Running Cryptographic Duplicate Prevention Verification Test...');

const contentHashes = new Map();

function createPost(authorId, caption, contentHash, mediaUrl) {
  const normHash = contentHash.trim().toLowerCase();

  // Duplicate check
  if (contentHashes.has(normHash)) {
    throw new Error('Tamper-proof error: This exact photo has already been immutably recorded on the ledger.');
  }

  const postId = 'post_' + crypto.randomBytes(6).toString('hex');
  const postRecord = {
    id: postId,
    authorId,
    caption,
    contentHash: normHash,
    mediaUrl,
    timestamp: new Date().toISOString()
  };

  contentHashes.set(normHash, postRecord);
  return postRecord;
}

// 1. First upload of photo A
const photoABuffer = Buffer.from('test-image-binary-data-for-duplicate-prevention-photo-A');
const photoAHash = crypto.createHash('sha256').update(photoABuffer).digest('hex');

console.log('1. First submission of photo A with hash:', photoAHash);
const firstResult = createPost('user_ranna', 'Original photo A', photoAHash, 'data:image/jpeg;base64,...');
assert.strictEqual(firstResult.contentHash, photoAHash, 'First post should succeed with matching hash');
console.log('✅ First upload successfully committed to ledger:', firstResult.id);

// 2. Duplicate upload of identical photo A
console.log('2. Duplicate submission of identical photo A with hash:', photoAHash);
let duplicateCaught = false;
try {
  createPost('user_elena', 'Trying to re-upload exact same photo A', photoAHash, 'data:image/jpeg;base64,...');
} catch (err) {
  duplicateCaught = true;
  assert.strictEqual(
    err.message,
    'Tamper-proof error: This exact photo has already been immutably recorded on the ledger.',
    'Error message must match specification exactly'
  );
  console.log('✅ Rejected immediately with required message:');
  console.log(`   "${err.message}"`);
}

assert.strictEqual(duplicateCaught, true, 'Duplicate submission must be rejected');

// 3. Different photo B should succeed
const photoBBuffer = Buffer.from('different-unique-photo-B-data-12345');
const photoBHash = crypto.createHash('sha256').update(photoBBuffer).digest('hex');
console.log('3. Submission of new unique photo B with hash:', photoBHash);
const secondResult = createPost('user_marcus', 'Unique photo B', photoBHash, 'data:image/jpeg;base64,...');
assert.strictEqual(secondResult.contentHash, photoBHash);
console.log('✅ Unique photo B successfully committed to ledger:', secondResult.id);

console.log('\n🎉 ALL CRYPTOGRAPHIC DUPLICATE PREVENTION TESTS PASSED PERFECTLY!\n');
