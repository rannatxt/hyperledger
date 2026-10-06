import { useState } from 'react';
import {
  Grid, Bookmark, ShieldCheck, CheckCircle2, Heart,
  MessageCircle, Lock, Trash2, Video, Play, ExternalLink
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
  const [tab, setTab] = useState('grid');
  const [switcher, setSwitcher] = useState(false);

  const displayUser = user || currentUser;
  const userPosts = posts.filter(p => p.authorId === displayUser?.id);
  const isSelf = currentUser && displayUser && currentUser.id === displayUser.id;

  if (!displayUser) return (
    <div className="flex items-center justify-center py-24 text-[#767676] text-xs">
      Loading profile…
    </div>
  );

  const handleDelete = async (e, postId) => {
    e.stopPropagation();
    if (confirm('Permanently delete this pin from Hyperledger Fabric ledger?')) {
      try {
        await onDeletePost?.(postId);
      } catch (err) {
        alert('Failed to delete post: ' + err.message);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 text-[#111111] select-none bg-white">
      {/* ── Profile Top Bar / Switcher ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#EFEFEF] bg-white sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <button
          onClick={() => setSwitcher(s => !s)}
          className="flex items-center gap-1.5 hover:bg-[#F0F0F0] px-3 py-1.5 rounded-full transition-colors"
        >
          <span className="font-extrabold text-base tracking-tight text-[#111111]">{displayUser.username}</span>
          <CheckCircle2 className="w-4 h-4 text-[#E60023] fill-[#E60023]" />
          <span className="text-xs text-[#767676]">▾</span>
        </button>
        <button
          onClick={() => setSwitcher(s => !s)}
          className="text-xs text-[#E60023] font-bold px-3 py-1.5 rounded-full hover:bg-[#FFF0F2] transition-colors"
        >
          Switch Identity
        </button>
      </div>

      {/* ── Switcher Dropdown Modal ── */}
      {switcher && (
        <div className="mx-4 mt-2 p-3 rounded-2xl bg-white border border-[#EAEAEA] space-y-1.5 animate-fade-in shadow-xl">
          <p className="text-[10px] font-bold text-[#767676] uppercase tracking-wider px-2 mb-1.5">
            Switch Hyperledger Fabric Identity
          </p>
          {allUsers.map(u => (
            <button
              key={u.id}
              onClick={() => { onSwitchUser?.(u); setSwitcher(false); }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                u.id === currentUser?.id ? 'bg-[#FFF0F2] border border-[#FFDADA]' : 'hover:bg-[#F8F8F8]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                <div className="text-left">
                  <div className="text-xs font-bold text-[#111111] flex items-center gap-1">
                    @{u.username}
                    {u.id === currentUser?.id && <span className="text-[10px] text-[#E60023] font-normal">(Active)</span>}
                  </div>
                  <div className="text-[10px] text-[#767676]">{u.displayName}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#27ae60] font-bold">Org1MSP</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Pinterest Profile Header ── */}
      <div className="px-4 pt-8 pb-6 flex flex-col items-center text-center space-y-4">
        {/* Large Centered Avatar */}
        <div className="w-28 h-28 rounded-full p-1 ring-2 ring-[#E60023]/20 shadow-md">
          <img
            src={displayUser.avatarUrl}
            alt={displayUser.username}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">{displayUser.displayName}</h1>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-xs font-semibold text-[#767676] font-mono">@{displayUser.username}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-[10px] font-mono text-green-700 font-bold border border-green-200">
              <ShieldCheck className="w-3 h-3 text-[#27ae60]" /> {displayUser.mspId || 'Org1MSP'}
            </span>
          </div>
          {displayUser.bio && (
            <p className="text-xs text-[#555555] max-w-md mx-auto mt-2 leading-relaxed">
              {displayUser.bio}
            </p>
          )}
        </div>

        {/* Minimalist Stats Row */}
        <div className="flex items-center gap-4 text-center">
          <div className="px-4 py-2 rounded-2xl bg-[#F0F0F0]">
            <span className="text-sm font-extrabold text-[#111111] block font-mono">{userPosts.length}</span>
            <span className="text-[10px] text-[#767676] font-semibold uppercase tracking-wider">Pins</span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#F0F0F0]">
            <span className="text-sm font-extrabold text-[#111111] block font-mono">{displayUser.followerCount ?? 3}</span>
            <span className="text-[10px] text-[#767676] font-semibold uppercase tracking-wider">Followers</span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#F0F0F0]">
            <span className="text-sm font-extrabold text-[#111111] block font-mono">{displayUser.followingCount ?? 2}</span>
            <span className="text-[10px] text-[#767676] font-semibold uppercase tracking-wider">Following</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setSwitcher(true)}
            className="px-5 py-2 rounded-full bg-[#F0F0F0] hover:bg-[#E2E2E2] text-xs font-bold text-[#111111] transition-all active:scale-95"
          >
            Switch Profile
          </button>
          <button
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            className="px-5 py-2 rounded-full bg-[#F0F0F0] hover:bg-[#E2E2E2] text-xs font-bold text-[#111111] transition-all active:scale-95"
          >
            Share Profile
          </button>
        </div>
      </div>

      {/* ── Pinterest Board Tabs ── */}
      <div className="flex justify-center border-b border-[#EFEFEF] mt-2 mb-6">
        <button
          onClick={() => setTab('grid')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            tab === 'grid'
              ? 'border-[#111111] text-[#111111]'
              : 'border-transparent text-[#767676] hover:text-[#111111]'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Created Pins ({userPosts.length})</span>
        </button>

        <button
          onClick={() => setTab('saved')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            tab === 'saved'
              ? 'border-[#111111] text-[#111111]'
              : 'border-transparent text-[#767676] hover:text-[#111111]'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved to Ledger</span>
        </button>
      </div>

      {/* ── Pinterest Masonry Grid of Pins ── */}
      {tab === 'grid' ? (
        userPosts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-xs text-[#767676]">No pins committed to Hyperledger Fabric by this creator yet.</p>
          </div>
        ) : (
          <div className="masonry-columns px-3 md:px-6">
            {userPosts.map(post => {
              const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(post.mediaUrl || '');
              const thumb = post.thumbnailUrl || (isVideo ? getVideoPosterFallback(post.caption, post.id) : post.mediaUrl);

              return (
                <div
                  key={post.id}
                  onClick={() => onSelectPost?.(post)}
                  className="masonry-brick group cursor-pointer mb-4"
                >
                  <div className="bg-white rounded-[20px] border border-[#EFEFEF] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                    {/* Media Thumbnail */}
                    <div className="relative aspect-[4/5] bg-[#F5F5F5] overflow-hidden">
                      <img
                        src={thumb}
                        alt={post.caption || 'pin'}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 f-${post.filterName?.toLowerCase() || 'normal'}`}
                        loading="lazy"
                      />

                      {/* Video Indicator */}
                      {isVideo && (
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-bold flex items-center gap-1 border border-white/20">
                          <Play className="w-3 h-3 fill-white" /> VIDEO
                        </div>
                      )}

                      {/* Block Height Pill */}
                      <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-[#111111] border border-black/5">
                        #{post.blockNumber ?? '0'} Fabric
                      </div>

                      {/* Delete Button (Trash Icon) for owner */}
                      {isSelf && (
                        <button
                          onClick={(e) => handleDelete(e, post.id)}
                          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 hover:bg-[#E60023] text-red-600 hover:text-white shadow-md transition-all active:scale-90"
                          title="Delete post permanently from ledger"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Pin Caption & Likes Footer */}
                    <div className="p-3 space-y-1.5">
                      {post.caption && (
                        <p className="text-xs font-semibold text-[#111111] line-clamp-2 leading-snug">
                          {post.caption}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-[#767676] pt-1">
                        <span className="flex items-center gap-1 font-semibold">
                          <Heart className={`w-3 h-3 ${post.likeCount > 0 ? 'fill-[#E60023] text-[#E60023]' : ''}`} />
                          {post.likeCount || 0}
                        </span>

                        <span className="flex items-center gap-1 font-semibold">
                          <MessageCircle className="w-3 h-3" />
                          {post.commentCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="p-12 text-center space-y-3 bg-[#F8F8F8] rounded-2xl mx-4 border border-[#EAEAEA]">
          <Lock className="w-8 h-8 text-[#E60023] mx-auto" />
          <p className="font-bold text-sm text-[#111111]">Saved to Ledger</p>
          <p className="text-xs text-[#767676] leading-relaxed max-w-sm mx-auto">
            Saved pins are indexed immutably on the Hyperledger Fabric ledger under your identity composite key.
          </p>
        </div>
      )}
    </div>
  );
}
