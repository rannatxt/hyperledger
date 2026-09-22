import { Heart, Send, ShieldCheck } from 'lucide-react';

export default function NavHeader({ onOpenLedger, onOpenActivity, unread = 2 }) {
  return (
    <nav className="w-full bg-black/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b border-white/[0.06] sticky top-0 z-30">
      {/* Brand + channel pill */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold italic tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent cursor-default">
          InstaLedger
        </h1>
        <button
          onClick={onOpenLedger}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ios-blue/15 border border-ios-blue/30 text-[10px] font-semibold text-ios-blue hover:bg-ios-blue/25 transition-all"
        >
          <ShieldCheck className="w-3 h-3" />
          mychannel
        </button>
      </div>

      {/* Action icons */}
      <div className="flex items-center gap-4 text-white">
        <button
          onClick={onOpenActivity}
          className="relative p-1 active:scale-90 transition-transform"
          aria-label="Activity"
        >
          <Heart className="w-6 h-6 stroke-[1.8]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-ios-red rounded-full ring-2 ring-black animate-pulse" />
          )}
        </button>
        <button
          onClick={onOpenLedger}
          className="relative p-1 active:scale-90 transition-transform"
          aria-label="Ledger / DMs"
        >
          <Send className="w-6 h-6 stroke-[1.8] -rotate-12" />
          <span className="absolute -top-1 -right-1.5 bg-ios-red text-white text-[9px] font-bold px-1 rounded-full ring-2 ring-black leading-tight">3</span>
        </button>
      </div>
    </nav>
  );
}
