import React from 'react';
import { CheckCircle2, ShieldCheck, Database, X, ExternalLink, HardDrive, Film } from 'lucide-react';
import { shortHash } from '../../utils/crypto';

export default function PostAcceptedToast({ post, onClose, onInspectLedger }) {
  if (!post) return null;

  const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(post.mediaUrl || '');
  const thumb = post.thumbnailUrl || post.mediaUrl;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md animate-sheet-up font-sans select-none">
      <div className="bg-white/95 backdrop-blur-xl border-2 border-[#00BA88] rounded-2xl shadow-[0_12px_40px_rgba(0,186,136,0.25)] p-4 text-[#262626] relative overflow-hidden">
        {/* Glow Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00BA88] via-[#0095F6] to-[#00BA88]" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E6F9F3] text-[#00BA88] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 fill-[#00BA88] text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#262626] leading-tight flex items-center gap-1.5">
                <span>Post Accepted to Ledger</span>
                <span className="w-2 h-2 rounded-full bg-[#00BA88] animate-pulse" />
              </h3>
              <p className="text-[11px] text-[#00BA88] font-semibold">
                Immutable Block #{post.blockNumber ?? '0'} Created & Verified
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8E8E8E] hover:text-[#262626] hover:bg-[#F5F5F5] transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Metadata Card */}
        <div className="mt-3 p-2.5 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] flex items-center gap-3">
          {/* Thumbnail preview */}
          <div className="w-12 h-12 rounded-lg bg-black overflow-hidden flex-shrink-0 relative border border-[#DBDBDB]">
            <img
              src={thumb}
              alt="accepted post"
              className="w-full h-full object-cover"
            />
            {isVideo && (
              <div className="absolute top-1 right-1 text-white">
                <Film className="w-3 h-3 fill-white" />
              </div>
            )}
          </div>

          {/* Ledger Transaction Metadata */}
          <div className="flex-1 min-w-0 space-y-0.5 text-[11px]">
            <div className="flex items-center justify-between font-mono">
              <span className="text-[#737373]">SHA-256 (CID):</span>
              <span className="font-bold text-[#0095F6]">{shortHash(post.contentHash, 5, 5)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#737373]">
              <span>Channel:</span>
              <span className="font-mono font-semibold text-[#262626]">mychannel (Raft)</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#00BA88] font-semibold">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-[#00BA88]" /> Ledger State:
              </span>
              <span>Committed & Anchored</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => {
              onInspectLedger?.(post);
              onClose?.();
            }}
            className="flex-1 py-1.5 px-3 rounded-lg bg-[#0095F6] hover:bg-[#1877F2] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-98"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Inspect on Ledger</span>
          </button>

          <button
            onClick={onClose}
            className="py-1.5 px-3 rounded-lg bg-[#EFEFEF] hover:bg-[#DBDBDB] text-[#262626] text-xs font-semibold transition-colors active:scale-98"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
