import { useState, useRef } from 'react';
import {
  Heart, MessageCircle, Send, Bookmark,
  MoreHorizontal, CheckCircle2, ShieldCheck,
  Copy, Check, Lock, ExternalLink, Eye, Video,
  Volume2, VolumeX, Play, Pause
} from 'lucide-react';
import { shortHash, relativeTime } from '../../utils/crypto';

const FILTER_MAP = {
  Normal: 'f-normal', Clarendon: 'f-clarendon', Gingham: 'f-gingham',
  Moon: 'f-moon', Juno: 'f-juno', Noir: 'f-noir', Vivid: 'f-vivid',
};

export default function DesktopPostCard({
  post,
  currentUser,
  onLikeToggle,
  onOpenComments,
  onOpenLedger
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedPHash, setCopiedPHash] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const lastTap = useRef(0);

  const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(post.mediaUrl || '');

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
    <article className="w-full bg-[#141416] border border-white/[0.08] rounded-[24px] mb-4 overflow-hidden select-none font-sans shadow-lg shadow-black/40">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-9 h-9 rounded-full story-ring p-[1.5px]">
            <div className="w-full h-full bg-black rounded-full p-[1.5px]">
              <img
                src={post.authorAvatar}
                alt={post.authorUsername}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white tracking-tight">{post.authorUsername}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#007aff] fill-[#007aff]" />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
              <span>Block #{post.blockNumber ?? '0'}</span>
              <span>· Org1MSP</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isVideo && (
            <span className="px-2 py-0.5 rounded-full bg-[#ff2d55]/20 text-[#ff2d55] text-[10px] font-mono font-bold flex items-center gap-1 border border-[#ff2d55]/30">
              <Video className="w-3 h-3" /> VIDEO
            </span>
          )}
          <button
            onClick={() => onOpenLedger?.(post)}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 active:scale-90 transition-all"
            title="Inspect Ledger Record"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Media Viewport (Video or Image) ── */}
      <div onClick={handleTap} className="relative w-full aspect-square bg-[#0a0a0a] overflow-hidden cursor-pointer">
        {isVideo ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={post.mediaUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Video Controls Overlay */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
              <button
                onClick={toggleAudio}
                className="p-2 rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-black/90 active:scale-90 transition-all border border-white/10"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#007aff]" />}
              </button>
              <button
                onClick={toggleVideoPlayback}
                className="p-2 rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-black/90 active:scale-90 transition-all border border-white/10"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#34c759]" />}
              </button>
            </div>
          </div>
        ) : (
          <img
            src={post.mediaUrl}
            alt="post media"
            className={`w-full h-full object-cover ${filterClass}`}
          />
        )}

        {/* Double-tap floating heart with spring burst */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-28 h-28 text-white fill-white drop-shadow-[0_0_28px_rgba(255,45,85,0.95)] animate-heart-burst" />
          </div>
        )}
      </div>

      {/* ── Action Toolbar ── */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLikeToggle(post.id)}
              className="active:scale-80 transition-transform"
            >
              <Heart
                className={`w-6 h-6 stroke-[1.8] transition-colors ${
                  post.isLikedByViewer
                    ? 'text-[#ff2d55] fill-[#ff2d55]'
                    : 'text-white hover:text-gray-300'
                }`}
              />
            </button>
            <button
              onClick={() => onOpenComments(post)}
              className="text-white hover:text-gray-300 active:scale-80 transition-transform"
            >
              <MessageCircle className="w-6 h-6 stroke-[1.8]" />
            </button>
            <button
              onClick={() => onOpenLedger?.(post)}
              className="text-white hover:text-gray-300 active:scale-80 transition-transform"
            >
              <Send className="w-6 h-6 stroke-[1.8]" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReceipt(!showReceipt)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all ${
                showReceipt
                  ? 'bg-[#007aff] text-white shadow-md shadow-blue-500/25'
                  : 'bg-white/10 text-gray-300 hover:bg-white/15'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#007aff]" />
              <span>Ledger Receipt</span>
            </button>

            <button
              onClick={() => setSaved(!saved)}
              className="text-white hover:text-gray-300 active:scale-80 transition-transform ml-1"
            >
              <Bookmark className={`w-5 h-5 stroke-[1.8] ${saved ? 'text-yellow-400 fill-yellow-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Like count */}
        <div className="mt-2 text-xs font-bold text-white tracking-tight">
          {(post.likeCount || 0).toLocaleString()} likes
        </div>

        {/* Caption */}
        <div className="mt-1 text-xs text-gray-200 leading-relaxed">
          <span className="font-bold text-white mr-1.5">{post.authorUsername}</span>
          <span>{post.caption}</span>
        </div>

        {/* Comments count */}
        <button
          onClick={() => onOpenComments(post)}
          className="mt-1.5 text-xs text-gray-400 hover:text-gray-300 block font-normal"
        >
          {post.commentCount > 0
            ? `View all ${post.commentCount} comments`
            : 'Add a comment…'}
        </button>

        {/* Timestamp */}
        <div className="mt-1 text-[10px] text-gray-400 font-mono uppercase tracking-wider">
          {relativeTime(post.timestamp)}
        </div>
      </div>

      {/* ── Expandable Hyperledger Fabric Cryptographic Receipt ── */}
      {showReceipt && (
        <div className="mx-3.5 mb-3.5 p-3 rounded-[18px] bg-black/60 border border-white/10 space-y-2 animate-fade-in text-[11px] font-mono">
          <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/[0.08] pb-1.5">
            <span className="flex items-center gap-1.5 text-[#007aff]">
              <Lock className="w-3.5 h-3.5" /> Immutable Fabric Ledger Proof
            </span>
            <span className="text-[10px] text-[#34c759] font-normal font-mono">VERIFIED BLOCK</span>
          </div>

          <div className="space-y-1 text-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Content Multihash:</span>
              <button onClick={copySha} className="flex items-center gap-1 text-[#007aff] hover:underline text-[10px]">
                {copiedSha ? <Check className="w-3 h-3 text-[#34c759]" /> : <Copy className="w-3 h-3" />}
                {shortHash(post.contentHash, 8, 8)}
              </button>
            </div>

            {post.videoFingerprint ? (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center gap-1">
                  <Video className="w-3 h-3 text-[#ff2d55]" /> Video Signature:
                </span>
                <button onClick={copyPHash} className="flex items-center gap-1 text-[#007aff] hover:underline text-[10px]">
                  {copiedPHash ? <Check className="w-3 h-3 text-[#34c759]" /> : <Copy className="w-3 h-3" />}
                  {shortHash(post.videoFingerprint, 8, 8)}
                </button>
              </div>
            ) : post.perceptualHash ? (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-[#007aff]" /> Image pHash:
                </span>
                <button onClick={copyPHash} className="flex items-center gap-1 text-[#007aff] hover:underline text-[10px]">
                  {copiedPHash ? <Check className="w-3 h-3 text-[#34c759]" /> : <Copy className="w-3 h-3" />}
                  0x{post.perceptualHash}
                </button>
              </div>
            ) : null}

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Endorsing Peer:</span>
              <span className="text-white">peer0.org1.example.com</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Consensus Orderer:</span>
              <span className="text-white">Raft (TLS 1.3 mutual auth)</span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
