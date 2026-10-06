import React from 'react';
import {
  ShieldCheck, RefreshCw, Layers, Monitor,
  Search, CheckCircle2
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
  return (
    <header className="h-16 w-full bg-white border-b border-[#EFEFEF] flex items-center justify-between px-4 md:px-6 select-none z-30 flex-shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      {/* ── Left: Brand & Window Indicator ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Pinterest-style Red Logo Mark */}
          <div
            onClick={onOpenUpload}
            className="w-10 h-10 rounded-full bg-[#E60023] hover:bg-[#AD081B] text-white flex items-center justify-center font-black text-xl shadow-md cursor-pointer transition-transform active:scale-95"
            title="Create New Pin"
          >
            <span>⛓</span>
          </div>

          <div className="flex flex-col cursor-pointer" onClick={() => window.location.reload()}>
            <span className="text-base font-extrabold text-[#111111] tracking-tight leading-tight">
              Insta<span className="text-[#E60023]">Ledger</span>
            </span>
            <span className="text-[10px] text-[#767676] font-mono flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#27ae60] animate-pulse" />
              Fabric v2.5 · {channelName}
            </span>
          </div>
        </div>
      </div>

      {/* ── Center: Pinterest Search Bar Pill ── */}
      <div className="hidden sm:flex flex-1 max-w-xl mx-4 lg:mx-8">
        <div className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#F0F0F0] hover:bg-[#EAEAEA] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#E60023]/25 focus-within:border-[#E60023] border border-transparent transition-all">
          <Search className="w-4 h-4 text-[#767676] flex-shrink-0" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            placeholder="Search pins, creators, blockchain CIDs, or perceptual hashes…"
            className="w-full bg-transparent border-none outline-none text-xs text-[#111111] placeholder:text-[#767676]"
          />
        </div>
      </div>

      {/* ── Right: Channel, Actions & Profile ── */}
      <div className="flex items-center gap-2.5">
        {/* Blockchain Inspector Pill */}
        <button
          onClick={onOpenLedger}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0F0F0] hover:bg-[#E2E2E2] text-xs font-semibold text-[#111111] transition-colors"
          title="Inspect Hyperledger Fabric Ledger"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#E60023]" />
          <span>Ledger</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white text-[#767676] font-bold border border-black/5">
            #{blockHeight}
          </span>
        </button>

        {/* Sync Button */}
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F0F0F0] hover:bg-[#E2E2E2] text-[#111111] text-xs font-semibold transition-colors"
          title="Synchronize ledger state"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingFeed ? 'animate-spin text-[#E60023]' : 'text-[#767676]'}`} />
          <span className="hidden sm:inline">Sync</span>
        </button>

        {/* Layout Toggle (Desktop vs Compact) */}
        <button
          onClick={() => setViewMode(viewMode === 'desktop' ? 'compact' : 'desktop')}
          className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F0F0F0] hover:bg-[#E2E2E2] text-[#111111] text-xs font-semibold transition-colors"
          title="Toggle view mode"
        >
          {viewMode === 'desktop' ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-[#E60023]" />
              <span>Full Masonry</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-[#E60023]" />
              <span>Compact View</span>
            </>
          )}
        </button>

        {/* Active User Avatar Pill */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#EFEFEF]">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.username}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#E60023]/20"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-[#111111] leading-none">@{currentUser.username}</span>
              <span className="text-[10px] text-[#27ae60] font-mono font-semibold">Org1MSP</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
