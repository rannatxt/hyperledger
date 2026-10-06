import { Heart, Send, ShieldCheck, Lock } from 'lucide-react';

export default function NavHeader({ onOpenLedger, onOpenActivity, unread = 2 }) {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10]);
    }
  };

  return (
    <nav className="w-full bg-white border-b border-[#EFEFEF] px-4 py-3 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Brand + channel pill */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[#E60023] text-white flex items-center justify-center font-bold text-xs">
          <span>⛓</span>
        </div>
        <h1 className="text-lg font-extrabold tracking-tight text-[#111111]">
          Insta<span className="text-[#E60023]">Ledger</span>
        </h1>
        <button
          onClick={() => { triggerHaptic(); onOpenLedger(); }}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0F0F0] text-[10px] font-mono font-bold text-[#111111] hover:bg-[#E2E2E2] active:scale-95 transition-all"
        >
          <Lock className="w-2.5 h-2.5 text-[#E60023]" />
          mychannel
        </button>
      </div>

      {/* Action icons */}
      <div className="flex items-center gap-3 text-[#111111]">
        <button
          onClick={() => { triggerHaptic(); onOpenActivity(); }}
          className="relative p-1.5 active:scale-90 transition-transform"
          aria-label="Activity"
        >
          <Heart className="w-5 h-5 stroke-[2]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#E60023] rounded-full ring-2 ring-white" />
          )}
        </button>
        <button
          onClick={() => { triggerHaptic(); onOpenLedger(); }}
          className="relative p-1.5 active:scale-90 transition-transform"
          aria-label="Ledger Inspector"
        >
          <Send className="w-5 h-5 stroke-[2] -rotate-12" />
        </button>
      </div>
    </nav>
  );
}
