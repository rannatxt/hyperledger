import { Home, Search, PlusCircle, Database, User } from 'lucide-react';

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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EFEFEF] select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <div className="max-w-[470px] mx-auto px-6 py-2 flex items-center justify-between text-[#111111]">

        {/* Home */}
        <button
          onClick={() => handleTab('feed')}
          className="p-2 active:scale-90 transition-transform flex flex-col items-center gap-0.5"
          aria-label="Feed"
        >
          <Home
            className={`w-[22px] h-[22px] ${
              active === 'feed' ? 'stroke-[#E60023] text-[#E60023]' : 'stroke-[#767676]'
            } transition-colors`}
          />
        </button>

        {/* Explore */}
        <button
          onClick={() => handleTab('explore')}
          className="p-2 active:scale-90 transition-transform flex flex-col items-center gap-0.5"
          aria-label="Explore"
        >
          <Search
            className={`w-[22px] h-[22px] stroke-[2.2] ${
              active === 'explore' ? 'text-[#E60023]' : 'text-[#767676]'
            } transition-colors`}
          />
        </button>

        {/* Create (centre Pinterest Red) */}
        <button
          onClick={() => { triggerHaptic(); onOpenUpload(); }}
          className="p-2 rounded-full bg-[#E60023] text-white hover:bg-[#AD081B] active:scale-90 transition-all shadow-md"
          aria-label="Create Pin"
        >
          <PlusCircle className="w-[24px] h-[24px] stroke-[2.5]" />
        </button>

        {/* Ledger */}
        <button
          onClick={() => handleTab('ledger')}
          className="relative p-2 active:scale-90 transition-transform flex flex-col items-center gap-0.5"
          aria-label="Ledger Explorer"
        >
          <Database
            className={`w-[22px] h-[22px] stroke-[2] ${
              active === 'ledger' ? 'text-[#E60023]' : 'text-[#767676]'
            } transition-colors`}
          />
          {blockCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#27ae60]" />
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => handleTab('profile')}
          className="p-1 active:scale-90 transition-transform"
          aria-label="Profile"
        >
          {currentUser ? (
            <div className={`w-[26px] h-[26px] rounded-full p-[1.5px] ${active === 'profile' ? 'ring-2 ring-[#E60023]' : ''}`}>
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.username}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          ) : (
            <User className={`w-[22px] h-[22px] ${active === 'profile' ? 'text-[#E60023]' : 'text-[#767676]'}`} />
          )}
        </button>
      </div>
    </div>
  );
}
