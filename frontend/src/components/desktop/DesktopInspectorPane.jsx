import React from 'react';
import {
  ShieldCheck, Lock, CheckCircle2, Database,
  ArrowRight, Sparkles, ExternalLink
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
    <aside className="w-80 h-full bg-white border-l border-[#DBDBDB] p-4 flex flex-col gap-5 overflow-y-auto no-scrollbar select-none flex-shrink-0 font-sans">
      {/* ── Active Profile Widget ── */}
      {currentUser && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.username}
              className="w-12 h-12 rounded-full object-cover border border-[#DBDBDB]"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-[#262626] truncate">{currentUser.username}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] fill-[#0095F6] flex-shrink-0" />
              </div>
              <div className="text-xs text-[#737373] truncate">{currentUser.displayName}</div>
            </div>
          </div>
          <button
            onClick={() => onSwitchUser?.(suggestedUsers[0] || currentUser)}
            className="text-xs font-semibold text-[#0095F6] hover:text-[#1877F2]"
          >
            Switch
          </button>
        </div>
      )}

      {/* ── Suggested Fabric Peer Accounts ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-[#737373]">Suggested for you</span>
          <button onClick={onOpenLedger} className="text-[#262626] text-[11px] hover:underline">
            See All
          </button>
        </div>

        <div className="space-y-2.5">
          {suggestedUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#262626] truncate">@{u.username}</div>
                  <div className="text-[10px] text-[#8E8E8E] font-mono">Org1MSP · Peer</div>
                </div>
              </div>
              <button
                onClick={() => onSwitchUser?.(u)}
                className="text-xs font-bold text-[#0095F6] hover:text-[#1877F2]"
              >
                Switch
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tamper-Proof Ledger Security Status ── */}
      <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#262626]">
            <ShieldCheck className="w-4 h-4 text-[#00BA88]" /> Tamper-Proof Ledger
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-green-50 text-[#00BA88] font-mono font-bold border border-green-200">
            Active
          </span>
        </div>

        <p className="text-[11px] text-[#737373] leading-relaxed">
          Cryptographic SHA-256 + Perceptual dHash blocks duplicates across images & videos automatically.
        </p>

        <button
          onClick={onOpenLedger}
          className="w-full mt-1 pt-1.5 border-t border-[#EAEAEA] flex items-center justify-between text-xs font-semibold text-[#0095F6] hover:underline"
        >
          <span>View Fabric Blocks</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Footer ── */}
      <div className="text-[11px] text-[#A8A8A8] space-y-2 pt-2">
        <p>About · Help · Press · API · Jobs · Privacy · Terms · Fabric Ledger · Locations</p>
        <p className="font-semibold uppercase text-[10px]">© 2026 INSTALEDGER FROM HYPERLEDGER</p>
      </div>
    </aside>
  );
}
