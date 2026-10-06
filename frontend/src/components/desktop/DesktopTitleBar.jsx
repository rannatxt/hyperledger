import React from 'react';
import {
  ShieldCheck, RefreshCw, Smartphone, Monitor,
  Search, PlusSquare
} from 'lucide-react';

export default function DesktopTitleBar({
  channelName = 'mychannel',
  blockHeight = 4,
  currentUser,
  onRefresh,
  loadingFeed,
  viewMode,
  setViewMode,
  onOpenLedger,
  searchQuery,
  setSearchQuery,
  onOpenUpload
}) {
  const isDesktop = viewMode === 'desktop-ios' || viewMode === 'desktop';

  return (
    <header className="h-14 w-full bg-white border-b border-[#DBDBDB] flex items-center justify-between px-4 md:px-6 select-none z-30 flex-shrink-0 font-sans">
      {/* ── Left: Brand & Fabric status ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-1.5 cursor-pointer" onClick={() => window.location.reload()}>
          <span className="text-xl font-bold tracking-tight text-[#262626] font-serif italic">
            Instagram
          </span>
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#EFEFEF] text-[#737373] border border-[#DBDBDB]/60">
            Ledger
          </span>
        </div>

        <button
          onClick={onOpenLedger}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAFAFA] hover:bg-[#EFEFEF] border border-[#E5E5E5] text-[11px] font-mono text-[#737373] transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00BA88] animate-pulse" />
          <span>{channelName}</span>
          <span className="text-[#8E8E8E]">·</span>
          <span>Block #{blockHeight}</span>
        </button>
      </div>

      {/* ── Center: Search Bar ── */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EFEFEF] text-[#262626] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#DBDBDB] border border-transparent transition-all">
          <Search className="w-4 h-4 text-[#8E8E8E] flex-shrink-0" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            placeholder="Search tags, authors, or multihashes…"
            className="w-full bg-transparent border-none outline-none text-xs text-[#262626] placeholder:text-[#8E8E8E]"
          />
        </div>
      </div>

      {/* ── Right: Action Buttons & Layout Toggle ── */}
      <div className="flex items-center gap-2">
        {/* Sync Button */}
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg text-[#262626] hover:bg-[#FAFAFA] transition-colors flex items-center gap-1 text-xs"
          title="Synchronize feed"
        >
          <RefreshCw className={`w-4 h-4 ${loadingFeed ? 'animate-spin text-[#0095F6]' : 'text-[#262626]'}`} />
          <span className="hidden sm:inline font-medium">Sync</span>
        </button>

        {/* Create Post */}
        <button
          onClick={onOpenUpload}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0095F6] hover:bg-[#1877F2] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <PlusSquare className="w-4 h-4" />
          <span>Create Post</span>
        </button>

        {/* View Mode Switcher: Desktop vs iPhone Frame */}
        <button
          onClick={() => setViewMode(isDesktop ? 'mobile-ios' : 'desktop-ios')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#EFEFEF] text-xs font-semibold text-[#262626] border border-[#DBDBDB] transition-all active:scale-95 ml-1"
          title={isDesktop ? 'Switch to iPhone 16 Pro Frame' : 'Switch to iOS Desktop View'}
        >
          {isDesktop ? (
            <>
              <Smartphone className="w-3.5 h-3.5 text-[#0095F6]" />
              <span className="hidden sm:inline">iPhone View</span>
            </>
          ) : (
            <>
              <Monitor className="w-3.5 h-3.5 text-[#0095F6]" />
              <span className="hidden sm:inline">Desktop View</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
