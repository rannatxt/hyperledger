import React from 'react';
import {
  Home, Search, Compass, PlusSquare, Heart,
  User, ShieldCheck, Database, CheckCircle2, ChevronDown
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
    <aside className="w-64 h-full bg-white border-r border-[#DBDBDB] flex flex-col justify-between p-4 select-none flex-shrink-0 font-sans">
      {/* ── Top Section: Instagram Brand & Navigation ── */}
      <div className="space-y-6">
        {/* Instagram Wordmark Logo */}
        <div className="px-3 pt-2">
          <div className="flex items-baseline gap-1.5 cursor-pointer" onClick={() => setActiveTab('feed')}>
            <span className="text-2xl font-bold tracking-tight text-[#262626] font-serif italic">
              Instagram
            </span>
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#EFEFEF] text-[#737373] border border-[#DBDBDB]/60">
              Ledger
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {/* Home */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors ${
              activeTab === 'feed'
                ? 'font-bold text-[#262626] bg-[#FAFAFA]'
                : 'font-normal text-[#262626] hover:bg-[#FAFAFA]'
            }`}
          >
            <Home className={`w-6 h-6 ${activeTab === 'feed' ? 'stroke-[2.5] fill-[#262626]' : 'stroke-[1.8]'}`} />
            <span>Home</span>
          </button>

          {/* Search / Explore */}
          <button
            onClick={() => setActiveTab('explore')}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors ${
              activeTab === 'explore'
                ? 'font-bold text-[#262626] bg-[#FAFAFA]'
                : 'font-normal text-[#262626] hover:bg-[#FAFAFA]'
            }`}
          >
            <Search className={`w-6 h-6 ${activeTab === 'explore' ? 'stroke-[2.8]' : 'stroke-[1.8]'}`} />
            <span>Explore</span>
          </button>

          {/* Create Post */}
          <button
            onClick={onOpenUpload}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-lg text-sm font-normal text-[#262626] hover:bg-[#FAFAFA] transition-colors"
          >
            <PlusSquare className="w-6 h-6 stroke-[1.8]" />
            <span>Create</span>
          </button>

          {/* Notifications / Activity */}
          <button
            onClick={() => setActiveTab('activity')}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors ${
              activeTab === 'activity'
                ? 'font-bold text-[#262626] bg-[#FAFAFA]'
                : 'font-normal text-[#262626] hover:bg-[#FAFAFA]'
            }`}
          >
            <Heart className={`w-6 h-6 ${activeTab === 'activity' ? 'stroke-[2.5] fill-[#262626]' : 'stroke-[1.8]'}`} />
            <span>Notifications</span>
          </button>

          {/* Ledger Explorer */}
          <button
            onClick={onOpenLedger}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-normal text-[#262626] hover:bg-[#FAFAFA] transition-colors"
          >
            <div className="flex items-center gap-4">
              <Database className="w-6 h-6 text-[#0095F6] stroke-[1.8]" />
              <span>Ledger</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-50 text-[#0095F6] font-bold border border-blue-200">
              #{blockCount}
            </span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg text-sm transition-colors ${
              activeTab === 'profile'
                ? 'font-bold text-[#262626] bg-[#FAFAFA]'
                : 'font-normal text-[#262626] hover:bg-[#FAFAFA]'
            }`}
          >
            {currentUser ? (
              <div className={`w-6 h-6 rounded-full p-[1px] ${activeTab === 'profile' ? 'ring-2 ring-[#262626]' : ''}`}>
                <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-full h-full rounded-full object-cover" />
              </div>
            ) : (
              <User className="w-6 h-6 stroke-[1.8]" />
            )}
            <span>Profile</span>
          </button>
        </nav>

        {/* Hyperledger Fabric Status Card */}
        <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] space-y-1.5 text-left">
          <div className="flex items-center justify-between text-xs font-semibold text-[#262626]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00BA88]" /> Fabric Network
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-green-50 text-[#00BA88] font-bold border border-green-200">
              ONLINE
            </span>
          </div>
          <p className="text-[11px] text-[#737373] leading-snug">
            Channel <strong>mychannel</strong> · Raft Orderer. Posts persist locally in IndexedDB & on the ledger.
          </p>
        </div>
      </div>

      {/* ── Bottom Section: Active User & Switcher ── */}
      <div className="pt-3 border-t border-[#EFEFEF] space-y-2">
        <span className="text-[10px] font-bold text-[#8E8E8E] uppercase tracking-wider px-1">
          Switch Identity
        </span>

        <div className="space-y-1">
          {users.map(u => {
            const isActive = u.id === currentUser?.id;
            return (
              <button
                key={u.id}
                onClick={() => onSwitchUser?.(u)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                  isActive ? 'bg-[#FAFAFA] border border-[#E5E5E5]' : 'hover:bg-[#FAFAFA]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img src={u.avatarUrl} alt={u.username} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
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
