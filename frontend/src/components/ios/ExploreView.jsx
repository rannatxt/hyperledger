import { useState } from 'react';
import {
  Search, Heart, MessageCircle, Send, Bookmark,
  Film, LayoutGrid, Rows3, ShieldCheck, CheckCircle2,
  Lock, ExternalLink, Sparkles, Filter
} from 'lucide-react';
import { MOCK_EXPLORE_POSTS } from '../../data/mockExplorePosts';
import TamperProofVerificationCard from '../common/TamperProofVerificationCard';
import { getVideoPosterFallback } from '../../utils/thumbnail';
import { shortHash, relativeTime } from '../../utils/crypto';

export default function ExploreView({
  posts = [],
  onSelectPost,
  onOpenLedger,
  onOpenComments
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewLayout, setViewLayout] = useState('feed'); // 'feed' | 'grid'
  const [likedPosts, setLikedPosts] = useState({});

  // Merge mock explore posts with any user-uploaded posts passed in
  // Avoid duplicate IDs
  const combinedPosts = [
    ...MOCK_EXPLORE_POSTS,
    ...posts.filter(p => !MOCK_EXPLORE_POSTS.some(mp => mp.id === p.id))
  ];

  const categories = ['All', 'Verified Proofs', 'Reels', 'Smart Contracts', 'IPFS Assets'];

  const filtered = combinedPosts.filter(p => {
    const q = query.toLowerCase();
    const matchesQuery = !query || (
      p.caption?.toLowerCase().includes(q) ||
      p.authorUsername?.toLowerCase().includes(q) ||
      p.authorDisplayName?.toLowerCase().includes(q) ||
      p.contentHash?.toLowerCase().includes(q) ||
      p.blockHash?.toLowerCase().includes(q)
    );

    if (!matchesQuery) return false;

    if (activeCategory === 'Reels') {
      return p.mediaType === 'video';
    }
    if (activeCategory === 'Verified Proofs') {
      return !!p.perceptualHash;
    }
    if (activeCategory === 'Smart Contracts') {
      return p.caption?.toLowerCase().includes('contract') || p.caption?.toLowerCase().includes('fabric');
    }
    if (activeCategory === 'IPFS Assets') {
      return p.contentHash?.startsWith('bafy');
    }

    return true;
  });

  const toggleLike = (postId) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-24 bg-white select-none font-sans">
      {/* ── Search Bar & View Mode Switcher ── */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-[#EFEFEF] px-4 py-3 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* iOS Style Search Bar */}
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EFEFEF] text-[#262626] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#DBDBDB] border border-transparent transition-all">
            <Search className="w-4 h-4 text-[#8E8E8E] flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search creators, captions, or Fabric block hashes…"
              className="w-full bg-transparent border-none outline-none text-xs text-[#262626] placeholder:text-[#8E8E8E]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-[11px] text-[#8E8E8E] hover:text-[#262626]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Segmented View Toggle: Feed View vs Grid View */}
          <div className="flex items-center rounded-xl bg-[#EFEFEF] p-0.5 border border-[#DBDBDB]/40">
            <button
              onClick={() => setViewLayout('feed')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewLayout === 'feed'
                  ? 'bg-white text-[#262626] shadow-2xs'
                  : 'text-[#737373] hover:text-[#262626]'
              }`}
              title="Browse Explore in Feed View"
            >
              <Rows3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Feed</span>
            </button>
            <button
              onClick={() => setViewLayout('grid')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewLayout === 'grid'
                  ? 'bg-white text-[#262626] shadow-2xs'
                  : 'text-[#737373] hover:text-[#262626]'
              }`}
              title="Browse Explore in 3-Column Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-[#262626] text-white shadow-2xs'
                  : 'bg-[#FAFAFA] text-[#737373] hover:bg-[#EFEFEF] border border-[#EAEAEA]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content View: Feed or Grid ── */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center space-y-2 text-[#737373]">
          <Search className="w-8 h-8 mx-auto text-[#DBDBDB]" />
          <p className="text-sm font-semibold text-[#262626]">No matching assets found</p>
          <p className="text-xs">Try searching for other creators like elena_crypto or hyper_peer</p>
        </div>
      ) : viewLayout === 'feed' ? (
        /* ── EXPLORE FEED VIEW (Author handles, captions, fake block hashes, engagement buttons) ── */
        <div className="space-y-6 pt-3 px-2 sm:px-4">
          {filtered.map(post => {
            const isLiked = likedPosts[post.id] !== undefined ? likedPosts[post.id] : post.isLikedByViewer;
            const currentLikes = (post.likeCount || 0) + (likedPosts[post.id] && !post.isLikedByViewer ? 1 : 0);
            const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(post.mediaUrl || '');

            return (
              <article
                key={post.id}
                className="w-full bg-white rounded-2xl border border-[#EAEAEA] shadow-xs overflow-hidden transition-all hover:shadow-md"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between p-3.5 border-b border-[#F5F5F5]">
                  <div
                    onClick={() => onSelectPost?.(post)}
                    className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                  >
                    <div className="w-10 h-10 rounded-full ig-story-ring p-[2px] flex-shrink-0">
                      <div className="w-full h-full bg-white rounded-full p-[1.5px]">
                        <img
                          src={post.authorAvatar}
                          alt={post.authorUsername}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-bold text-[#262626] group-hover:text-[#0095F6] transition-colors truncate">
                          {post.authorUsername}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-[#0095F6] flex-shrink-0" />
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-[#0095F6] font-semibold border border-blue-200 ml-1">
                          {post.endorser || 'Org1MSP Peer'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#737373] font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00BA88] animate-pulse" />
                        <span>Block #{post.blockNumber}</span>
                        <span>·</span>
                        <span>{relativeTime(post.timestamp || Date.now())}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectPost?.(post)}
                    className="text-[11px] font-semibold text-[#0095F6] hover:text-[#1877F2] px-2.5 py-1 rounded-lg bg-blue-50/70 hover:bg-blue-100 transition-colors"
                  >
                    Details
                  </button>
                </div>

                {/* Media Container */}
                <div
                  onClick={() => onSelectPost?.(post)}
                  className="relative w-full aspect-square bg-black overflow-hidden cursor-pointer flex items-center justify-center group"
                >
                  {isVideo ? (
                    <video
                      src={post.mediaUrl}
                      poster={post.thumbnailUrl}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                  )}

                  {isVideo && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 pointer-events-none">
                      <Film className="w-3 h-3 fill-white" />
                      <span>REEL</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons Bar */}
                <div className="flex items-center justify-between px-3.5 pt-3 pb-1 text-[#262626]">
                  <div className="flex items-center gap-4">
                    {/* Like button */}
                    <button
                      onClick={() => toggleLike(post.id)}
                      className="active:scale-125 transition-transform"
                      aria-label="Like post"
                    >
                      <Heart
                        className={`w-6 h-6 transition-colors ${
                          isLiked
                            ? 'fill-[#ED4956] text-[#ED4956]'
                            : 'text-[#262626] stroke-[1.8]'
                        }`}
                      />
                    </button>

                    {/* Comment button */}
                    <button
                      onClick={() => onSelectPost ? onSelectPost(post) : onOpenComments?.(post)}
                      className="active:scale-125 transition-transform"
                      aria-label="Comment on post"
                    >
                      <MessageCircle className="w-6 h-6 stroke-[1.8]" />
                    </button>

                    {/* Ledger Inspect / Share */}
                    <button
                      onClick={() => onOpenLedger ? onOpenLedger(post) : onSelectPost?.(post)}
                      className="active:scale-125 transition-transform text-[#0095F6]"
                      title="Inspect Ledger"
                      aria-label="Inspect ledger"
                    >
                      <Send className="w-5 h-5 stroke-[1.8] -rotate-12" />
                    </button>
                  </div>

                  {/* Bookmark button */}
                  <button
                    onClick={() => {}}
                    className="active:scale-125 transition-transform"
                    aria-label="Bookmark"
                  >
                    <Bookmark className="w-6 h-6 stroke-[1.8]" />
                  </button>
                </div>

                {/* Likes Count */}
                <div className="px-3.5 py-0.5">
                  <span className="text-[13px] font-bold text-[#262626]">
                    {currentLikes} likes
                  </span>
                </div>

                {/* Caption */}
                <div className="px-3.5 py-1 text-[13px] text-[#262626] leading-relaxed">
                  <span className="font-bold mr-1.5">@{post.authorUsername}</span>
                  <span>{post.caption}</span>
                </div>

                {/* ── Tamper-Proof Verification Status Card & Details (Photos 2-3-4 UI) ── */}
                <div className="p-3.5 pt-2">
                  <TamperProofVerificationCard
                    sha256={post.contentHash}
                    perceptualHash={post.perceptualHash}
                    videoFingerprint={post.videoFingerprint}
                    blockNumber={post.blockNumber}
                    blockHash={post.blockHash}
                    channel={post.channel || 'mychannel'}
                  />
                </div>

                {/* Comments Trigger & Timestamp */}
                <div className="px-3.5 pb-3 pt-0 flex items-center justify-between text-xs text-[#737373]">
                  <button
                    onClick={() => onSelectPost?.(post)}
                    className="hover:text-[#262626] transition-colors"
                  >
                    View all {post.commentCount || 12} comments
                  </button>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E8E8E]">
                    {post.channel || 'mychannel'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* ── 3-Column Square Instagram Explore Grid ── */
        <div className="ig-profile-grid p-1">
          {filtered.map(post => {
            const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(post.mediaUrl || '');
            const thumb = post.thumbnailUrl || (isVideo ? getVideoPosterFallback(post.caption, post.id) : post.mediaUrl);

            return (
              <div
                key={post.id}
                onClick={() => onSelectPost?.(post)}
                className="ig-grid-item group rounded-sm overflow-hidden"
              >
                <img
                  src={thumb}
                  alt={post.caption || 'explore media'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Video Indicator */}
                {isVideo && (
                  <div className="absolute top-2 right-2 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                    <Film className="w-4 h-4 fill-white" />
                  </div>
                )}

                {/* Hover Scrim with Likes & Comments */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs pointer-events-none">
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 fill-white" />
                    {post.likeCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 fill-white" />
                    {post.commentCount || 0}
                  </span>
                </div>

                {/* Tamper-Proof Pill on hover */}
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-mono text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-[#00BA88]" />
                  <span>#{post.blockNumber}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
