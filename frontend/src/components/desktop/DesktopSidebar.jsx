import React from 'react';
import {
  Home, Compass, PlusSquare, Database, Heart,
  User, ShieldCheck, ChevronDown, Video, Image,
  Server, Cpu, Layers
} from 'lucide-react';

export default function DesktopSidebar({
  activeTab,
  setActiveTab,
  currentUser,
  users,
  onSwitchUser,
  onOpenUpload,
  onOpenLedger,
  unreadCount = 2,
  blockCount = 4
}) {
  return (
    <aside className="w-64 h-full bg-[#111113]/95 border-r border-white/[0.08] flex flex-col justify-between p-4 select-none flex-shrink-0">
      {/* ── Top Section: Logo & Nav ── */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div
          onClick={() => setActiveTab('feed')}
          className="cursor-pointer flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-10 h-10 rounded-[14px] story-ring p-[2px] flex items-center justify-center shadow-lg shadow-pink-500/20">
            <div className="w-full h-full bg-black rounded-[12px] flex items-center justify-center">
              <span className="font-black text-xl tracking-tighter">⛓️</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg text-white font-serif tracking-tight">Insta<span className="text-[#007aff]">Ledger</span></span>
            </div>
            <span className="text-[10px] font-semibold text-[#007aff] flex items-center gap-1 uppercase tracking-wider font-mono">
              <ShieldCheck className="w-3 h-3" /> Fabric Channel
            </span>
          </div>
        </div>

        {/* Primary Action Button: Create Post / Video */}
        <button
          onClick={onOpenUpload}
          className="w-full py-2.5 px-4 rounded-[14px] bg-gradient-to-r from-[#007aff] to-[#5856d6] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <PlusSquare className="w-4 h-4 stroke-[2.2]" />
          <span>New Post / Video</span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('feed')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] text-xs font-semibold transition-all ${
              activeTab === 'feed'
                ? 'bg-[#007aff]/15 text-[#007aff] border border-[#007aff]/30 shadow-sm'
                : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Home className={`w-4 h-4 ${activeTab === 'feed' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span>Feed</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-mono text-gray-400">Live</span>
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-xs font-semibold transition-all ${
              activeTab === 'explore'
                ? 'bg-[#007aff]/15 text-[#007aff] border border-[#007aff]/30 shadow-sm'
                : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <Compass className={`w-4 h-4 ${activeTab === 'explore' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span>Explore Grid</span>
          </button>

          <button
            onClick={onOpenLedger}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] text-xs font-semibold transition-all ${
              activeTab === 'ledger'
                ? 'bg-[#007aff]/15 text-[#007aff] border border-[#007aff]/30 shadow-sm'
                : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-[#007aff] stroke-[2.2]" />
              <span>Blockchain Inspector</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#007aff]/20 text-[#007aff] font-mono font-bold">
              #{blockCount}
            </span>
          </button>

          <button
            onClick={onOpenLedger}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] text-xs font-semibold text-gray-300 hover:bg-white/[0.05] hover:text-white transition-all"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 stroke-2" />
              <span>Activity & Consensus</span>
            </div>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#ff3b30] ring-2 ring-black" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-xs font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-[#007aff]/15 text-[#007aff] border border-[#007aff]/30 shadow-sm'
                : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="w-4 h-4 rounded-full overflow-hidden border border-[#007aff]/40">
              <img
                src={currentUser?.avatarUrl}
                alt={currentUser?.username}
                className="w-full h-full object-cover"
              />
            </div>
            <span>My Profile</span>
          </button>
        </nav>

        {/* ── Network Specs Card ── */}
        <div className="p-3 rounded-[16px] bg-black/50 border border-white/[0.07] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-300">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#34c759]" /> Fabric Peer
            </span>
            <span className="text-[10px] font-mono text-[#34c759]">Online</span>
          </div>
          <div className="space-y-1 text-[10px] font-mono text-gray-400">
            <div className="flex justify-between">
              <span>Channel:</span>
              <span className="text-gray-200">mychannel</span>
            </div>
            <div className="flex justify-between">
              <span>Consensus:</span>
              <span className="text-gray-200">Raft 3-Node</span>
            </div>
            <div className="flex justify-between">
              <span>MSP Org:</span>
              <span className="text-gray-200">Org1MSP</span>
            </div>
            <div className="flex justify-between">
              <span>Blocks Mined:</span>
              <span className="text-[#007aff] font-bold">{blockCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Active MSP Identity Switcher ── */}
      <div className="pt-3 border-t border-white/[0.08] space-y-2">
        <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 px-1 block">
          Active Identity (MSP Client)
        </label>
        <div className="relative">
          <select
            value={currentUser?.id || ''}
            onChange={(e) => {
              const sel = users.find(u => u.id === e.target.value);
              if (sel) onSwitchUser(sel);
            }}
            className="w-full text-xs font-semibold px-3 py-2.5 rounded-[12px] bg-[#1c1c1e] border border-white/10 text-white appearance-none cursor-pointer focus:outline-none focus:border-[#007aff] transition-colors"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id} className="bg-[#1c1c1e] text-white">
                @{u.username} ({u.displayName})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3.5 pointer-events-none text-gray-400" />
        </div>
      </div>
    </aside>
  );
}
