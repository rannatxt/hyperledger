import React, { useState, useRef } from 'react';
import {
  X, Heart, MessageCircle, Send, Bookmark,
  ShieldCheck, CheckCircle2, Lock, ExternalLink,
  Play, Volume2, VolumeX, Copy, Check, MoreHorizontal
} from 'lucide-react';
import TamperProofVerificationCard from './TamperProofVerificationCard';
import { shortHash, relativeTime } from '../../utils/crypto';

export default function PostDetailsModal({
  post,
  isOpen,
  onClose,
  currentUser,
  onLikeToggle,
  onOpenLedger
}) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(() => [
    {
      id: 'cmt_1',
      author: 'elena_crypto',
      text: 'Verified on ledger! The transaction speed on Fabric is remarkable.',
      time: '32m ago'
    },
    {
      id: 'cmt_2',
      author: 'hyper_peer',
      text: 'Raft consensus validated block integrity without duplicate collision.',
      time: '18m ago'
    }
  ]);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const videoRef = useRef(null);

  if (!isOpen || !post) return null;

  const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(post.mediaUrl || '');

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments(prev => [
      ...prev,
      {
        id: 'cmt_' + Date.now(),
        author: currentUser?.username || 'ranna',
        text: commentText.trim(),
        time: 'Just now'
      }
    ]);
    setCommentText('');
  };

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs animate-fade-in select-none font-sans">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-[#DBDBDB]">
        {/* Close Button Mobile/Desktop */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all active:scale-95"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Left: Media Display Container ── */}
        <div className="w-full md:w-7/12 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[540px] max-h-[60vh] md:max-h-none overflow-hidden">
          {isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center cursor-pointer" onClick={toggleVideo}>
              <video
                ref={videoRef}
                src={post.mediaUrl}
                poster={post.thumbnailUrl}
                loop
                muted={isMuted}
                playsInline
                className="max-w-full max-h-[540px] object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>
              )}
              <button
                onClick={toggleMute}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
                aria-label="Toggle sound"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption || 'Asset preview'}
              className="max-w-full max-h-[540px] object-contain"
            />
          )}
        </div>

        {/* ── Right: Post Details, Tamper-Proof Card, & Comments ── */}
        <div className="w-full md:w-5/12 flex flex-col justify-between bg-white overflow-hidden max-h-[50vh] md:max-h-[540px]">
          {/* Top: Author Header */}
          <div className="p-3.5 border-b border-[#EFEFEF] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full ig-story-ring p-[2px] flex-shrink-0">
                <div className="w-full h-full bg-white rounded-full p-[1px]">
                  <img
                    src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={post.authorUsername}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#262626] truncate">
                    {post.authorUsername}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-[#0095F6] flex-shrink-0" />
                </div>
                <span className="text-[10px] text-[#737373] font-mono block">
                  Block #{post.blockNumber || 105} · Org1MSP
                </span>
              </div>
            </div>

            <button
              onClick={() => onOpenLedger?.(post)}
              className="text-[11px] font-semibold text-[#0095F6] hover:text-[#1877F2] px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
            >
              Inspect
            </button>
          </div>

          {/* Middle: Scrollable Details & Comments */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 no-scrollbar bg-white">
            {/* Caption */}
            <div className="flex items-start gap-2.5">
              <img
                src={post.authorAvatar}
                alt=""
                className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
              />
              <div className="text-xs text-[#262626] leading-relaxed">
                <span className="font-bold mr-1.5">{post.authorUsername}</span>
                <span>{post.caption}</span>
                <div className="text-[10px] text-[#8E8E8E] mt-1 font-mono">
                  {relativeTime(post.timestamp || Date.now())} · Channel: {post.channel || 'mychannel'}
                </div>
              </div>
            </div>

            {/* ── Tamper-Proof Verification Status Card (Photos 2-3-4 UI) ── */}
            <TamperProofVerificationCard
              sha256={post.contentHash}
              perceptualHash={post.perceptualHash}
              videoFingerprint={post.videoFingerprint}
              blockNumber={post.blockNumber || 105}
              blockHash={post.blockHash}
              channel={post.channel || 'mychannel'}
            />

            {/* Simulated Comments */}
            <div className="pt-2 border-t border-[#F2F2F2] space-y-2.5">
              <span className="text-[11px] font-bold text-[#8E8E8E] uppercase tracking-wider block">
                Ledger Endorsements & Comments
              </span>
              {comments.map((c) => (
                <div key={c.id} className="text-xs text-[#262626] flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold mr-1.5">@{c.author}</span>
                    <span className="text-[#374151]">{c.text}</span>
                  </div>
                  <span className="text-[10px] text-[#8E8E8E] flex-shrink-0 font-mono">{c.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Action Buttons & Comment Input */}
          <div className="p-3 border-t border-[#EFEFEF] bg-white flex-shrink-0 space-y-2">
            <div className="flex items-center justify-between text-[#262626]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onLikeToggle?.(post.id)}
                  className="active:scale-125 transition-transform"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      post.isLikedByViewer ? 'fill-[#ED4956] text-[#ED4956]' : 'text-[#262626] stroke-[1.8]'
                    }`}
                  />
                </button>
                <button className="active:scale-125 transition-transform">
                  <MessageCircle className="w-6 h-6 stroke-[1.8]" />
                </button>
                <button
                  onClick={() => onOpenLedger?.(post)}
                  className="active:scale-125 transition-transform text-[#0095F6]"
                  title="Inspect Ledger Block"
                >
                  <Send className="w-5 h-5 stroke-[1.8] -rotate-12" />
                </button>
              </div>

              <button
                onClick={() => setSaved(!saved)}
                className="active:scale-125 transition-transform"
              >
                <Bookmark className={`w-6 h-6 stroke-[1.8] ${saved ? 'fill-[#262626]' : ''}`} />
              </button>
            </div>

            <div className="text-xs font-bold text-[#262626]">
              {post.likeCount || 0} likes
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a verified comment…"
                className="w-full text-xs text-[#262626] placeholder:text-[#8E8E8E] border-none outline-none bg-transparent"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="text-xs font-bold text-[#0095F6] disabled:text-[#B2DFFC] transition-colors"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
