import { useState, useRef } from 'react';
import {
  Heart, MessageCircle, Send, Bookmark,
  MoreHorizontal, CheckCircle2, ShieldCheck,
  Trash2, Volume2, VolumeX, Play, Copy, Check, Lock, ExternalLink
} from 'lucide-react';
import { shortHash, relativeTime } from '../../utils/crypto';
import { getVideoPosterFallback } from '../../utils/thumbnail';
import TamperProofVerificationCard from '../common/TamperProofVerificationCard';

const FILTER_MAP = {
  Normal: 'f-normal', Clarendon: 'f-clarendon', Gingham: 'f-gingham',
  Moon: 'f-moon', Juno: 'f-juno', Noir: 'f-noir', Vivid: 'f-vivid',
};

export default function PostCard({
  post,
  currentUser,
  onLikeToggle,
  onOpenComments,
  onOpenLedger,
  onDeletePost
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [copiedSha, setCopiedSha] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProof, setShowProof] = useState(false);

  const videoRef = useRef(null);
  const lastTap = useRef(0);

  const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(post.mediaUrl || '');
  const isOwner = currentUser && post.authorId === currentUser.id;

  const displayThumbnail = post.thumbnailUrl || (isVideo ? getVideoPosterFallback(post.caption, post.id) : post.mediaUrl);

  const triggerHaptic = (type = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'heart') navigator.vibrate([15, 30]);
      else navigator.vibrate([8]);
    }
  };

  // Double tap to like gesture
  const handleMediaTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      setShowHeart(true);
      triggerHaptic('heart');
      if (!post.isLikedByViewer) {
        onLikeToggle?.(post.id);
      }
      setTimeout(() => setShowHeart(false), 850);
    } else {
      if (isVideo) {
        toggleVideoPlayback();
      }
    }
    lastTap.current = now;
  };

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
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

  const handleDelete = async () => {
    if (isDeleting) return;
    if (window.confirm('Delete this post permanently from your phone and the Hyperledger Fabric ledger?')) {
      setIsDeleting(true);
      setMenuOpen(false);
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
    if (post.contentHash) {
      navigator.clipboard.writeText(post.contentHash);
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    }
  };

  const filterClass = FILTER_MAP[post.filterName] || 'f-normal';

  return (
    <article className={`w-full bg-white ig-card select-none font-sans transition-opacity duration-300 ${isDeleting ? 'opacity-30 pointer-events-none' : ''}`}>
      {/* ── Post Header ── */}
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-[38px] h-[38px] rounded-full ig-story-ring p-[2px]">
            <div className="w-full h-full bg-white rounded-full p-[1.5px]">
              <img
                src={post.authorAvatar}
                alt={post.authorUsername}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold text-[#262626] tracking-tight">
                {post.authorUsername}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-[#0095F6]" />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#737373] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00BA88]" />
              <span>Block #{post.blockNumber ?? '0'}</span>
              <span>· Org1MSP</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setMenuOpen(true)}
          className="text-[#262626] p-1.5 active:scale-90 transition-transform"
          aria-label="More options"
        >
          <MoreHorizontal className="w-5 h-5 text-[#262626]" />
        </button>
      </div>

      {/* ── Media Display ── */}
      <div
        onClick={handleMediaTap}
        className="relative w-full aspect-square bg-[#FAFAFA] overflow-hidden cursor-pointer flex items-center justify-center"
      >
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={post.mediaUrl}
              poster={displayThumbnail}
              loop
              muted={isMuted}
              playsInline
              webkit-playsinline="true"
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Play/Pause overlay badge */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </div>
              </div>
            )}

            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all active:scale-90 z-10"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
            </button>

            {/* Reel Badge */}
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 pointer-events-none">
              <Play className="w-2.5 h-2.5 fill-white" />
              <span>REEL</span>
            </div>
          </>
        ) : (
          <img
            src={post.mediaUrl}
            alt={post.caption || 'post'}
            className={`w-full h-full object-cover ${filterClass}`}
            loading="lazy"
          />
        )}

        {/* Double-tap Floating Heart Animation */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-24 h-24 text-white fill-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] animate-heart-burst" />
          </div>
        )}
      </div>

      {/* ── Action Buttons Bar ── */}
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1 text-[#262626]">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={() => { triggerHaptic('heart'); onLikeToggle?.(post.id); }}
            className="active:scale-125 transition-transform"
            aria-label="Like"
          >
            <Heart
              className={`w-[25px] h-[25px] transition-colors ${
                post.isLikedByViewer
                  ? 'fill-[#ED4956] text-[#ED4956]'
                  : 'text-[#262626] stroke-[1.8]'
              }`}
            />
          </button>

          {/* Comment */}
          <button
            onClick={() => { triggerHaptic(); onOpenComments?.(post); }}
            className="active:scale-125 transition-transform text-[#262626]"
            aria-label="Comment"
          >
            <MessageCircle className="w-[24px] h-[24px] stroke-[1.8]" />
          </button>

          {/* Share / Ledger */}
          <button
            onClick={() => { triggerHaptic(); onOpenLedger?.(post); }}
            className="active:scale-125 transition-transform text-[#262626]"
            aria-label="Share"
          >
            <Send className="w-[23px] h-[23px] stroke-[1.8] -rotate-12" />
          </button>
        </div>

        {/* Bookmark */}
        <button
          onClick={() => { triggerHaptic(); setSaved(!saved); }}
          className="active:scale-125 transition-transform text-[#262626]"
          aria-label="Save"
        >
          <Bookmark
            className={`w-[24px] h-[24px] stroke-[1.8] ${
              saved ? 'fill-[#262626] text-[#262626]' : 'text-[#262626]'
            }`}
          />
        </button>
      </div>

      {/* ── Likes Count ── */}
      <div className="px-3.5 py-0.5">
        <span className="text-[13px] font-bold text-[#262626]">
          {post.likeCount || 0} {post.likeCount === 1 ? 'like' : 'likes'}
        </span>
      </div>

      {/* ── Caption ── */}
      <div className="px-3.5 py-0.5 text-[13px] text-[#262626] leading-snug">
        <span className="font-bold mr-1.5 cursor-pointer">{post.authorUsername}</span>
        <span>{post.caption}</span>
      </div>

      {/* ── Tamper-Proof Cryptographic Ledger Banner ── */}
      <div className="px-3.5 pt-1.5 pb-1">
        <button
          onClick={() => setShowProof(!showProof)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] hover:border-[#0095F6]/40 transition-all text-left"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#262626]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00BA88] flex-shrink-0" />
            <span className="text-[#737373]">Fabric Proof:</span>
            <span className="text-[#0095F6] font-semibold">{shortHash(post.contentHash, 5, 5)}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-[#737373] font-mono">
            <span>Verified</span>
            <CheckCircle2 className="w-3 h-3 text-[#00BA88]" />
          </div>
        </button>

        {/* Expanded Ledger Verification Details */}
        {showProof && (
          <div className="mt-1.5 space-y-2 animate-fade-in">
            <TamperProofVerificationCard
              sha256={post.contentHash}
              perceptualHash={post.perceptualHash}
              videoFingerprint={post.videoFingerprint}
              blockNumber={post.blockNumber || 105}
              blockHash={post.blockHash}
              channel={post.channel || 'mychannel'}
            />
            <button
              onClick={() => onOpenLedger?.(post)}
              className="w-full py-1.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#0095F6] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Inspect Block #{post.blockNumber || 105} on Fabric Ledger</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Comments Preview ── */}
      <div className="px-3.5 py-0.5">
        <button
          onClick={() => { triggerHaptic(); onOpenComments?.(post); }}
          className="text-[12px] text-[#737373] hover:text-[#262626] transition-colors"
        >
          {post.commentCount > 0
            ? `View all ${post.commentCount} comments`
            : 'Add a comment…'}
        </button>
      </div>

      {/* ── Timestamp ── */}
      <div className="px-3.5 pb-3 pt-0.5">
        <span className="text-[10px] uppercase tracking-wider text-[#8E8E8E] font-medium font-sans">
          {relativeTime(post.timestamp || Date.now())}
        </span>
      </div>

      {/* ── iOS Action Sheet Modal ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-t-[20px] sm:rounded-[20px] overflow-hidden divide-y divide-[#EFEFEF] shadow-2xl animate-sheet-up">
            {isOwner && (
              <button
                onClick={handleDelete}
                className="w-full py-3.5 text-center text-sm font-bold text-[#ED4956] hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Post</span>
              </button>
            )}

            <button
              onClick={() => { setMenuOpen(false); onOpenLedger?.(post); }}
              className="w-full py-3.5 text-center text-sm font-medium text-[#262626] hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors"
            >
              Inspect on Hyperledger Fabric
            </button>

            <button
              onClick={(e) => { copySha(e); setMenuOpen(false); }}
              className="w-full py-3.5 text-center text-sm font-medium text-[#262626] hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors"
            >
              Copy SHA-256 Hash
            </button>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setMenuOpen(false);
              }}
              className="w-full py-3.5 text-center text-sm font-medium text-[#262626] hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors"
            >
              Share Post
            </button>

            <button
              onClick={() => setMenuOpen(false)}
              className="w-full py-3.5 text-center text-sm font-semibold text-[#737373] hover:bg-[#FAFAFA] active:bg-[#F0F0F0] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
