import React, { useState, useEffect } from 'react';
import {
  Grid,
  Bookmark,
  ShieldCheck,
  CheckCircle2,
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  Key,
  Database
} from 'lucide-react';
import { api } from '../services/api';

export default function ProfileView({
  profileUser,
  currentUser,
  onSelectPost,
  onUserFollowUpdated,
  isDark
}) {
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(profileUser?.followerCount || 0);
  const [loading, setLoading] = useState(true);

  const isSelf = profileUser?.id === currentUser?.id;

  useEffect(() => {
    if (!profileUser) return;
    setFollowerCount(profileUser.followerCount || 0);

    const loadUserData = async () => {
      setLoading(true);
      try {
        // Fetch posts by author
        const userPosts = await api.getPostsByAuthor(profileUser.id);
        setPosts(userPosts);

        // Check if current user is following this profile
        if (!isSelf && currentUser) {
          const followStatus = await api.checkFollowing(currentUser.id, profileUser.id);
          setIsFollowing(followStatus.following);
        }
      } catch (err) {
        console.error('Failed to load user profile details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [profileUser, currentUser]);

  const handleToggleFollow = async () => {
    if (!currentUser || isSelf) return;

    const willFollow = !isFollowing;
    setIsFollowing(willFollow);
    setFollowerCount(prev => (willFollow ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (willFollow) {
        const res = await api.followUser(currentUser.id, profileUser.id);
        setFollowerCount(res.targetFollowerCount);
      } else {
        const res = await api.unfollowUser(currentUser.id, profileUser.id);
        setFollowerCount(res.targetFollowerCount);
      }
      if (onUserFollowUpdated) onUserFollowUpdated();
    } catch (err) {
      console.error('Follow toggle failed on ledger:', err);
      // Revert optimistic update
      setIsFollowing(!willFollow);
      setFollowerCount(prev => (!willFollow ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  if (!profileUser) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 pb-8 border-b border-[#262626]/40">
        {/* Avatar */}
        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full p-[3px] story-gradient flex-shrink-0">
          <div className={`w-full h-full rounded-full p-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
            <img
              src={profileUser.avatarUrl}
              alt={profileUser.username}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Info & Stats */}
        <div className="flex-1 text-center md:text-left">
          {/* Top row: username & action buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
            <h2 className="text-xl font-bold tracking-tight">@{profileUser.username}</h2>
            <CheckCircle2 className="w-5 h-5 text-brand-blue fill-brand-blue" />

            <div className="flex items-center gap-2">
              {isSelf ? (
                <span className={`text-xs px-3 py-1.5 rounded-lg border font-semibold ${
                  isDark ? 'border-[#333] bg-[#161616] text-gray-300' : 'border-gray-300 bg-gray-100 text-gray-700'
                }`}>
                  Current Identity
                </span>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  className={`text-xs font-bold px-5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md ${
                    isFollowing
                      ? isDark ? 'bg-[#262626] hover:bg-[#333] text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'
                      : 'bg-brand-blue hover:bg-brand-hover text-white shadow-blue-500/20'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center md:justify-start gap-8 mb-4 text-sm">
            <div>
              <span className="font-bold">{posts.length}</span>{' '}
              <span className="text-gray-400">posts</span>
            </div>
            <div>
              <span className="font-bold">{followerCount}</span>{' '}
              <span className="text-gray-400">followers</span>
            </div>
            <div>
              <span className="font-bold">{profileUser.followingCount || 0}</span>{' '}
              <span className="text-gray-400">following</span>
            </div>
          </div>

          {/* Bio section */}
          <div>
            <div className="font-bold text-sm mb-1">{profileUser.displayName}</div>
            <p className="text-xs text-gray-300 max-w-md whitespace-pre-line leading-relaxed mb-3">
              {profileUser.bio}
            </p>

            {/* Fabric MSP Certificate badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono border ${
              isDark ? 'bg-[#121212] border-[#262626] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
              <span>Fabric ID: {profileUser.id}</span>
              <span className="text-emerald-400 font-semibold">• Org1MSP Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-t border-[#262626]/60 mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-3 px-6 text-xs font-bold uppercase tracking-widest border-t-2 -mt-[2px] transition-all ${
            activeTab === 'posts'
              ? 'border-white text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Posts ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 py-3 px-6 text-xs font-bold uppercase tracking-widest border-t-2 -mt-[2px] transition-all ${
            activeTab === 'ledger'
              ? 'border-white text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Ledger State</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' ? (
        posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="w-16 h-16 rounded-full border border-gray-700 flex items-center justify-center mx-auto mb-3">
              <Grid className="w-8 h-8 stroke-1" />
            </div>
            <h4 className="text-base font-semibold mb-1">No Posts Yet</h4>
            <p className="text-xs">Any post minted by @{profileUser.username} will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="group relative aspect-square bg-[#121212] overflow-hidden cursor-pointer rounded-sm md:rounded-lg"
              >
                <img
                  src={post.mediaUrl || `/api/ipfs/${post.contentHash}`}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Hover overlay with Like and Comment count */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-5 h-5 fill-white" />
                    <span>{post.likeCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    <span>{post.commentCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Ledger Raw State Inspector Tab */
        <div className={`p-6 rounded-2xl border font-mono text-xs space-y-4 ${
          isDark ? 'bg-[#141414] border-[#262626]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <span className="text-brand-blue font-bold">World State Key: Profile~{profileUser.id}</span>
            <span className="text-emerald-400">STATE_LEVELDB_OK</span>
          </div>

          <pre className="p-4 rounded-xl bg-black/60 overflow-x-auto text-[11px] text-gray-300">
            {JSON.stringify(profileUser, null, 2)}
          </pre>

          <div className="text-[11px] text-gray-400">
            * This asset is validated across validating peers on channel <span className="text-brand-blue">mychannel</span> and verified by Org1MSP.
          </div>
        </div>
      )}
    </div>
  );
}
