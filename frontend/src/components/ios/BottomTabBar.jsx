import { Home, Search, PlusSquare, Heart, ShieldCheck } from 'lucide-react';

export default function BottomTabBar({ active, onTab, onOpenUpload, currentUser, unreadActivity = 1 }) {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([8]);
    }
  };

  const handleTab = (t) => {
    triggerHaptic();
    onTab(t);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 ios-frosted-tabbar select-none pt-2 pb-1 safe-area-pb">
      <div className="max-w-[470px] mx-auto px-6 flex items-center justify-between text-[#262626]">
        {/* 1. Home */}
        <button
          onClick={() => handleTab('feed')}
          className="p-2 active:scale-90 transition-transform"
          aria-label="Home Feed"
        >
          <Home
            className={`w-[25px] h-[25px] ${
              active === 'feed'
                ? 'stroke-[#262626] fill-[#262626]'
                : 'stroke-[#262626] stroke-[1.8] fill-none'
            }`}
          />
        </button>

        {/* 2. Search / Explore */}
        <button
          onClick={() => handleTab('explore')}
          className="p-2 active:scale-90 transition-transform"
          aria-label="Explore"
        >
          <Search
            className={`w-[25px] h-[25px] ${
              active === 'explore'
                ? 'stroke-[#262626] stroke-[2.8]'
                : 'stroke-[#262626] stroke-[1.8]'
            }`}
          />
        </button>

        {/* 3. Upload / Create */}
        <button
          onClick={() => { triggerHaptic(); onOpenUpload?.(); }}
          className="p-2 active:scale-90 transition-transform text-[#262626]"
          aria-label="Create Post"
        >
          <PlusSquare className="w-[26px] h-[26px] stroke-[1.8]" />
        </button>

        {/* 4. Activity / Ledger */}
        <button
          onClick={() => handleTab('activity')}
          className="relative p-2 active:scale-90 transition-transform text-[#262626]"
          aria-label="Activity and Ledger"
        >
          <Heart
            className={`w-[25px] h-[25px] ${
              active === 'activity'
                ? 'stroke-[#262626] fill-[#262626]'
                : 'stroke-[#262626] stroke-[1.8] fill-none'
            }`}
          />
          {unreadActivity > 0 && active !== 'activity' && (
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#ED4956] rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* 5. Profile */}
        <button
          onClick={() => handleTab('profile')}
          className="p-1 active:scale-90 transition-transform"
          aria-label="Profile"
        >
          {currentUser ? (
            <div
              className={`w-[27px] h-[27px] rounded-full p-[1.5px] transition-all ${
                active === 'profile'
                  ? 'ring-2 ring-[#262626] ring-offset-1'
                  : ''
              }`}
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          ) : (
            <div className={`w-[25px] h-[25px] rounded-full border-2 ${active === 'profile' ? 'border-[#262626]' : 'border-[#737373]'}`} />
          )}
        </button>
      </div>

      {/* iOS Home Indicator Bar */}
      <div className="w-32 h-1 bg-black/25 rounded-full mx-auto mt-2 mb-0.5" />
    </div>
  );
}
