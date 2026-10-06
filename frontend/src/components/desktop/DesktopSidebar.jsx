import React from 'react';
import {
  Home, Compass, PlusCircle, Database, Heart,
  User, ShieldCheck, ChevronDown, CheckCircle2,
  Lock, Sparkles, Layers
} from 'lucide-react';

export default function DesktopSidebar({
  activeTab,
  setActiveTab,
  currentUser,
  users = [],
  onSwitchUser,
  onOpenUpload,
  onOpenLedger,
  blockCount = 4
}) {
  return (
    <aside className="w-64 h-full bg-white border-r border-[#EFEFEF] flex flex-col justify-between p-4 select-none flex-shrink-0 shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      {/* ── Top Section: Actions & Navigation ── */}
      <div className="space-y-5">
        {/* Primary Action Button: Create Pin / Post */}
        <button
          onClick={onOpenUpload}
          className="w-full py-3 px-5 rounded-full bg-[#E60023] hover:bg-[#AD081B] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Create Pin</span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('feed')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-bold transition-all ${
              activeTab === 'feed'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-[#111111] hover:bg-[#F0F0F0]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Home className="w-4 h-4 stroke-[2.5]" />
              <span>Home Feed</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              activeTab === 'feed' ? 'bg-white/20 text-white' : 'bg-[#EAEAEA] text-[#767676]'
            }`}>
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-bold transition-all ${
              activeTab === 'explore'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-[#111111] hover:bg-[#F0F0F0]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Compass className="w-4 h-4 stroke-[2.5]" />
              <span>Explore</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-[#111111] hover:bg-[#F0F0F0]'
            }`}
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 stroke-[2.5]" />
              <span>Your Profile</span>
            </div>
          </button>

          <button
            onClick={onOpenLedger}
            className="w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-bold text-[#111111] hover:bg-[#F0F0F0] transition-all"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-[#E60023] stroke-[2.5]" />
              <span>Ledger Blocks</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E60023]/10 text-[#E60023] font-mono font-bold">
              #{blockCount}
            </span>
          </button>
        </nav>

        {/* Blockchain Status Card */}
        <div className="p-3.5 rounded-2xl bg-[#F8F8F8] border border-[#EAEAEA] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#27ae60]" /> Fabric Network
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-green-100 text-green-700 font-bold">
              ONLINE
            </span>
          </div>
          <p className="text-[11px] text-[#767676] leading-relaxed">
            Channel <strong>mychannel</strong> with Raft orderer. All pins and hashes are permanently immutable.
          </p>
        </div>
      </div>

      {/* ── Bottom Section: Fabric Identity Switcher ── */}
      <div className="pt-3 border-t border-[#EFEFEF] space-y-2">
        <span className="text-[10px] font-bold text-[#767676] uppercase tracking-wider px-2">
          Switch Fabric Identity
        </span>

        <div className="space-y-1">
          {users.map(u => {
            const isActive = u.id === currentUser?.id;
            return (
              <button
                key={u.id}
                onClick={() => onSwitchUser?.(u)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-[#F0F0F0] ring-1 ring-black/10'
                    : 'hover:bg-[#F8F8F8]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={u.avatarUrl}
                    alt={u.username}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#111111] truncate block flex items-center gap-1">
                      @{u.username}
                      {isActive && <CheckCircle2 className="w-3 h-3 text-[#E60023] fill-[#E60023]" />}
                    </span>
                    <span className="text-[10px] text-[#767676] truncate block">{u.displayName}</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-[#27ae60] font-semibold">Org1MSP</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
