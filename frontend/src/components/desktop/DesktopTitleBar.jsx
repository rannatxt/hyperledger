import React from 'react';
import {
  ShieldCheck, RefreshCw, Layers, Monitor,
  Maximize2, Minimize2, Circle, CheckCircle2
} from 'lucide-react';

export default function DesktopTitleBar({
  channelName = 'mychannel',
  blockHeight = 4,
  currentUser,
  onRefresh,
  loadingFeed,
  viewMode,
  setViewMode,
  onOpenLedger
}) {
  return (
    <header className="h-11 w-full bg-[#161618]/90 border-b border-white/[0.08] backdrop-blur-xl flex items-center justify-between px-4 select-none z-30 flex-shrink-0">
      {/* ── macOS Traffic Lights ── */}
      <div className="flex items-center gap-2 group">
        <button
          title="Close / Reset Window"
          onClick={() => window.location.reload()}
          className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 active:brightness-90 flex items-center justify-center text-[8px] text-black font-bold opacity-90 transition-all shadow-sm"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
        </button>
        <button
          title={viewMode === 'desktop' ? 'Switch to Compact iPad View' : 'Switch to Desktop Split View'}
          onClick={() => setViewMode(viewMode === 'desktop' ? 'compact' : 'desktop')}
          className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 active:brightness-90 flex items-center justify-center text-[8px] text-black font-bold opacity-90 transition-all shadow-sm"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">−</span>
        </button>
        <button
          title="Toggle Fullscreen / Maximize"
          onClick={() => setViewMode(viewMode === 'desktop' ? 'compact' : 'desktop')}
          className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 active:brightness-90 flex items-center justify-center text-[8px] text-black font-bold opacity-90 transition-all shadow-sm"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">+</span>
        </button>

        <span className="ml-3 text-[11px] font-semibold text-gray-400 hidden sm:inline-flex items-center gap-1.5 font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
          Hyperledger Fabric v2.5
        </span>
      </div>

      {/* ── Center Window Title & Channel Badge ── */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={onOpenLedger}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
          <span className="text-xs font-bold text-white tracking-tight font-serif">Insta<span className="text-[#007aff]">Ledger</span></span>
          <span className="text-gray-500 text-[10px]">·</span>
          <span className="text-[11px] font-mono font-medium text-gray-300">channel: <strong className="text-white">{channelName}</strong></span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#007aff]/20 text-[#007aff] font-mono font-semibold">Peer0.Org1MSP</span>
        </div>
      </div>

      {/* ── Right Window Actions ── */}
      <div className="flex items-center gap-2.5">
        {/* Layout Mode Toggle */}
        <button
          onClick={() => setViewMode(viewMode === 'desktop' ? 'compact' : 'desktop')}
          className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 text-[11px] font-medium border border-white/[0.08] transition-colors"
          title="Switch view layout"
        >
          {viewMode === 'desktop' ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-[#007aff]" />
              <span>Desktop Split</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-[#007aff]" />
              <span>iPad View</span>
            </>
          )}
        </button>

        {/* Sync Button */}
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#007aff]/15 hover:bg-[#007aff]/25 text-[#007aff] text-[11px] font-semibold transition-colors border border-[#007aff]/30"
        >
          <RefreshCw className={`w-3 h-3 ${loadingFeed ? 'animate-spin' : ''}`} />
          <span>Sync</span>
        </button>

        {/* Active MSP Identity Pill */}
        {currentUser && (
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-white/[0.1]">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.username}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-[#007aff]/40"
            />
            <span className="text-[11px] font-semibold text-gray-200">@{currentUser.username}</span>
          </div>
        )}
      </div>
    </header>
  );
}
