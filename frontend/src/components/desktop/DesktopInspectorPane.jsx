import React from 'react';
import {
  ShieldCheck, Lock, CheckCircle2, Database,
  ArrowRight, Sparkles, ExternalLink, Cpu, Activity,
  Server, Globe, Layers, Users
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
  const suggestedUsers = users.filter(u => u.id !== currentUser?.id).slice(0, 4);

  return (
    <aside className="w-[330px] h-full bg-[#FFFFFF] border-l border-[#E5E5E5] p-5 flex flex-col gap-5 overflow-y-auto no-scrollbar select-none flex-shrink-0 font-sans shadow-[-1px_0_4px_rgba(0,0,0,0.02)]">
      {/* ── Active Profile Widget ── */}
      {currentUser && (
        <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full ig-story-ring p-[2px] flex-shrink-0">
              <div className="w-full h-full bg-white rounded-full p-[1px]">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[#262626] truncate">{currentUser.username}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-[#0095F6] flex-shrink-0" />
              </div>
              <div className="text-[11px] text-[#737373] truncate">{currentUser.displayName}</div>
            </div>
          </div>
          <button
            onClick={() => onSwitchUser?.(suggestedUsers[0] || currentUser)}
            className="text-xs font-bold text-[#0095F6] hover:text-[#1877F2] px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
          >
            Switch
          </button>
        </div>
      )}

      {/* ── 1. ACTIVE LEDGER CONSENSUS STATUS (Photo 5 Workspace) ── */}
      <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#00BA88] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-[#262626]">Consensus Engine</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-[#166534] font-mono font-bold border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00BA88] animate-pulse" />
            Raft Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center font-mono">
          <div className="p-2 rounded-xl bg-white border border-[#EAEAEA]">
            <p className="text-[9px] uppercase font-bold text-[#8E8E8E]">Block Height</p>
            <p className="text-xs font-bold text-[#262626]">#{posts.length + 104}</p>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#EAEAEA]">
            <p className="text-[9px] uppercase font-bold text-[#8E8E8E]">Endorsements</p>
            <p className="text-xs font-bold text-[#0095F6]">Org1MSP (100%)</p>
          </div>
        </div>

        <div className="text-[10px] text-[#737373] flex items-center justify-between font-mono pt-1 border-t border-[#EAEAEA]">
          <span>Protocol: Raft Orderer TLS</span>
          <span className="text-[#00BA88] font-bold">12ms Block Time</span>
        </div>
      </div>

      {/* ── 2. FABRIC CHANNEL INDICATORS (mychannel) ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F0F8FF] to-[#FFFFFF] border border-[#D0E7FF] space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#0095F6]/15 text-[#0095F6] flex items-center justify-center">
              <Server className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-[#0F172A]">Fabric Channel</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-[#0095F6] text-white font-mono text-[10px] font-bold">
            mychannel
          </span>
        </div>

        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex items-center justify-between text-[#475569]">
            <span>Channel ID:</span>
            <span className="font-bold text-[#0F172A]">mychannel</span>
          </div>
          <div className="flex items-center justify-between text-[#475569]">
            <span>Chaincode:</span>
            <span className="font-bold text-[#0095F6]">instaledger:v1.0</span>
          </div>
          <div className="flex items-center justify-between text-[#475569]">
            <span>Ledger State:</span>
            <span className="text-[#00BA88] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Immutable Sync
            </span>
          </div>
        </div>

        <button
          onClick={onOpenLedger}
          className="w-full mt-1 pt-2 border-t border-[#D0E7FF] flex items-center justify-between text-xs font-bold text-[#0095F6] hover:text-[#1877F2] transition-colors"
        >
          <span>Open Ledger Explorer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── 3. SUGGESTED ACCOUNTS (Photo 5 Workspace) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#737373]">Suggested Peer Accounts</span>
          <button onClick={onOpenLedger} className="text-[#0095F6] text-[11px] hover:underline">
            See All
          </button>
        </div>

        <div className="space-y-2.5">
          {suggestedUsers.map(u => (
            <div key={u.id} className="p-2.5 rounded-xl bg-white hover:bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-between transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#262626] truncate flex items-center gap-1">
                    <span>@{u.username}</span>
                    <CheckCircle2 className="w-3 h-3 text-[#0095F6] fill-[#0095F6]" />
                  </div>
                  <div className="text-[10px] text-[#8E8E8E] font-mono truncate">
                    {u.displayName || 'Org1MSP Peer'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onSwitchUser?.(u)}
                className="text-xs font-bold text-[#0095F6] hover:text-[#1877F2] px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                Switch
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tamper-Proof Guarantee Footer Card ── */}
      <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#262626]">
          <Lock className="w-3.5 h-3.5 text-[#00BA88]" />
          <span>Cryptographic Security</span>
        </div>
        <p className="text-[11px] text-[#737373] leading-relaxed">
          Decentralized perceptual hashing (dHash) blocks media cropping, flipping, and trimming attacks prior to block endorsement.
        </p>
      </div>

      {/* ── Workspace Metadata Footer ── */}
      <div className="text-[10px] text-[#A8A8A8] space-y-1.5 pt-1">
        <p>Channel mychannel · Raft Orderer · Fabric 2.5 LTS</p>
        <p className="font-semibold uppercase tracking-wider text-[9px] text-[#8E8E8E]">
          © 2026 INSTALEDGER WORKSPACE
        </p>
      </div>
    </aside>
  );
}
