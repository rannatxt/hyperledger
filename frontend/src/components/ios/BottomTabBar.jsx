import { Home, Search, PlusSquare, Activity, User } from 'lucide-react';

export default function BottomTabBar({ active, onTab, onOpenUpload, currentUser, blockCount = 4 }) {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10]);
    }
  };

  const handleTab = (t) => {
    triggerHaptic();
    onTab(t);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 ios-glass select-none">
      <div className="max-w-[470px] mx-auto px-6 pt-2 pb-0.5 flex items-center justify-between text-white">

        {/* Home */}
        <button
          onClick={() => handleTab('feed')}
          className="p-2 active:scale-90 transition-transform"
          aria-label="Feed"
        >
          <Home
            className={`w-[24px] h-[24px] ${
              active === 'feed' ? 'fill-white stroke-white' : 'stroke-gray-400'
            } transition-colors`}
          />
        </button>

        {/* Explore */}
        <button
          onClick={() => handleTab('explore')}
          className="p-2 active:scale-90 transition-transform"
          aria-label="Explore"
        >
          <Search
            className={`w-[24px] h-[24px] stroke-[2.2] ${
              active === 'explore' ? 'text-white' : 'text-gray-400'
            } transition-colors`}
          />
        </button>

        {/* Create (centre) */}
        <button
          onClick={() => { triggerHaptic(); onOpenUpload(); }}
          className="p-1.5 rounded-[12px] bg-white/10 hover:bg-white/20 active:scale-90 transition-all border border-white/20 shadow-md"
          aria-label="Create Post"
        >
          <PlusSquare className="w-[24px] h-[24px] stroke-[2]" />
        </button>

        {/* Ledger */}
        <button
          onClick={() => handleTab('ledger')}
          className="relative p-2 active:scale-90 transition-transform"
          aria-label="Ledger Explorer"
        >
          <Activity
            className={`w-[24px] h-[24px] stroke-[2.2] ${
              active === 'ledger' ? 'text-[#007aff]' : 'text-gray-400'
            } transition-colors`}
          />
          {blockCount > 0 && (
            <span className="absolute top-1 right-1 bg-[#007aff] text-white text-[9px] font-bold px-1.5 rounded-full ring-2 ring-black leading-tight">
              {blockCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => handleTab('profile')}
          className="p-1 active:scale-90 transition-transform"
          aria-label="Profile"
        >
          <div
            className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
              active === 'profile' ? 'border-white' : 'border-transparent opacity-75'
            }`}
          >
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      </div>

      {/* ── Native iOS Home Indicator Pill ── */}
      <div className="w-full pt-2 pb-1.5 flex justify-center">
        <div className="w-[134px] h-[5px] bg-white/30 rounded-full" />
      </div>
    </div>
  );
}
