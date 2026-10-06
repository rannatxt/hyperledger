import { useState, useRef } from 'react';
import {
  Heart, MessageCircle, Send, Bookmark,
  MoreHorizontal, CheckCircle2, ShieldCheck,
  Trash2, Lock, Play, Pause, Volume2, VolumeX,
  ExternalLink, Copy, Check, Video, Eye, Share2
} from 'lucide-react';
import { shortHash, relativeTime } from '../../utils/crypto';
import { getVideoPosterFallback } from '../../utils/thumbnail';

const FILTER_MAP = {
  Normal: 'f-normal', Clarendon: 'f-clarendon', Gingham: 'f-gingham',
  Moon: 'f-moon', Juno: 'f-juno', Noir: 'f-noir', Vivid: 'f-vivid',
};

export default function DesktopPostCard({
  post,
  currentUser,
  onLikeToggle,
  onOpenComments,
  onOpenLedger,
  onDeletePost
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedPHash, setCopiedPHash] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const videoRef = useRef(null);
  const lastTap = useRef(0);

  const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(post.mediaUrl || '');
  const isOwner = currentUser && post.authorId === currentUser.id;

  // Determine thumbnail or media to show
  const displayThumbnail = post.thumbnailUrl || (isVideo ? getVideoPosterFallback(post.caption || 'Video Reel', post.id) : post.mediaUrl);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      setShowHeart(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15, 30]);
      }
      if (!post.isLikedByViewer) onLikeToggle(post.id);
      setTimeout(() => setShowHeart(false), 900);
    }
    lastTap.current = now;
  };

  const toggleVideoPlayback = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleAudio = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;
    if (confirm('Delete this post permanently from the Hyperledger Fabric ledger?')) {
      setIsDeleting(true);
      try {
        await onDeletePost?.(post.id);
      } catch (err) {
        setIsDeleting(false);
        alert('Failed to delete post: ' + err.message);
      }
    }
  };

  const copySha = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(post.contentHash);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const copyPHash = (e) => {
    e.stopPropagation();
    const hashToCopy = post.videoFingerprint || post.perceptualHash;
    if (hashToCopy) {
      navigator.clipboard.writeText(hashToCopy);
      setCopiedPHash(true);
      setTimeout(() => setCopiedPHash(false), 2000);
    }
  };

  const filterClass = FILTER_MAP[post.filterName] || 'f-normal';

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMenuOpen(false); }}
      className={`masonry-brick group transition-all duration-300 ${isDeleting ? 'opacity-30 scale-95 pointer-events-none' : ''}`}
    >
      <div className="bg-white rounded-[20px] border border-[#EFEFEF] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.1)] transition-all duration-300">
        
        {/* ── Visual Media Container (Pinterest Card Pin) ── */}
        <div
          onClick={handleTap}
          className="relative w-full overflow-hidden bg-[#F5F5F5] cursor-zoom-in"
        >
          {isVideo && isPlaying ? (
            <div className="relative w-full aspect-[4/5] bg-black">
              <video
                ref={videoRef}
                src={post.mediaUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Live Video Controls */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
                <button
                  onClick={toggleAudio}
                  className="p-2 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md active:scale-95 transition-all"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#E60023]" />}
                </button>
                <button
                  onClick={toggleVideoPlayback}
                  className="p-2 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md active:scale-95 transition-all"
                  title="Pause"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full aspect-[4/5] overflow-hidden group">
              <img
                src={displayThumbnail}
                alt={post.caption || 'Media post'}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${filterClass}`}
                loading="lazy"
              />

              {/* Video Badge / Play Trigger */}
              {isVideo && (
                <div
                  onClick={(e) => { e.stopPropagation(); setIsPlaying(true); }}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-white/95 text-[#E60023] flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-all p-3">
                    <Play className="w-6 h-6 fill-[#E60023] translate-x-0.5" />
                  </div>
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold font-mono tracking-wider flex items-center gap-1 border border-white/20">
                    <Video className="w-3 h-3 text-[#E60023]" /> VIDEO
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Double-Tap Heart Burst Animation ── */}
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart className="w-24 h-24 text-white fill-[#E60023] drop-shadow-[0_8px_24px_rgba(230,0,35,0.7)] animate-heart-burst" />
            </div>
          )}

          {/* ── Pinterest Hover Floating Actions Overlay ── */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-200 z-10 p-3 flex flex-col justify-between ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top Row: Fabric Block Badge & Red Save / Pin Pill */}
            <div className="flex items-center justify-between pointer-events-auto">
              <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-mono font-semibold text-[#111111] shadow-sm flex items-center gap-1 border border-black/5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#27ae60]" />
                #{post.blockNumber ?? '0'} Fabric
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 ${
                  saved
                    ? 'bg-[#111111] text-white'
                    : 'bg-[#E60023] hover:bg-[#AD081B] text-white'
                }`}
              >
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>

            {/* Bottom Row: Quick Actions (Receipt, Like, and Delete Button if Author) */}
            <div className="flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-1.5">
                {/* Proof / Receipt Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowReceipt(!showReceipt); }}
                  className={`p-2 rounded-full text-xs font-semibold backdrop-blur-md shadow-md transition-all active:scale-90 ${
                    showReceipt ? 'bg-[#E60023] text-white' : 'bg-white/90 hover:bg-white text-[#111111]'
                  }`}
                  title="Fabric Ledger Proof"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>

                {/* Inspect Modal Trigger */}
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenLedger?.(post); }}
                  className="p-2 rounded-full bg-white/90 hover:bg-white text-[#111111] backdrop-blur-md shadow-md transition-all active:scale-90"
                  title="Inspect on Hyperledger Blockchain"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Delete Button (prominently available for post owner) */}
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 rounded-full bg-white/95 hover:bg-[#E60023] text-red-600 hover:text-white backdrop-blur-md shadow-md transition-all active:scale-90 border border-red-100"
                    title="Delete post permanently from ledger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Like Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onLikeToggle(post.id); }}
                  className="p-2 rounded-full bg-white/90 hover:bg-white text-[#111111] backdrop-blur-md shadow-md transition-all active:scale-90"
                  title={post.isLikedByViewer ? 'Unlike' : 'Like'}
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      post.isLikedByViewer
                        ? 'fill-[#E60023] text-[#E60023]'
                        : 'text-[#111111]'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pin Details & Metadata (Clean White Typography) ── */}
        <div className="p-3.5 space-y-2">
          {/* Caption */}
          {post.caption && (
            <p className="text-xs font-semibold text-[#111111] leading-snug line-clamp-2">
              {post.caption}
            </p>
          )}

          {/* Author & Interactions Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                alt={post.authorUsername}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-black/10 flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#111111] truncate block hover:underline cursor-pointer">
                  {post.authorUsername}
                </span>
                <span className="text-[10px] text-[#767676] font-mono block">
                  {relativeTime(post.timestamp)}
                </span>
              </div>
            </div>

            {/* Counts & More Options */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {/* Likes & Comments Count */}
              <button
                onClick={(e) => { e.stopPropagation(); onLikeToggle(post.id); }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#555555] hover:text-[#E60023] transition-colors"
              >
                <Heart className={`w-3.5 h-3.5 ${post.isLikedByViewer ? 'fill-[#E60023] text-[#E60023]' : ''}`} />
                <span>{post.likeCount || 0}</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onOpenComments(post); }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#555555] hover:text-[#111111] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{post.commentCount || 0}</span>
              </button>

              {/* Owner menu with delete option */}
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete post"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ── Expandable Cryptographic Ledger Proof ── */}
          {showReceipt && (
            <div className="mt-3 p-3 rounded-2xl bg-[#F8F8F8] border border-[#EAEAEA] text-[11px] font-mono space-y-2 animate-fade-in text-[#222222]">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-1.5">
                <span className="font-bold flex items-center gap-1 text-[#E60023]">
                  <Lock className="w-3 h-3" /> Ledger Record
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 font-bold">
                  IMMUTABLE
                </span>
              </div>

              <div>
                <span className="text-[#767676] block text-[10px]">Content Hash (CIDv1):</span>
                <div className="flex items-center justify-between font-mono text-[10px] bg-white p-1.5 rounded-lg border border-[#E5E5E5] mt-0.5">
                  <span className="truncate pr-1 text-[#111111]">{post.contentHash}</span>
                  <button onClick={copySha} className="text-[#767676] hover:text-[#111111] p-0.5">
                    {copiedSha ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {post.perceptualHash && (
                <div>
                  <span className="text-[#767676] block text-[10px]">Perceptual Hash (pHash):</span>
                  <div className="flex items-center justify-between font-mono text-[10px] bg-white p-1.5 rounded-lg border border-[#E5E5E5] mt-0.5">
                    <span className="truncate pr-1 text-[#111111]">{post.perceptualHash}</span>
                    <button onClick={copyPHash} className="text-[#767676] hover:text-[#111111] p-0.5">
                      {copiedPHash ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 text-[10px] text-[#767676]">
                <span>Peer: Org1MSP (Fabric)</span>
                <span className="text-[#E60023] font-bold cursor-pointer" onClick={() => onOpenLedger?.(post)}>
                  View Full Block →
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
