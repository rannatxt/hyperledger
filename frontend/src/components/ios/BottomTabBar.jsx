import { Home, Search, PlusSquare, Activity, User } from 'lucide-react';

export default function BottomTabBar({ active, onTab, onOpenUpload, currentUser, blockCount = 4 }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 ios-glass select-none">
      <div className="max-w-[470px] mx-auto px-6 pt-2 pb-0.5 flex items-center justify-between text-white">

        {/* Home */}
        <button onClick={() => onTab('feed')} className="p-2 active:scale-90 transition-transform" aria-label="Feed">
          <Home className={`w-6 h-6 ${active === 'feed' ? 'fill-white stroke-white' : 'stroke-gray-400'} transition-colors`} />
        </button>

        {/* Explore */}
        <button onClick={() => onTab('explore')} className="p-2 active:scale-90 transition-transform" aria-label="Explore">
          <Search className={`w-6 h-6 stroke-[2.2] ${active === 'explore' ? 'text-white' : 'text-gray-400'} transition-colors`} />
        </button>

        {/* Create (centre) */}
        <button onClick={onOpenUpload}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all border border-white/20" aria-label="Create Post">
          <PlusSquare className="w-6 h-6 stroke-[2]" />
        </button>

        {/* Ledger */}
        <button onClick={() => onTab('ledger')} className="relative p-2 active:scale-90 transition-transform" aria-label="Ledger">
          <Activity className={`w-6 h-6 stroke-[2.2] ${active === 'ledger' ? 'text-ios-blue' : 'text-gray-400'} transition-colors`} />
          {blockCount > 0 && (
            <span className="absolute top-1 right-1 bg-ios-blue text-white text-[9px] font-bold px-1 rounded-full ring-2 ring-black leading-tight">{blockCount}</span>
          )}
        </button>

        {/* Profile */}
        <button onClick={() => onTab('profile')} className="p-1 active:scale-90 transition-transform" aria-label="Profile">
          <div className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${active === 'profile' ? 'border-white' : 'border-transparent opacity-70'}`}>
            <img src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
              alt="profile" className="w-full h-full object-cover" />
          </div>
        </button>
      </div>

      {/* iOS home indicator */}
      <div className="w-full pt-2 pb-1.5 flex justify-center">
        <div className="w-32 h-[5px] bg-white/25 rounded-full" />
      </div>
    </div>
  );
}
