'use strict';

let Contract;
try {
  Contract = require('fabric-contract-api').Contract;
} catch (err) {
  Contract = class {
    constructor(name) {
      this.name = name;
    }
  };
}
const {
  toBuffer,
  fromBuffer,
  iteratorToList,
  hammingDistance,
  parseVideoSignature,
  compareVideoSignatures
} = require('./utils');

const REQUIRED_SECURITY_ALERT = 'Tamper-Proof Security Error: This media (or a cropped/trimmed variant) already exists on the ledger.';

class InstaLedgerContract extends Contract {
  constructor() {
    super('InstaLedgerContract');
  }

  /**
   * Initialize the ledger with genesis accounts, starter posts, and a verified video post.
   */
  async initLedger(ctx) {
    const defaultProfiles = [
      {
        id: 'user_ranna',
        username: 'ranna',
        displayName: 'Ranna',
        bio: 'Blockchain builder & decentralized web creator 🚀 | Building on Hyperledger Fabric ⛓️',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        followerCount: 3,
        followingCount: 1,
        createdAt: '2026-09-01T10:00:00.000Z'
      },
      {
        id: 'user_elena',
        username: 'elena_crypto',
        displayName: 'Elena Rostova',
        bio: 'Smart contract engineer & UI designer 🎨 Decentralize everything.',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        followerCount: 2,
        followingCount: 2,
        createdAt: '2026-09-02T11:00:00.000Z'
      },
      {
        id: 'user_marcus',
        username: 'marcus_art',
        displayName: 'Marcus Sterling',
        bio: 'Generative artist & IPFS archivist 🌌 Tokyo / London',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        followerCount: 1,
        followingCount: 2,
        createdAt: '2026-09-03T12:00:00.000Z'
      }
    ];

    for (const profile of defaultProfiles) {
      const record = { docType: 'profile', ...profile };
      await ctx.stub.putState(`Profile~${profile.id}`, toBuffer(record));
      await ctx.stub.putState(`Username~${profile.username.toLowerCase()}`, toBuffer({ userId: profile.id }));
    }

    // Genesis Posts with simulated IPFS CIDs, 64-bit perceptual hashes, and video frame signatures
    const defaultPosts = [
      {
        id: 'post_genesis_01',
        authorId: 'user_ranna',
        authorUsername: 'ranna',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        contentHash: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        perceptualHash: '007f007f00ff01ff',
        perceptualHashReversed: 'fe00fe00ff00ff80',
        mediaType: 'image',
        videoFingerprint: '',
        mediaUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80',
        caption: 'Genesis block mined on our local Hyperledger Fabric channel! All metadata and interactions are permanently recorded. #Web3 #Hyperledger #Decentralized',
        timestamp: '2026-09-18T14:30:00.000Z',
        likeCount: 2,
        commentCount: 1
      },
      {
        id: 'post_genesis_02',
        authorId: 'user_elena',
        authorUsername: 'elena_crypto',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        contentHash: 'bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku',
        perceptualHash: '01800ff01ff83ffc',
        perceptualHashReversed: '3ffc0ff01ff80180',
        mediaType: 'image',
        videoFingerprint: '',
        mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        caption: 'Exploring immutable digital identity with composite keys on Fabric. Clean dark mode aesthetics make decentralization feel native ✨',
        timestamp: '2026-09-19T09:15:00.000Z',
        likeCount: 3,
        commentCount: 2
      },
      {
        id: 'post_genesis_03',
        authorId: 'user_marcus',
        authorUsername: 'marcus_art',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        contentHash: 'bafybeibml5fanx2qipldt7n76l7l2y77jygz7z3y6y5z4k7p4w6y4i5v5y',
        perceptualHash: '5a5a5a5aa5a5a5a5',
        perceptualHashReversed: 'a5a5a5a55a5a5a5a',
        mediaType: 'image',
        videoFingerprint: '',
        mediaUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
        caption: 'Latest generative render pinned to IPFS and signed by my cryptographic identity. Pure mathematical beauty. 🪐',
        timestamp: '2026-09-20T18:45:00.000Z',
        likeCount: 1,
        commentCount: 0
      },
      {
        id: 'post_genesis_04',
        authorId: 'user_ranna',
        authorUsername: 'ranna',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        contentHash: 'bafybeicgq5v4x64h42i7o3l6a24v2q4d3f3f2k4m3l4o2p1q4r3s2t1u4v',
        perceptualHash: '1122334455667788',
        perceptualHashReversed: '8877665544332211',
        mediaType: 'video',
        videoFingerprint: 'VF1:1122334455667788,1122334455667799,11223344556677aa,11223344556677bb|8877665544332211,9977665544332211,aa77665544332211,bb77665544332211',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-in-movement-44026-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
        caption: 'Temporal blockchain video verification live on Hyperledger Fabric ⛓️ Keyframe signatures prevent trim & crop piracy.',
        timestamp: '2026-09-21T12:00:00.000Z',
        likeCount: 4,
        commentCount: 1
      }
    ];

    for (const post of defaultPosts) {
      const record = { docType: 'post', ...post };
      await ctx.stub.putState(`Post~${post.id}`, toBuffer(record));
      await ctx.stub.putState(`ContentHash~${post.contentHash.trim().toLowerCase()}`, toBuffer({ postId: post.id, authorId: post.authorId, timestamp: post.timestamp }));
      if (post.perceptualHash) {
        await ctx.stub.putState(`PerceptualHash~${post.perceptualHash.trim().toLowerCase()}`, toBuffer({ postId: post.id, authorId: post.authorId, timestamp: post.timestamp }));
      }
      if (post.videoFingerprint) {
        await ctx.stub.putState(`VideoFingerprint~${post.id}`, toBuffer({ postId: post.id, fingerprint: post.videoFingerprint }));
      }
    }

    // Default follows
    await ctx.stub.putState(ctx.stub.createCompositeKey('Follow', ['user_elena', 'user_ranna']), toBuffer({ docType: 'follow', followerId: 'user_elena', targetId: 'user_ranna' }));
    await ctx.stub.putState(ctx.stub.createCompositeKey('Follow', ['user_marcus', 'user_ranna']), toBuffer({ docType: 'follow', followerId: 'user_marcus', targetId: 'user_ranna' }));
    await ctx.stub.putState(ctx.stub.createCompositeKey('Follow', ['user_marcus', 'user_elena']), toBuffer({ docType: 'follow', followerId: 'user_marcus', targetId: 'user_elena' }));
    await ctx.stub.putState(ctx.stub.createCompositeKey('Follow', ['user_ranna', 'user_elena']), toBuffer({ docType: 'follow', followerId: 'user_ranna', targetId: 'user_elena' }));

    // Default likes
    await ctx.stub.putState(ctx.stub.createCompositeKey('Like', ['post_genesis_01', 'user_elena']), toBuffer({ docType: 'like', postId: 'post_genesis_01', userId: 'user_elena' }));
    await ctx.stub.putState(ctx.stub.createCompositeKey('Like', ['post_genesis_01', 'user_marcus']), toBuffer({ docType: 'like', postId: 'post_genesis_01', userId: 'user_marcus' }));
    await ctx.stub.putState(ctx.stub.createCompositeKey('Like', ['post_genesis_02', 'user_ranna']), toBuffer({ docType: 'like', postId: 'post_genesis_02', userId: 'user_ranna' }));
    await ctx.stub.putState(ctx.stub.createCompositeKey('Like', ['post_genesis_02', 'user_marcus']), toBuffer({ docType: 'like', postId: 'post_genesis_02', userId: 'user_marcus' }));
    await ctx.stub.putState(ctx.stub.createCompositeKey('Like', ['post_genesis_02', 'user_elena']), toBuffer({ docType: 'like', postId: 'post_genesis_02', userId: 'user_elena' }));
    await ctx.stub.putState(ctx.stub.createCompositeKey('Like', ['post_genesis_03', 'user_elena']), toBuffer({ docType: 'like', postId: 'post_genesis_03', userId: 'user_elena' }));
    await ctx.stub.putState(ctx.stub.createCompositeKey('Like', ['post_genesis_04', 'user_elena']), toBuffer({ docType: 'like', postId: 'post_genesis_04', userId: 'user_elena' }));
    await ctx.stub.putState(ctx.stub.createCompositeKey('Like', ['post_genesis_04', 'user_marcus']), toBuffer({ docType: 'like', postId: 'post_genesis_04', userId: 'user_marcus' }));

    // Default comments
    const comment1 = {
      docType: 'comment',
      id: 'cmt_001',
      postId: 'post_genesis_01',
      authorId: 'user_elena',
      authorUsername: 'elena_crypto',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      text: 'Verified on ledger! The transaction speed on Fabric is remarkable.',
      timestamp: '2026-09-18T15:00:00.000Z'
    };
    await ctx.stub.putState(ctx.stub.createCompositeKey('Comment', ['post_genesis_01', 'cmt_001']), toBuffer(comment1));

    const comment2 = {
      docType: 'comment',
      id: 'cmt_002',
      postId: 'post_genesis_02',
      authorId: 'user_ranna',
      authorUsername: 'ranna',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text: 'Stunning visual clarity. This is what decentralized social should feel like.',
      timestamp: '2026-09-19T10:00:00.000Z'
    };
    await ctx.stub.putState(ctx.stub.createCompositeKey('Comment', ['post_genesis_02', 'cmt_002']), toBuffer(comment2));

    return JSON.stringify({ status: 'SUCCESS', message: 'InstaLedger initialized successfully with genesis data' });
  }

  // ==========================================
  // PROFILE MANAGEMENT
  // ==========================================

  async profileExists(ctx, userId) {
    const profileBytes = await ctx.stub.getState(`Profile~${userId}`);
    return profileBytes && profileBytes.length > 0;
  }

  async createProfile(ctx, userId, username, displayName, bio, avatarUrl) {
    if (!userId || !username) {
      throw new Error('UserId and username are required');
    }

    const exists = await this.profileExists(ctx, userId);
    if (exists) {
      throw new Error(`Profile with ID ${userId} already exists`);
    }

    const usernameKey = `Username~${username.toLowerCase()}`;
    const existingUsername = await ctx.stub.getState(usernameKey);
    if (existingUsername && existingUsername.length > 0) {
      throw new Error(`Username @${username} is already taken`);
    }

    const newProfile = {
      docType: 'profile',
      id: userId,
      username: username.toLowerCase().trim(),
      displayName: displayName || username,
      bio: bio || '',
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      followerCount: 0,
      followingCount: 0,
      createdAt: new Date().toISOString()
    };

    await ctx.stub.putState(`Profile~${userId}`, toBuffer(newProfile));
    await ctx.stub.putState(usernameKey, toBuffer({ userId }));

    return JSON.stringify(newProfile);
  }

  async getProfile(ctx, userId) {
    const profileBytes = await ctx.stub.getState(`Profile~${userId}`);
    if (!profileBytes || profileBytes.length === 0) {
      throw new Error(`Profile ${userId} not found`);
    }
    return profileBytes.toString('utf8');
  }

  async getProfileByUsername(ctx, username) {
    const usernameBytes = await ctx.stub.getState(`Username~${username.toLowerCase().trim()}`);
    if (!usernameBytes || usernameBytes.length === 0) {
      throw new Error(`Username @${username} not found`);
    }
    const { userId } = fromBuffer(usernameBytes);
    return this.getProfile(ctx, userId);
  }

  async updateProfile(ctx, userId, displayName, bio, avatarUrl) {
    const profileBytes = await ctx.stub.getState(`Profile~${userId}`);
    if (!profileBytes || profileBytes.length === 0) {
      throw new Error(`Profile ${userId} not found`);
    }

    const profile = fromBuffer(profileBytes);
    if (displayName !== undefined && displayName !== null) profile.displayName = displayName;
    if (bio !== undefined && bio !== null) profile.bio = bio;
    if (avatarUrl !== undefined && avatarUrl !== null) profile.avatarUrl = avatarUrl;

    await ctx.stub.putState(`Profile~${userId}`, toBuffer(profile));
    return JSON.stringify(profile);
  }

  async getAllProfiles(ctx) {
    const iterator = await ctx.stub.getStateByRange('Profile~', 'Profile~\uffff');
    const records = await iteratorToList(iterator);
    return JSON.stringify(records.map(r => r.record));
  }

  // ==========================================
  // POST MANAGEMENT & MULTI-MEDIA TAMPER-PROOFING
  // ==========================================

  async createPost(
    ctx,
    postId,
    authorId,
    contentHash,
    caption,
    mediaUrl,
    perceptualHash,
    perceptualHashReversed,
    mediaType = 'image',
    videoFingerprint = '',
    thumbnailUrl = ''
  ) {
    if (!postId || !authorId || !contentHash) {
      throw new Error('PostId, authorId, and contentHash are required');
    }

    const authorBytes = await ctx.stub.getState(`Profile~${authorId}`);
    if (!authorBytes || authorBytes.length === 0) {
      throw new Error(`Author profile ${authorId} does not exist on ledger`);
    }
    const author = fromBuffer(authorBytes);

    const normContentHash = contentHash.trim().toLowerCase();
    const contentHashKey = `ContentHash~${normContentHash}`;
    const existingHash = await ctx.stub.getState(contentHashKey);
    if (existingHash && existingHash.length > 0) {
      throw new Error(REQUIRED_SECURITY_ALERT);
    }

    const pNorm = perceptualHash ? perceptualHash.trim().toLowerCase() : null;
    const pRevNorm = perceptualHashReversed ? perceptualHashReversed.trim().toLowerCase() : null;
    const DISTANCE_THRESHOLD = 12;
    const isTargetVideo = mediaType === 'video' || (videoFingerprint && videoFingerprint.length > 0);

    // Global uniqueness check across world state
    const iterator = await ctx.stub.getStateByRange('Post~', 'Post~\uffff');
    const allPosts = await iteratorToList(iterator);

    for (const item of allPosts) {
      const post = item.record;
      if (!post) continue;

      // 1. Exact cryptographic digest match
      if (post.contentHash && post.contentHash.trim().toLowerCase() === normContentHash) {
        throw new Error(REQUIRED_SECURITY_ALERT);
      }

      // 2. Video Temporal-Spatial Frame Sequence Matching (Trim, Crop, Reverse, Flip Resistant)
      const isExistingVideo = post.mediaType === 'video' || (post.videoFingerprint && post.videoFingerprint.length > 0);
      if (isTargetVideo && isExistingVideo) {
        const vMatch = compareVideoSignatures(videoFingerprint, post.videoFingerprint);
        if (vMatch.isDuplicate) {
          throw new Error(REQUIRED_SECURITY_ALERT);
        }
      }

      // 3. Image Perceptual Similarity Check (including horizontal mirror/flip)
      if (pNorm && post.perceptualHash) {
        const existingP = post.perceptualHash.trim().toLowerCase();
        const existingPRev = post.perceptualHashReversed ? post.perceptualHashReversed.trim().toLowerCase() : null;

        const distNormal = hammingDistance(pNorm, existingP);
        const distRevTarget = pRevNorm ? hammingDistance(pRevNorm, existingP) : 64;
        const distRevExisting = existingPRev ? hammingDistance(pNorm, existingPRev) : 64;

        const minDistance = Math.min(distNormal, distRevTarget, distRevExisting);
        if (minDistance <= DISTANCE_THRESHOLD) {
          throw new Error(REQUIRED_SECURITY_ALERT);
        }
      }

      // 4. Cross-Media: Keyframe check (video vs static image)
      if (isTargetVideo && !isExistingVideo && post.perceptualHash) {
        const targetVObj = parseVideoSignature(videoFingerprint);
        for (const fHash of targetVObj.frameHashes) {
          if (hammingDistance(fHash, post.perceptualHash) <= DISTANCE_THRESHOLD) {
            throw new Error(REQUIRED_SECURITY_ALERT);
          }
        }
      }
    }

    const postKey = `Post~${postId}`;
    const existing = await ctx.stub.getState(postKey);
    if (existing && existing.length > 0) {
      throw new Error(`Post with ID ${postId} already exists`);
    }

    const newPost = {
      docType: 'post',
      id: postId,
      authorId: author.id,
      authorUsername: author.username,
      authorAvatar: author.avatarUrl,
      contentHash: normContentHash,
      perceptualHash: pNorm || '',
      perceptualHashReversed: pRevNorm || '',
      mediaType: isTargetVideo ? 'video' : 'image',
      videoFingerprint: videoFingerprint || '',
      mediaUrl: mediaUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      caption: caption || '',
      timestamp: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0
    };

    await ctx.stub.putState(postKey, toBuffer(newPost));
    await ctx.stub.putState(contentHashKey, toBuffer({ postId, authorId, timestamp: newPost.timestamp }));
    if (pNorm) {
      await ctx.stub.putState(`PerceptualHash~${pNorm}`, toBuffer({ postId, authorId, timestamp: newPost.timestamp }));
    }
    if (videoFingerprint) {
      await ctx.stub.putState(`VideoFingerprint~${postId}`, toBuffer({ postId, fingerprint: videoFingerprint }));
    }

    const authorPostIndex = ctx.stub.createCompositeKey('AuthorPost', [authorId, postId]);
    await ctx.stub.putState(authorPostIndex, toBuffer({ postId, timestamp: newPost.timestamp }));

    return JSON.stringify(newPost);
  }

  /**
   * Evaluate whether a media asset (image or video) is already registered on the ledger
   */
  async checkDuplicateMedia(
    ctx,
    contentHash,
    perceptualHash,
    perceptualHashReversed,
    mediaType = 'image',
    videoFingerprint = ''
  ) {
    const normContentHash = contentHash ? contentHash.trim().toLowerCase() : null;
    const pNorm = perceptualHash ? perceptualHash.trim().toLowerCase() : null;
    const pRevNorm = perceptualHashReversed ? perceptualHashReversed.trim().toLowerCase() : null;
    const DISTANCE_THRESHOLD = 12;
    const isTargetVideo = mediaType === 'video' || (videoFingerprint && videoFingerprint.length > 0);

    if (normContentHash) {
      const existingHash = await ctx.stub.getState(`ContentHash~${normContentHash}`);
      if (existingHash && existingHash.length > 0) {
        return JSON.stringify({
          isDuplicate: true,
          matchType: 'exact',
          distance: 0,
          similarity: 1.0,
          error: REQUIRED_SECURITY_ALERT
        });
      }
    }

    if (normContentHash || pNorm || videoFingerprint) {
      const iterator = await ctx.stub.getStateByRange('Post~', 'Post~\uffff');
      const allPosts = await iteratorToList(iterator);

      for (const item of allPosts) {
        const post = item.record;
        if (!post) continue;

        // Exact content hash match
        if (normContentHash && post.contentHash && post.contentHash.trim().toLowerCase() === normContentHash) {
          return JSON.stringify({
            isDuplicate: true,
            matchType: 'exact',
            distance: 0,
            similarity: 1.0,
            existingPost: post,
            error: REQUIRED_SECURITY_ALERT
          });
        }

        // Video frame sequence comparison (trim, crop, reverse, flip)
        const isExistingVideo = post.mediaType === 'video' || (post.videoFingerprint && post.videoFingerprint.length > 0);
        if (isTargetVideo && isExistingVideo) {
          const vMatch = compareVideoSignatures(videoFingerprint, post.videoFingerprint);
          if (vMatch.isDuplicate) {
            return JSON.stringify({
              isDuplicate: true,
              matchType: vMatch.matchType,
              distance: vMatch.distance,
              similarity: vMatch.similarity,
              existingPost: post,
              error: REQUIRED_SECURITY_ALERT
            });
          }
        }

        // Image perceptual hash comparison
        if (pNorm && post.perceptualHash) {
          const existingP = post.perceptualHash.trim().toLowerCase();
          const existingPRev = post.perceptualHashReversed ? post.perceptualHashReversed.trim().toLowerCase() : null;

          const distNormal = hammingDistance(pNorm, existingP);
          const distRevTarget = pRevNorm ? hammingDistance(pRevNorm, existingP) : 64;
          const distRevExisting = existingPRev ? hammingDistance(pNorm, existingPRev) : 64;

          const minDistance = Math.min(distNormal, distRevTarget, distRevExisting);
          if (minDistance <= DISTANCE_THRESHOLD) {
            const isReversed = minDistance === distRevTarget || minDistance === distRevExisting;
            return JSON.stringify({
              isDuplicate: true,
              matchType: isReversed ? 'reversed' : 'perceptual',
              distance: minDistance,
              similarity: Math.max(0, 1 - (minDistance / 64)),
              existingPost: post,
              error: REQUIRED_SECURITY_ALERT
            });
          }
        }
      }
    }

    return JSON.stringify({
      isDuplicate: false,
      message: 'Cryptographically and perceptually unique'
    });
  }

  /**
   * Backwards compatible checkDuplicateImage query method
   */
  async checkDuplicateImage(ctx, contentHash, perceptualHash, perceptualHashReversed) {
    return this.checkDuplicateMedia(ctx, contentHash, perceptualHash, perceptualHashReversed, 'image', '');
  }

  async getPost(ctx, postId) {
    const postBytes = await ctx.stub.getState(`Post~${postId}`);
    if (!postBytes || postBytes.length === 0) {
      throw new Error(`Post ${postId} not found`);
    }
    return postBytes.toString('utf8');
  }

  async getFeed(ctx) {
    const iterator = await ctx.stub.getStateByRange('Post~', 'Post~\uffff');
    const records = await iteratorToList(iterator);
    const posts = records.map(r => r.record);
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return JSON.stringify(posts);
  }

  async getPostsByAuthor(ctx, authorId) {
    const iterator = await ctx.stub.getStateByPartialCompositeKey('AuthorPost', [authorId]);
    const records = await iteratorToList(iterator);
    const postPromises = records.map(async (r) => {
      const pBytes = await ctx.stub.getState(`Post~${r.record.postId}`);
      return pBytes && pBytes.length > 0 ? fromBuffer(pBytes) : null;
    });
    const posts = (await Promise.all(postPromises)).filter(Boolean);
    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return JSON.stringify(posts);
  }

  // ==========================================
  // INTERACTIONS: LIKES
  // ==========================================

  async likePost(ctx, postId, userId) {
    const postBytes = await ctx.stub.getState(`Post~${postId}`);
    if (!postBytes || postBytes.length === 0) {
      throw new Error(`Post ${postId} not found`);
    }
    const post = fromBuffer(postBytes);

    const userBytes = await ctx.stub.getState(`Profile~${userId}`);
    if (!userBytes || userBytes.length === 0) {
      throw new Error(`User ${userId} not found`);
    }

    const likeKey = ctx.stub.createCompositeKey('Like', [postId, userId]);
    const existingLike = await ctx.stub.getState(likeKey);
    if (existingLike && existingLike.length > 0) {
      throw new Error(`User ${userId} already liked post ${postId}`);
    }

    const likeRecord = {
      docType: 'like',
      postId,
      userId,
      timestamp: new Date().toISOString()
    };

    await ctx.stub.putState(likeKey, toBuffer(likeRecord));
    post.likeCount = (post.likeCount || 0) + 1;
    await ctx.stub.putState(`Post~${postId}`, toBuffer(post));

    return JSON.stringify({ postId, likeCount: post.likeCount, liked: true });
  }

  async unlikePost(ctx, postId, userId) {
    const postBytes = await ctx.stub.getState(`Post~${postId}`);
    if (!postBytes || postBytes.length === 0) {
      throw new Error(`Post ${postId} not found`);
    }
    const post = fromBuffer(postBytes);

    const likeKey = ctx.stub.createCompositeKey('Like', [postId, userId]);
    const existingLike = await ctx.stub.getState(likeKey);
    if (!existingLike || existingLike.length === 0) {
      throw new Error(`Like does not exist for user ${userId} on post ${postId}`);
    }

    await ctx.stub.deleteState(likeKey);
    post.likeCount = Math.max(0, (post.likeCount || 1) - 1);
    await ctx.stub.putState(`Post~${postId}`, toBuffer(post));

    return JSON.stringify({ postId, likeCount: post.likeCount, liked: false });
  }

  async checkIfLiked(ctx, postId, userId) {
    const likeKey = ctx.stub.createCompositeKey('Like', [postId, userId]);
    const existingLike = await ctx.stub.getState(likeKey);
    const liked = !!(existingLike && existingLike.length > 0);
    return JSON.stringify({ postId, userId, liked });
  }

  // ==========================================
  // INTERACTIONS: FOLLOWS
  // ==========================================

  async followUser(ctx, followerId, targetId) {
    if (followerId === targetId) {
      throw new Error('Users cannot follow themselves');
    }

    const followerBytes = await ctx.stub.getState(`Profile~${followerId}`);
    if (!followerBytes || followerBytes.length === 0) {
      throw new Error(`Follower ${followerId} not found`);
    }
    const follower = fromBuffer(followerBytes);

    const targetBytes = await ctx.stub.getState(`Profile~${targetId}`);
    if (!targetBytes || targetBytes.length === 0) {
      throw new Error(`Target user ${targetId} not found`);
    }
    const target = fromBuffer(targetBytes);

    const followKey = ctx.stub.createCompositeKey('Follow', [followerId, targetId]);
    const existingFollow = await ctx.stub.getState(followKey);
    if (existingFollow && existingFollow.length > 0) {
      throw new Error(`User ${followerId} is already following ${targetId}`);
    }

    const followRecord = {
      docType: 'follow',
      followerId,
      targetId,
      timestamp: new Date().toISOString()
    };

    await ctx.stub.putState(followKey, toBuffer(followRecord));

    follower.followingCount = (follower.followingCount || 0) + 1;
    target.followerCount = (target.followerCount || 0) + 1;

    await ctx.stub.putState(`Profile~${followerId}`, toBuffer(follower));
    await ctx.stub.putState(`Profile~${targetId}`, toBuffer(target));

    return JSON.stringify({
      followerId,
      targetId,
      following: true,
      followerFollowingCount: follower.followingCount,
      targetFollowerCount: target.followerCount
    });
  }

  async unfollowUser(ctx, followerId, targetId) {
    const followKey = ctx.stub.createCompositeKey('Follow', [followerId, targetId]);
    const existingFollow = await ctx.stub.getState(followKey);
    if (!existingFollow || existingFollow.length === 0) {
      throw new Error(`Follow relationship does not exist between ${followerId} and ${targetId}`);
    }

    const followerBytes = await ctx.stub.getState(`Profile~${followerId}`);
    const targetBytes = await ctx.stub.getState(`Profile~${targetId}`);
    const follower = followerBytes ? fromBuffer(followerBytes) : null;
    const target = targetBytes ? fromBuffer(targetBytes) : null;

    await ctx.stub.deleteState(followKey);

    if (follower) {
      follower.followingCount = Math.max(0, (follower.followingCount || 1) - 1);
      await ctx.stub.putState(`Profile~${followerId}`, toBuffer(follower));
    }
    if (target) {
      target.followerCount = Math.max(0, (target.followerCount || 1) - 1);
      await ctx.stub.putState(`Profile~${targetId}`, toBuffer(target));
    }

    return JSON.stringify({
      followerId,
      targetId,
      following: false,
      followerFollowingCount: follower ? follower.followingCount : 0,
      targetFollowerCount: target ? target.followerCount : 0
    });
  }

  async checkIfFollowing(ctx, followerId, targetId) {
    const followKey = ctx.stub.createCompositeKey('Follow', [followerId, targetId]);
    const existingFollow = await ctx.stub.getState(followKey);
    const following = !!(existingFollow && existingFollow.length > 0);
    return JSON.stringify({ followerId, targetId, following });
  }

  // ==========================================
  // INTERACTIONS: COMMENTS
  // ==========================================

  async addComment(ctx, postId, commentId, authorId, text) {
    if (!postId || !commentId || !authorId || !text) {
      throw new Error('PostId, commentId, authorId, and text are required');
    }

    const postBytes = await ctx.stub.getState(`Post~${postId}`);
    if (!postBytes || postBytes.length === 0) {
      throw new Error(`Post ${postId} not found`);
    }
    const post = fromBuffer(postBytes);

    const authorBytes = await ctx.stub.getState(`Profile~${authorId}`);
    if (!authorBytes || authorBytes.length === 0) {
      throw new Error(`Author ${authorId} not found`);
    }
    const author = fromBuffer(authorBytes);

    const commentKey = ctx.stub.createCompositeKey('Comment', [postId, commentId]);
    const commentRecord = {
      docType: 'comment',
      id: commentId,
      postId,
      authorId: author.id,
      authorUsername: author.username,
      authorAvatar: author.avatarUrl,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    await ctx.stub.putState(commentKey, toBuffer(commentRecord));

    post.commentCount = (post.commentCount || 0) + 1;
    await ctx.stub.putState(`Post~${postId}`, toBuffer(post));

    return JSON.stringify(commentRecord);
  }

  async getComments(ctx, postId) {
    const iterator = await ctx.stub.getStateByPartialCompositeKey('Comment', [postId]);
    const records = await iteratorToList(iterator);
    const comments = records.map(r => r.record);
    comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return JSON.stringify(comments);
  }
}

module.exports = InstaLedgerContract;
