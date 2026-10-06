import { useState } from 'react';
import {
  Grid, Bookmark, ShieldCheck, CheckCircle2, Heart,
  MessageCircle, Lock, Trash2, Play, Film, ChevronDown, UserCheck, Share2
} from 'lucide-react';
import { getVideoPosterFallback } from '../../utils/thumbnail';

export default function ProfileView({
  user,
  allUsers = [],
  posts = [],
  currentUser,
  onSwitchUser,
  onSelectPost,
  onDeletePost
}) {
  const [tab, setTab] = useState('grid'); // 'grid' | 'reels' | 'saved'
  const [switcher, setSwitcher] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const displayUser = user || currentUser;
  const userPosts = posts.filter(p => p.authorId === displayUser?.id);
  const userReels = userPosts.filter(p => p.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(p.mediaUrl || ''));
  const isSelf = currentUser && displayUser && currentUser.id === displayUser.id;

  if (!displayUser) return (
    <div className="flex items-center justify-center py-24 text-[#8E8E8E] text-xs">
      Loading profile…
    </div>
  );

  const handleDelete = async (e, postId) => {
    e.stopPropagation();
    if (window.confirm('Delete this post permanently from the Hyperledger Fabric Decentralized Ledger State with Raft Consensus Endorsement?')) {
      setDeletingId(postId);
      try {
        await onDeletePost?.(postId);
      } catch (err) {
        alert('Failed to delete post: ' + err.message);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const displayedList = tab === 'reels' ? userReels : userPosts;

  return (
    <div className="w-full max-w-2xl mx-auto pb-24 bg-white text-[#262626] select-none font-sans">
      {/* ── Top Bar with Account Switcher ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#EFEFEF] bg-white sticky top-0 z-20">
        <button
          onClick={() => setSwitcher(s => !s)}
          className="flex items-center gap-1.5 hover:bg-[#FAFAFA] px-2 py-1 rounded-lg transition-colors"
        >
          <span className="font-bold text-base tracking-tight text-[#262626]">{displayUser.username}</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-[#0095F6]" />
          <ChevronDown className="w-3.5 h-3.5 text-[#737373]" />
        </button>

        <button
          onClick={() => setSwitcher(s => !s)}
          className="text-xs text-[#0095F6] font-semibold px-2.5 py-1 rounded-md hover:bg-[#0095F6]/10 transition-colors"
        >
          Switch Identity
        </button>
      </div>

      {/* ── Fabric Account Switcher Dropdown ── */}
      {switcher && (
        <div className="mx-4 mt-2 p-2.5 rounded-2xl bg-white border border-[#DBDBDB] space-y-1 animate-fade-in shadow-xl">
          <p className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-wider px-2 py-1">
            Fabric Peer Identities
          </p>
          {allUsers.map(u => (
            <button
              key={u.id}
              onClick={() => { onSwitchUser?.(u); setSwitcher(false); }}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors ${
                u.id === currentUser?.id ? 'bg-[#FAFAFA] border border-[#E5E5E5]' : 'hover:bg-[#FAFAFA]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                <div className="text-left">
                  <div className="text-xs font-bold text-[#262626] flex items-center gap-1">
                    @{u.username}
                    {u.id === currentUser?.id && <span className="text-[10px] text-[#0095F6] font-normal">(Active)</span>}
                  </div>
                  <div className="text-[10px] text-[#737373]">{u.displayName}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#00BA88] font-bold">Org1MSP</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Profile Bio & Stats Header ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-4">
          {/* Avatar with Story Ring */}
          <div className="w-[78px] h-[78px] rounded-full ig-story-ring p-[2.5px] flex-shrink-0">
            <div className="w-full h-full bg-white rounded-full p-[2px]">
              <img
                src={displayUser.avatarUrl}
                alt={displayUser.username}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          {/* Stats: Posts, Followers, Following */}
          <div className="flex-1 flex justify-around text-center">
            <div>
              <span className="block text-[15px] font-bold text-[#262626]">{userPosts.length}</span>
              <span className="text-[12px] text-[#737373]">posts</span>
            </div>
            <div>
              <span className="block text-[15px] font-bold text-[#262626]">{displayUser.followerCount ?? 142}</span>
              <span className="text-[12px] text-[#737373]">followers</span>
            </div>
            <div>
              <span className="block text-[15px] font-bold text-[#262626]">{displayUser.followingCount ?? 89}</span>
              <span className="text-[12px] text-[#737373]">following</span>
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="mt-3 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-[#262626]">{displayUser.displayName}</h1>
            <span className="px-1.5 py-0.2 rounded bg-green-50 text-[9px] font-mono font-bold text-[#00BA88] border border-green-200">
              Org1MSP
            </span>
          </div>
          <p className="text-xs text-[#737373] font-mono">@{displayUser.username}</p>
          {displayUser.bio && (
            <p className="text-xs text-[#262626] leading-snug pt-1">
              {displayUser.bio}
            </p>
          )}
          <p className="text-[11px] text-[#0095F6] font-medium pt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#00BA88]" />
            <span>Hyperledger Fabric Verified Node · Raft Consensus</span>
          </p>
        </div>

        {/* Profile Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setSwitcher(true)}
            className="flex-1 py-1.5 rounded-lg bg-[#EFEFEF] hover:bg-[#DBDBDB] text-xs font-semibold text-[#262626] transition-colors text-center active:scale-98"
          >
            Switch Identity
          </button>
          <button
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            className="flex-1 py-1.5 rounded-lg bg-[#EFEFEF] hover:bg-[#DBDBDB] text-xs font-semibold text-[#262626] transition-colors text-center active:scale-98"
          >
            Share Profile
          </button>
        </div>

        {/* Story Highlights Bar */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pt-4 pb-2 border-b border-[#EFEFEF]">
          {[
            { title: 'Genesis', img: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=120&auto=format&fit=crop&q=80' },
            { title: 'Fabric 2.5', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' },
            { title: 'Proofs', img: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=120&auto=format&fit=crop&q=80' }
          ].map((hl) => (
            <div key={hl.title} className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer active:scale-95 transition-transform">
              <div className="w-[56px] h-[56px] rounded-full p-[2px] border border-[#DBDBDB]">
                <img src={hl.img} alt={hl.title} className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-[11px] text-[#262626] font-normal">{hl.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3 Tabs: Grid (Posts), Reels, Saved ── */}
      <div className="flex border-t border-[#EFEFEF] text-[#737373]">
        <button
          onClick={() => setTab('grid')}
          className={`flex-1 py-2.5 flex items-center justify-center transition-colors border-t-[1.5px] ${
            tab === 'grid'
              ? 'border-[#262626] text-[#262626]'
              : 'border-transparent text-[#8E8E8E]'
          }`}
          aria-label="Posts grid"
        >
          <Grid className="w-5 h-5 stroke-[1.8]" />
        </button>

        <button
          onClick={() => setTab('reels')}
          className={`flex-1 py-2.5 flex items-center justify-center transition-colors border-t-[1.5px] ${
            tab === 'reels'
              ? 'border-[#262626] text-[#262626]'
              : 'border-transparent text-[#8E8E8E]'
          }`}
          aria-label="Reels grid"
        >
          <Film className="w-5 h-5 stroke-[1.8]" />
        </button>

        <button
          onClick={() => setTab('saved')}
          className={`flex-1 py-2.5 flex items-center justify-center transition-colors border-t-[1.5px] ${
            tab === 'saved'
              ? 'border-[#262626] text-[#262626]'
              : 'border-transparent text-[#8E8E8E]'
          }`}
          aria-label="Saved posts"
        >
          <Bookmark className="w-5 h-5 stroke-[1.8]" />
        </button>
      </div>

      {/* ── 3-Column Square Instagram Grid ── */}
      {tab !== 'saved' ? (
        displayedList.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-xs text-[#8E8E8E]">
              {tab === 'reels' ? 'No video reels recorded on Fabric yet.' : 'No posts shared yet.'}
            </p>
          </div>
        ) : (
          <div className="ig-profile-grid">
            {displayedList.map((post) => {
              const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(post.mediaUrl || '');
              const thumb = post.thumbnailUrl || (isVideo ? getVideoPosterFallback(post.caption, post.id) : post.mediaUrl);
              const isDeletingThis = deletingId === post.id;

              return (
                <div
                  key={post.id}
                  onClick={() => onSelectPost?.(post)}
                  className={`ig-grid-item group ${isDeletingThis ? 'opacity-30 pointer-events-none' : ''}`}
                >
                  <img
                    src={thumb}
                    alt={post.caption || 'grid media'}
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 f-${post.filterName?.toLowerCase() || 'normal'}`}
                    loading="lazy"
                  />

                  {/* Video Reel Icon badge in top right */}
                  {isVideo && (
                    <div className="absolute top-2 right-2 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                      <Film className="w-4 h-4 fill-white" />
                    </div>
                  )}

                  {/* Hover Overlay with Like & Comment Count */}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs pointer-events-none">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 fill-white" />
                      {post.likeCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 fill-white" />
                      {post.commentCount || 0}
                    </span>
                  </div>

                  {/* Delete Button (visible on hover for post owner) */}
                  {isSelf && (
                    <button
                      onClick={(e) => handleDelete(e, post.id)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-[#ED4956] text-white opacity-0 group-hover:opacity-100 transition-all active:scale-90 z-10"
                      title="Delete post permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="p-12 text-center space-y-2 bg-[#FAFAFA] rounded-xl mx-4 mt-4 border border-[#EAEAEA]">
          <Lock className="w-7 h-7 text-[#0095F6] mx-auto" />
          <p className="font-bold text-sm text-[#262626]">Saved to Ledger</p>
          <p className="text-xs text-[#737373] max-w-sm mx-auto">
            Bookmarked media and block proofs are indexed from the Hyperledger Fabric Decentralized Ledger State.
          </p>
        </div>
      )}
    </div>
  );
}
