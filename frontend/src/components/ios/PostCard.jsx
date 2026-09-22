import { useState, useRef } from 'react';
import {
  Heart, MessageCircle, Send, Bookmark,
  MoreHorizontal, CheckCircle2, ShieldCheck,
  Copy, Check, Lock, ExternalLink
} from 'lucide-react';
import { shortHash, relativeTime } from '../../utils/crypto';

const FILTER_MAP = {
  Normal: 'f-normal', Clarendon: 'f-clarendon', Gingham: 'f-gingham',
  Moon: 'f-moon', Juno: 'f-juno', Noir: 'f-noir', Vivid: 'f-vivid',
};

export default function PostCard({ post, currentUser, onLikeToggle, onOpenComments, onOpenLedger }) {
  const [showHeart, setShowHeart]   = useState(false);
  const [saved, setSaved]           = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied]         = useState(false);
  const lastTap = useRef(0);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      setShowHeart(true);
      if (!post.isLikedByViewer) onLikeToggle(post.id);
      setTimeout(() => setShowHeart(false), 900);
    }
    lastTap.current = now;
  };

  const copyHash = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(post.contentHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filterClass = FILTER_MAP[post.filterName] || 'f-normal';

  return (
    <article className="w-full bg-black border-b border-white/[0.07] pb-2 select-none">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-full story-ring p-[1.5px]">
            <div className="w-full h-full bg-black rounded-full p-[1.5px]">
              <img src={post.authorAvatar} alt={post.authorUsername}
                className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold text-white">{post.authorUsername}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-ios-blue fill-ios-blue" />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-ios-gray1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Block #{post.blockNumber ?? '—'}
              <span>· Org1MSP</span>
            </div>
          </div>
        </div>
        <button onClick={() => onOpenLedger?.(post)} className="text-gray-500 hover:text-white p-1 active:scale-90 transition-transform">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* ── Media ── */}
      <div onClick={handleTap} className="relative w-full aspect-square bg-[#0a0a0a] overflow-hidden cursor-pointer">
        <img src={post.mediaUrl} alt="post media"
          className={`w-full h-full object-cover ${filterClass}`} />

        {/* Double-tap floating heart */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-28 h-28 text-white fill-white drop-shadow-[0_0_24px_rgba(255,45,85,0.9)] animate-heart-burst" />
          </div>
        )}

        {/* Filter badge */}
        {post.filterName && post.filterName !== 'Normal' && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono text-gray-300 border border-white/10 pointer-events-none">
            {post.filterName}
          </div>
        )}
      </div>

      {/* ── Tamper-proof ribbon ── */}
      <div className="px-3 pt-2">
        <button
          onClick={() => setShowReceipt(r => !r)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#111] border border-white/[0.07] hover:border-ios-blue/40 transition-all"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            <span className="text-gray-400">SHA-256:</span>
            <span className="text-ios-blue font-semibold">{shortHash(post.contentHash)}</span>
          </div>
          <span className="text-[10px] text-gray-500 flex items-center gap-0.5 hover:text-ios-blue">
            Tamper-Proof <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </button>

        {/* Expanded receipt */}
        {showReceipt && (
          <div className="mt-2 p-3 rounded-xl bg-[#181818] border border-white/10 text-[11px] font-mono space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between pb-1 border-b border-white/10 text-xs font-sans font-bold text-white">
              <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-green-400" /> Immutable Ledger Receipt</span>
              <button onClick={copyHash} className="text-ios-blue flex items-center gap-1 text-[10px] hover:underline">
                <Copy className="w-3 h-3" />{copied ? 'Copied!' : 'Copy Hash'}
              </button>
            </div>
            <div className="text-green-400 break-all">{post.contentHash}</div>
            <div className="flex justify-between text-gray-400">
              <span>Block: #{post.blockNumber}</span>
              <span className="text-gray-300">Tx: {post.txId?.slice(0,14)}...</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Channel: mychannel</span>
              <span className="text-ios-blue">COMMITTED</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between px-3 pt-2">
        <div className="flex items-center gap-4">
          <button onClick={() => onLikeToggle(post.id)} className="active:scale-125 transition-transform" aria-label="Like">
            <Heart className={`w-6 h-6 stroke-[1.8] transition-colors ${post.isLikedByViewer ? 'fill-ios-red text-ios-red' : 'text-white'}`} />
          </button>
          <button onClick={() => onOpenComments?.(post)} className="hover:text-gray-300 active:scale-95 transition-transform" aria-label="Comment">
            <MessageCircle className="w-6 h-6 stroke-[1.8] -rotate-90" />
          </button>
          <button onClick={() => onOpenLedger?.(post)} className="hover:text-gray-300 active:scale-95 transition-transform" aria-label="Share">
            <Send className="w-6 h-6 stroke-[1.8] -rotate-12" />
          </button>
        </div>
        <button onClick={() => setSaved(s => !s)} className="active:scale-90 transition-transform" aria-label="Save">
          <Bookmark className={`w-6 h-6 stroke-[1.8] ${saved ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* ── Meta ── */}
      <div className="px-3 pt-1.5 space-y-0.5">
        <p className="text-[13px] font-bold">{post.likeCount?.toLocaleString() ?? 0} likes</p>
        <p className="text-[13px] leading-relaxed">
          <span className="font-bold mr-1.5 cursor-pointer hover:underline">{post.authorUsername}</span>
          <span className="text-gray-200">{post.caption}</span>
        </p>
        {post.commentCount > 0 && (
          <button onClick={() => onOpenComments?.(post)} className="text-[13px] text-ios-gray1 hover:text-gray-300">
            View all {post.commentCount} comments
          </button>
        )}
        <p className="text-[10px] uppercase tracking-wider text-ios-gray2 font-medium pt-0.5">
          {relativeTime(post.timestamp)} · Committed to Ledger
        </p>
      </div>
    </article>
  );
}
