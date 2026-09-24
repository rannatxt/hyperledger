import { Heart, Send, ShieldCheck, Lock } from 'lucide-react';

export default function NavHeader({ onOpenLedger, onOpenActivity, unread = 2 }) {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10]);
    }
  };

  return (
    <nav className="w-full ios-glass-nav px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand + channel pill */}
      <div className="flex items-center gap-2">
        <h1 className="text-[21px] font-bold tracking-tight text-white cursor-default font-sans">
          InstaLedger
        </h1>
        <button
          onClick={() => { triggerHaptic(); onOpenLedger(); }}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#007aff]/15 border border-[#007aff]/30 text-[10px] font-semibold text-[#007aff] hover:bg-[#007aff]/25 active:scale-95 transition-all"
        >
          <Lock className="w-2.5 h-2.5" />
          mychannel
        </button>
      </div>

      {/* Action icons */}
      <div className="flex items-center gap-3.5 text-white">
        <button
          onClick={() => { triggerHaptic(); onOpenActivity(); }}
          className="relative p-1.5 active:scale-90 transition-transform"
          aria-label="Activity"
        >
          <Heart className="w-[23px] h-[23px] stroke-[1.8]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff3b30] rounded-full ring-2 ring-black" />
          )}
        </button>
        <button
          onClick={() => { triggerHaptic(); onOpenLedger(); }}
          className="relative p-1.5 active:scale-90 transition-transform"
          aria-label="Ledger Inspector"
        >
          <Send className="w-[23px] h-[23px] stroke-[1.8] -rotate-12" />
          <span className="absolute -top-0.5 -right-1 bg-[#ff3b30] text-white text-[9px] font-bold px-1.5 rounded-full ring-2 ring-black leading-tight">
            Fabric
          </span>
        </button>
      </div>
    </nav>
  );
}
