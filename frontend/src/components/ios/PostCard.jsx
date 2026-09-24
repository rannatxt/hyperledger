import { useState, useRef } from 'react';
import {
  Heart, MessageCircle, Send, Bookmark,
  MoreHorizontal, CheckCircle2, ShieldCheck,
  Copy, Check, Lock, ExternalLink, Eye
} from 'lucide-react';
import { shortHash, relativeTime } from '../../utils/crypto';

const FILTER_MAP = {
  Normal: 'f-normal', Clarendon: 'f-clarendon', Gingham: 'f-gingham',
  Moon: 'f-moon', Juno: 'f-juno', Noir: 'f-noir', Vivid: 'f-vivid',
};

export default function PostCard({ post, currentUser, onLikeToggle, onOpenComments, onOpenLedger }) {
  const [showHeart, setShowHeart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedPHash, setCopiedPHash] = useState(false);
  const lastTap = useRef(0);

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

  const copySha = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(post.contentHash);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const copyPHash = (e) => {
    e.stopPropagation();
    if (post.perceptualHash) {
      navigator.clipboard.writeText(post.perceptualHash);
      setCopiedPHash(true);
      setTimeout(() => setCopiedPHash(false), 2000);
    }
  };

  const filterClass = FILTER_MAP[post.filterName] || 'f-normal';

  return (
    <article className="w-full bg-black border-b border-white/[0.08] pb-2.5 select-none font-sans">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-full story-ring p-[1.5px]">
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
              <span className="text-[13px] font-semibold text-white tracking-tight">{post.authorUsername}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#007aff] fill-[#007aff]" />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
              Block #{post.blockNumber ?? '0'}
              <span>· Org1MSP</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onOpenLedger?.(post)}
          className="text-gray-500 hover:text-white p-1 active:scale-90 transition-transform"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* ── Media ── */}
      <div onClick={handleTap} className="relative w-full aspect-square bg-[#0a0a0a] overflow-hidden cursor-pointer">
        <img
          src={post.mediaUrl}
          alt="post media"
          className={`w-full h-full object-cover ${filterClass}`}
        />

        {/* Double-tap floating heart with spring burst */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-28 h-28 text-white fill-white drop-shadow-[0_0_28px_rgba(255,45,85,0.95)] animate-heart-burst" />
          </div>
        )}

        {/* Filter badge */}
        {post.filterName && post.filterName !== 'Normal' && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono text-gray-300 border border-white/10 pointer-events-none">
            {post.filterName}
          </div>
        )}
      </div>

      {/* ── Tamper-proof ribbon & Perceptual Proof ── */}
      <div className="px-3.5 pt-2">
        <button
          onClick={() => setShowReceipt(r => !r)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-[12px] bg-[#141416] border border-white/[0.08] hover:border-[#007aff]/40 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34c759]" />
            <span className="text-gray-400">SHA-256:</span>
            <span className="text-[#007aff] font-semibold">{shortHash(post.contentHash, 6, 6)}</span>
            {post.perceptualHash && (
              <>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400 flex items-center gap-0.5">
                  <Eye className="w-3 h-3 text-purple-400" /> {shortHash(post.perceptualHash, 4, 4)}
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] text-gray-500 flex items-center gap-0.5 hover:text-[#007aff]">
            Ledger Proof <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </button>

        {/* Expanded Dual-Proof Receipt */}
        {showReceipt && (
          <div className="mt-2 p-3 rounded-[16px] bg-[#18181a] border border-white/10 text-[11px] font-mono space-y-2 animate-fade-in shadow-xl">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-xs font-sans font-bold text-white">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#34c759]" /> Immutable Ledger Receipt
              </span>
              <span className="text-[10px] font-mono text-[#34c759] font-normal">COMMITTED</span>
            </div>

            {/* SHA-256 */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>Cryptographic SHA-256:</span>
                <button onClick={copySha} className="text-[#007aff] hover:underline flex items-center gap-0.5">
                  {copiedSha ? <Check className="w-3 h-3 text-[#34c759]" /> : <Copy className="w-3 h-3" />}
                  {copiedSha ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-[#34c759] break-all bg-black/40 p-1.5 rounded-[8px] border border-white/5 text-[10px]">
                {post.contentHash}
              </div>
            </div>

            {/* Perceptual Hash */}
            {post.perceptualHash && (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-purple-400" /> Perceptual Visual Hash (dHash):
                  </span>
                  <button onClick={copyPHash} className="text-[#007aff] hover:underline flex items-center gap-0.5">
                    {copiedPHash ? <Check className="w-3 h-3 text-[#34c759]" /> : <Copy className="w-3 h-3" />}
                    {copiedPHash ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="text-purple-300 break-all bg-black/40 p-1.5 rounded-[8px] border border-white/5 text-[10px]">
                  0x{post.perceptualHash}
                </div>
              </div>
            )}

            <div className="flex justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5">
              <span>Channel: mychannel</span>
              <span>Peer: Org1MSP (peer0.org1)</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between px-3.5 pt-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLikeToggle(post.id)}
            className="active:scale-125 transition-transform"
            aria-label="Like"
          >
            <Heart
              className={`w-6 h-6 stroke-[1.8] transition-colors ${
                post.isLikedByViewer ? 'fill-[#ff3b30] text-[#ff3b30]' : 'text-white'
              }`}
            />
          </button>
          <button
            onClick={() => onOpenComments?.(post)}
            className="hover:text-gray-300 active:scale-95 transition-transform"
            aria-label="Comment"
          >
            <MessageCircle className="w-6 h-6 stroke-[1.8] -rotate-90" />
          </button>
          <button
            onClick={() => onOpenLedger?.(post)}
            className="hover:text-gray-300 active:scale-95 transition-transform"
            aria-label="Share"
          >
            <Send className="w-6 h-6 stroke-[1.8] -rotate-12" />
          </button>
        </div>
        <button
          onClick={() => setSaved(s => !s)}
          className="active:scale-90 transition-transform"
          aria-label="Save"
        >
          <Bookmark className={`w-6 h-6 stroke-[1.8] ${saved ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* ── Metadata & Caption ── */}
      <div className="px-3.5 pt-1.5 space-y-0.5">
        <p className="text-[13px] font-semibold text-white">
          {post.likeCount?.toLocaleString() ?? 0} likes
        </p>
        <p className="text-[13px] leading-relaxed">
          <span className="font-semibold text-white mr-1.5 cursor-pointer hover:underline">
            {post.authorUsername}
          </span>
          <span className="text-gray-200">{post.caption}</span>
        </p>
        {post.commentCount > 0 && (
          <button
            onClick={() => onOpenComments?.(post)}
            className="text-[13px] text-gray-400 hover:text-gray-300"
          >
            View all {post.commentCount} comments
          </button>
        )}
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium pt-0.5">
          {relativeTime(post.timestamp)} · Committed to Ledger
        </p>
      </div>
    </article>
  );
}
