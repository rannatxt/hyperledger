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
    <aside className="w-80 h-full bg-[#111113]/90 border-l border-white/[0.08] p-4 flex flex-col gap-4 overflow-y-auto no-scrollbar select-none flex-shrink-0">
      {/* ── Active Profile Widget ── */}
      {currentUser && (
        <div className="p-3.5 rounded-[20px] bg-[#1a1a1c] border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full story-ring p-[2px]">
              <div className="w-full h-full bg-black rounded-full p-[1.5px]">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white truncate">{currentUser.displayName}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#007aff] fill-[#007aff] flex-shrink-0" />
              </div>
              <div className="text-[11px] text-gray-400 font-mono truncate">@{currentUser.username}</div>
              <div className="text-[10px] text-[#34c759] font-mono flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" /> Org1MSP (Fabric Peer)
              </div>
            </div>
          </div>

          {currentUser.bio && (
            <p className="text-[11px] text-gray-300 leading-snug line-clamp-2">
              {currentUser.bio}
            </p>
          )}

          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/[0.08] text-center">
            <div className="p-1 rounded-lg bg-black/40">
              <span className="block text-xs font-bold text-white font-mono">{posts.filter(p => p.authorId === currentUser.id).length}</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Posts</span>
            </div>
            <div className="p-1 rounded-lg bg-black/40">
              <span className="block text-xs font-bold text-white font-mono">{currentUser.followerCount ?? 3}</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Followers</span>
            </div>
            <div className="p-1 rounded-lg bg-black/40">
              <span className="block text-xs font-bold text-white font-mono">{currentUser.followingCount ?? 2}</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Following</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Tamper-Proof Security Status ── */}
      <div className="p-3.5 rounded-[20px] bg-gradient-to-b from-[#131b2a] to-[#121214] border border-[#007aff]/30 space-y-2.5 shadow-lg shadow-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-[#007aff]" /> Tamper-Proof Security
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#34c759]/20 text-[#34c759] font-mono font-bold">
            100% Active
          </span>
        </div>

        <p className="text-[11px] text-gray-300 leading-relaxed">
          Multi-media perceptual fingerprinting prevents duplicates globally across all ledger accounts.
        </p>

        <div className="space-y-1.5 text-[10px] font-mono">
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/50 border border-white/5">
            <span className="text-gray-400 flex items-center gap-1">
              <Eye className="w-3 h-3 text-[#007aff]" /> Image pHash Guard:
            </span>
            <span className="text-white font-semibold">Crop & Flip Resilient</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/50 border border-white/5">
            <span className="text-gray-400 flex items-center gap-1">
              <Video className="w-3 h-3 text-[#ff2d55]" /> Video Frame Hashes:
            </span>
            <span className="text-white font-semibold">Trim & Re-encode Lockout</span>
          </div>
        </div>
      </div>

      {/* ── Live Ledger Stream ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1 uppercase tracking-wider">
            <Database className="w-3.5 h-3.5 text-[#007aff]" /> Live Blocks
          </span>
          <button
            onClick={onOpenLedger}
            className="text-[10px] text-[#007aff] hover:underline flex items-center gap-0.5"
          >
            Explore <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1.5">
          {recentPosts.map((post, idx) => (
            <div
              key={post.id}
              onClick={() => onSelectPost?.(post)}
              className="p-2.5 rounded-[14px] bg-[#1a1a1c] border border-white/[0.06] hover:border-[#007aff]/40 cursor-pointer transition-all space-y-1"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-bold text-[#007aff]">Block #{post.blockNumber ?? idx + 1}</span>
                <span className="text-[9px] text-gray-500 font-mono">{post.mediaType === 'video' ? 'VIDEO' : 'IMAGE'}</span>
              </div>
              <div className="text-[10px] font-mono text-gray-400 truncate">
                CID: {shortHash(post.contentHash, 6, 6)}
              </div>
              <div className="flex items-center justify-between text-[9px] text-gray-500 pt-0.5">
                <span>@{post.authorUsername}</span>
                <span>Org1MSP Endorsed</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Suggested Peers to Follow ── */}
      {suggestedUsers.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/[0.08]">
          <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wider px-1">
            Network Creators
          </div>
          <div className="space-y-2">
            {suggestedUsers.map(u => (
              <div
                key={u.id}
                className="flex items-center justify-between p-2 rounded-[14px] bg-[#1a1a1c] border border-white/[0.06]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">@{u.username}</span>
                    <span className="block text-[10px] text-gray-400 truncate">{u.displayName}</span>
                  </div>
                </div>
                <button
                  onClick={() => onSwitchUser(u)}
                  className="px-2.5 py-1 rounded-lg bg-[#007aff]/15 hover:bg-[#007aff]/25 text-[#007aff] text-[10px] font-semibold transition-colors"
                >
                  Switch
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
