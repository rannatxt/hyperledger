import React from 'react';
import {
  ShieldCheck, Lock, CheckCircle2, Database,
  ArrowRight, Video, Eye, Sparkles, ExternalLink
} from 'lucide-react';
import { shortHash } from '../../utils/crypto';

export default function DesktopInspectorPane({
  currentUser,
  users = [],
  posts = [],
  onSelectPost,
  onOpenLedger,
  onSwitchUser
}) {
  const suggestedUsers = users.filter(u => u.id !== currentUser?.id).slice(0, 3);
  const recentPosts = posts.slice(0, 4);

  return (
    <aside className="w-80 h-full bg-white border-l border-[#EFEFEF] p-4 flex flex-col gap-4 overflow-y-auto no-scrollbar select-none flex-shrink-0 shadow-[-1px_0_4px_rgba(0,0,0,0.02)]">
      {/* ── Active Profile Widget ── */}
      {currentUser && (
        <div className="p-4 rounded-2xl bg-[#F8F8F8] border border-[#EAEAEA] space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.username}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#E60023]/30"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-[#111111] truncate">{currentUser.displayName}</span>
                <CheckCircle2 className="w-4 h-4 text-[#E60023] fill-[#E60023] flex-shrink-0" />
              </div>
              <div className="text-xs text-[#767676] font-mono truncate">@{currentUser.username}</div>
              <div className="text-[10px] text-[#27ae60] font-mono flex items-center gap-1 mt-0.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#27ae60]" /> Org1MSP Endorser
              </div>
            </div>
          </div>

          {currentUser.bio && (
            <p className="text-xs text-[#444444] leading-snug line-clamp-2">
              {currentUser.bio}
            </p>
          )}

          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#E5E5E5] text-center">
            <div className="p-1.5 rounded-xl bg-white border border-[#EAEAEA]">
              <span className="block text-xs font-bold text-[#111111] font-mono">{posts.filter(p => p.authorId === currentUser.id).length}</span>
              <span className="text-[9px] text-[#767676] uppercase tracking-wider font-semibold">Pins</span>
            </div>
            <div className="p-1.5 rounded-xl bg-white border border-[#EAEAEA]">
              <span className="block text-xs font-bold text-[#111111] font-mono">{currentUser.followerCount ?? 3}</span>
              <span className="text-[9px] text-[#767676] uppercase tracking-wider font-semibold">Followers</span>
            </div>
            <div className="p-1.5 rounded-xl bg-white border border-[#EAEAEA]">
              <span className="block text-xs font-bold text-[#111111] font-mono">{currentUser.followingCount ?? 2}</span>
              <span className="text-[9px] text-[#767676] uppercase tracking-wider font-semibold">Following</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Tamper-Proof Security Status ── */}
      <div className="p-4 rounded-2xl bg-[#FFF8F8] border border-[#FFDADA] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#111111]">
            <ShieldCheck className="w-4 h-4 text-[#E60023]" /> Tamper-Proof Integrity
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-mono font-bold">
            100% Active
          </span>
        </div>

        <p className="text-xs text-[#555555] leading-relaxed">
          Perceptual fingerprinting & temporal frame sampling block duplicates, crops, and reversed re-uploads across all accounts.
        </p>

        <div className="space-y-1.5 text-[10px] font-mono">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#EAEAEA]">
            <span className="text-[#767676] flex items-center gap-1">
              <Eye className="w-3 h-3 text-[#E60023]" /> Image pHash Guard:
            </span>
            <span className="text-[#111111] font-bold">Crop & Flip Resilient</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#EAEAEA]">
            <span className="text-[#767676] flex items-center gap-1">
              <Video className="w-3 h-3 text-[#E60023]" /> Video Frame Hashes:
            </span>
            <span className="text-[#111111] font-bold">Trim & Frame Lockout</span>
          </div>
        </div>
      </div>

      {/* ── Recent Blockchain Blocks ── */}
      <div className="p-4 rounded-2xl bg-[#F8F8F8] border border-[#EAEAEA] space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#E60023]" /> Recent Pins on Ledger
          </span>
          <button onClick={onOpenLedger} className="text-[10px] text-[#E60023] hover:underline font-bold">
            All Blocks →
          </button>
        </div>

        <div className="space-y-2">
          {recentPosts.map(p => (
            <div
              key={p.id}
              onClick={() => onSelectPost?.(p)}
              className="p-2 rounded-xl bg-white hover:bg-[#F0F0F0] border border-[#EAEAEA] cursor-pointer transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={p.thumbnailUrl || p.mediaUrl}
                  alt={p.caption}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#111111] truncate block">{p.authorUsername}</span>
                  <span className="text-[10px] text-[#767676] truncate block">{p.caption || 'Media post'}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#E60023] font-bold">#{p.blockNumber ?? '0'}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
