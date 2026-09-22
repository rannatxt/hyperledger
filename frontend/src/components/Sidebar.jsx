import React from 'react';
import {
  Home,
  Compass,
  PlusSquare,
  Heart,
  User,
  Database,
  Sun,
  Moon,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentUser,
  users,
  onSwitchUser,
  onOpenUpload,
  onOpenLedger,
  isDark,
  setIsDark,
  unreadActivityCount,
  onToggleActivity
}) {
  return (
    <aside className={`fixed top-0 left-0 h-screen w-16 md:w-64 z-30 border-r flex flex-col justify-between p-3 md:p-5 transition-colors duration-200 ${
      isDark ? 'bg-black border-[#262626] text-white' : 'bg-white border-[#dbdbdb] text-[#262626]'
    }`}>
      {/* Top Section: Brand & Nav Links */}
      <div className="flex flex-col gap-6">
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentTab('feed')}
          className="cursor-pointer flex items-center gap-3 px-2 py-3"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <span className="font-extrabold text-xl tracking-tighter">⛓️</span>
          </div>
          <div className="hidden md:flex flex-col">
            <span className="font-bold text-xl tracking-tight leading-none font-serif">
              Insta<span className="text-brand-blue">Ledger</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-blue flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3" /> Hyperledger Fabric
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          <button
            onClick={() => setCurrentTab('feed')}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'feed'
                ? isDark ? 'bg-[#181818] font-bold text-white' : 'bg-[#f0f0f0] font-bold text-black'
                : isDark ? 'hover:bg-[#121212] text-gray-300' : 'hover:bg-[#f8f8f8] text-gray-700'
            }`}
          >
            <Home className={`w-6 h-6 ${currentTab === 'feed' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="hidden md:inline">Home</span>
          </button>

          <button
            onClick={onOpenLedger}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'ledger'
                ? isDark ? 'bg-[#181818] font-bold text-white' : 'bg-[#f0f0f0] font-bold text-black'
                : isDark ? 'hover:bg-[#121212] text-gray-300' : 'hover:bg-[#f8f8f8] text-gray-700'
            }`}
          >
            <Database className="w-6 h-6 stroke-2 text-brand-blue" />
            <span className="hidden md:inline flex items-center gap-1.5">
              Ledger Explorer
              <span className="text-[10px] bg-brand-blue/20 text-brand-blue px-1.5 py-0.5 rounded-full font-semibold">Live</span>
            </span>
          </button>

          <button
            onClick={onOpenUpload}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-all group ${
              isDark ? 'hover:bg-[#121212] text-gray-300' : 'hover:bg-[#f8f8f8] text-gray-700'
            }`}
          >
            <PlusSquare className="w-6 h-6 stroke-2 group-hover:scale-110 transition-transform text-pink-500" />
            <span className="hidden md:inline">Create Post</span>
          </button>

          <button
            onClick={onToggleActivity}
            className={`relative flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
              isDark ? 'hover:bg-[#121212] text-gray-300' : 'hover:bg-[#f8f8f8] text-gray-700'
            }`}
          >
            <div className="relative">
              <Heart className="w-6 h-6 stroke-2" />
              {unreadActivityCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-red rounded-full ring-2 ring-black animate-pulse" />
              )}
            </div>
            <span className="hidden md:inline">Activity</span>
          </button>

          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
              currentTab === 'profile'
                ? isDark ? 'bg-[#181818] font-bold text-white' : 'bg-[#f0f0f0] font-bold text-black'
                : isDark ? 'hover:bg-[#121212] text-gray-300' : 'hover:bg-[#f8f8f8] text-gray-700'
            }`}
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-brand-blue/50 flex-shrink-0">
              <img
                src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={currentUser?.username}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden md:inline">Profile</span>
          </button>
        </nav>
      </div>

      {/* Bottom Section: User Switcher & Theme */}
      <div className="flex flex-col gap-3">
        {/* User Switcher Dropdown */}
        <div className="hidden md:block">
          <label className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 px-3 block mb-1">
            Active Identity (MSP)
          </label>
          <div className="relative">
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                const selected = users.find(u => u.id === e.target.value);
                if (selected) onSwitchUser(selected);
              }}
              className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-blue ${
                isDark ? 'bg-[#181818] border-[#262626] text-white' : 'bg-gray-100 border-gray-300 text-black'
              }`}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  @{u.username} ({u.displayName})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3.5 pointer-events-none text-gray-400" />
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isDark ? 'hover:bg-[#181818] text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
          <span className="hidden md:inline">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
}
