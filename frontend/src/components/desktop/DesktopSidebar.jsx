import React from 'react';
import {
  Home, Search, PlusSquare, Heart,
  User, ShieldCheck, Database, CheckCircle2,
  Sparkles, Layers, Box
} from 'lucide-react';

export default function DesktopSidebar({
  activeTab,
  setActiveTab,
  currentUser,
  users = [],
  onSwitchUser,
  onOpenUpload,
  onOpenLedger,
  blockCount = 108
}) {
  return (
    <aside className="w-[270px] h-full bg-[#FFFFFF] border-r border-[#E5E5E5] flex flex-col justify-between p-5 select-none flex-shrink-0 font-sans shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      {/* ── Top Section: Workspace Brand & Navigation ── */}
      <div className="space-y-6">
        {/* Workspace Wordmark Logo */}
        <div className="px-2 pt-1">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setActiveTab('feed')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Box className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-[#262626]">
                  InstaLedger
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-50 text-[#00BA88] border border-emerald-200">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-[#737373] font-mono">Hyperledger Fabric Workspace</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {/* Home Feed */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
              activeTab === 'feed'
                ? 'font-bold text-[#262626] bg-[#F4F4F5] shadow-2xs'
                : 'font-medium text-[#737373] hover:text-[#262626] hover:bg-[#FAFAFA]'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'feed' ? 'stroke-[2.5] text-[#262626]' : 'stroke-[1.8]'}`} />
            <span>Feed Workspace</span>
          </button>

          {/* Explore Assets */}
          <button
            onClick={() => setActiveTab('explore')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
              activeTab === 'explore'
                ? 'font-bold text-[#262626] bg-[#F4F4F5] shadow-2xs'
                : 'font-medium text-[#737373] hover:text-[#262626] hover:bg-[#FAFAFA]'
            }`}
          >
            <Search className={`w-5 h-5 ${activeTab === 'explore' ? 'stroke-[2.5] text-[#262626]' : 'stroke-[1.8]'}`} />
            <span>Explore Assets</span>
          </button>

          {/* Create Post */}
          <button
            onClick={onOpenUpload}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#0095F6] hover:bg-blue-50/80 transition-all group"
          >
            <div className="w-5 h-5 rounded-md bg-[#0095F6] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
              <PlusSquare className="w-3.5 h-3.5" />
            </div>
            <span>Create New Post</span>
          </button>

          {/* Activity / Endorsements */}
          <button
            onClick={() => setActiveTab('activity')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
              activeTab === 'activity'
                ? 'font-bold text-[#262626] bg-[#F4F4F5] shadow-2xs'
                : 'font-medium text-[#737373] hover:text-[#262626] hover:bg-[#FAFAFA]'
            }`}
          >
            <Heart className={`w-5 h-5 ${activeTab === 'activity' ? 'stroke-[2.5] text-[#262626]' : 'stroke-[1.8]'}`} />
            <span>Endorsements</span>
          </button>

          {/* Ledger Explorer */}
          <button
            onClick={onOpenLedger}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#737373] hover:text-[#262626] hover:bg-[#FAFAFA] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <Database className="w-5 h-5 text-[#0095F6] stroke-[1.8]" />
              <span>Ledger Explorer</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#0095F6] font-bold border border-blue-200">
              #{blockCount}
            </span>
          </button>

          {/* User Profile */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
              activeTab === 'profile'
                ? 'font-bold text-[#262626] bg-[#F4F4F5] shadow-2xs'
                : 'font-medium text-[#737373] hover:text-[#262626] hover:bg-[#FAFAFA]'
            }`}
          >
            {currentUser ? (
              <div className={`w-5 h-5 rounded-full overflow-hidden ${activeTab === 'profile' ? 'ring-2 ring-[#262626]' : ''}`}>
                <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-full h-full object-cover" />
              </div>
            ) : (
              <User className="w-5 h-5 stroke-[1.8]" />
            )}
            <span>My Profile</span>
          </button>
        </nav>

        {/* Hyperledger Fabric Network Status Card */}
        <div className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#EAEAEA] space-y-2 text-left">
          <div className="flex items-center justify-between text-xs font-bold text-[#262626]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00BA88]" /> Channel Status
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-[#00BA88] font-bold border border-emerald-200">
              ONLINE
            </span>
          </div>
          <p className="text-[11px] text-[#737373] leading-relaxed">
            Channel <strong className="text-[#262626]">mychannel</strong> · Raft Consensus. Every post is hashed via SHA-256 and perceptual dHash.
          </p>
        </div>
      </div>

      {/* ── Bottom Section: Active User & Switcher ── */}
      <div className="pt-3 border-t border-[#EAEAEA] space-y-2">
        <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-wider px-1">
          Switch Identity
        </span>

        <div className="space-y-1">
          {users.slice(0, 4).map(u => {
            const isActive = u.id === currentUser?.id;
            return (
              <button
                key={u.id}
                onClick={() => onSwitchUser?.(u)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                  isActive ? 'bg-[#F4F4F5] border border-[#E5E5E5]' : 'hover:bg-[#FAFAFA]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img src={u.avatarUrl} alt={u.username} className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-[#E5E5E5]" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#262626] truncate block flex items-center gap-1">
                      @{u.username}
                      {isActive && <CheckCircle2 className="w-3 h-3 text-[#0095F6] fill-[#0095F6]" />}
                    </span>
                    <span className="text-[10px] text-[#737373] truncate block">{u.displayName}</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-[#00BA88] font-bold">Org1MSP</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
