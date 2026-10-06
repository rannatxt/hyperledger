import { Heart, Send, PlusSquare, ChevronDown, RefreshCw, Monitor } from 'lucide-react';

export default function NavHeader({
  onOpenLedger,
  onOpenActivity,
  onOpenUpload,
  onRefresh,
  loadingFeed = false,
  unread = 1,
  onToggleViewMode
}) {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10]);
    }
  };

  return (
    <nav className="w-full ios-frosted-nav px-3.5 py-2.5 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand Logo & Channel Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-baseline gap-1 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="text-[20px] font-bold tracking-tight text-[#262626] font-serif italic">
            Instagram
          </span>
          <span className="text-[9px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[#EFEFEF] text-[#737373] border border-[#DBDBDB]/60">
            Ledger
          </span>
        </div>

        <button
          onClick={() => { triggerHaptic(); onOpenLedger?.(); }}
          className="flex items-center gap-1 ml-0.5 px-2 py-0.5 rounded-full bg-[#FAFAFA] hover:bg-[#EFEFEF] text-[9px] font-mono text-[#737373] border border-[#E5E5E5] transition-all active:scale-95"
          title="Fabric Channel: mychannel"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00BA88] animate-pulse" />
          <span>mychannel</span>
          <ChevronDown className="w-2.5 h-2.5 text-[#8E8E8E]" />
        </button>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-3 text-[#262626]">
        {/* Toggle to Desktop View */}
        {onToggleViewMode && (
          <button
            onClick={() => { triggerHaptic(); onToggleViewMode(); }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAFAFA] hover:bg-[#EAEAEA] border border-[#DBDBDB] text-[10px] font-semibold text-[#0095F6] transition-all active:scale-95"
            title="Switch to iOS Desktop View"
          >
            <Monitor className="w-3.5 h-3.5 text-[#0095F6]" />
            <span className="hidden xs:inline">Desktop</span>
          </button>
        )}

        {/* Sync Feed button */}
        {onRefresh && (
          <button
            onClick={() => { triggerHaptic(); onRefresh(); }}
            className="p-1 text-[#262626] active:scale-90 transition-transform"
            aria-label="Sync Feed"
            title="Sync with Fabric Ledger"
          >
            <RefreshCw className={`w-[19px] h-[19px] stroke-[1.8] ${loadingFeed ? 'animate-spin text-[#0095F6]' : ''}`} />
          </button>
        )}

        {/* Upload Post */}
        {onOpenUpload && (
          <button
            onClick={() => { triggerHaptic(); onOpenUpload(); }}
            className="p-1 active:scale-90 transition-transform"
            aria-label="New Post"
          >
            <PlusSquare className="w-[21px] h-[21px] stroke-[1.8]" />
          </button>
        )}

        {/* Activity / Heart */}
        <button
          onClick={() => { triggerHaptic(); onOpenActivity?.(); }}
          className="relative p-1 active:scale-90 transition-transform"
          aria-label="Activity"
        >
          <Heart className="w-[21px] h-[21px] stroke-[1.9]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ED4956] rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Direct / Ledger Explorer */}
        <button
          onClick={() => { triggerHaptic(); onOpenLedger?.(); }}
          className="relative p-1 active:scale-90 transition-transform"
          aria-label="Ledger Explorer"
          title="Inspect Blocks & Cryptographic Ledger"
        >
          <Send className="w-[20px] h-[20px] stroke-[1.9] -rotate-12" />
        </button>
      </div>
    </nav>
  );
}
