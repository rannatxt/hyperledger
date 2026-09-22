import { useState } from 'react';
import { Grid, Bookmark, ShieldCheck, CheckCircle2, Heart, MessageCircle, Lock } from 'lucide-react';

export default function ProfileView({ user, allUsers, posts, currentUser, onSwitchUser, onSelectPost }) {
  const [tab, setTab] = useState('grid');
  const [switcher, setSwitcher] = useState(false);

  const displayUser = user || currentUser;
  const userPosts = posts.filter(p => p.authorId === displayUser?.id);

  if (!displayUser) return (
    <div className="flex items-center justify-center py-24 text-gray-500 text-xs">Loading profile…</div>
  );

  return (
    <div className="w-full max-w-[470px] mx-auto pb-24 text-white select-none">
      {/* Profile nav */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] bg-black/90 backdrop-blur-md">
        <button onClick={() => setSwitcher(s => !s)}
          className="flex items-center gap-1.5">
          <span className="font-bold text-base tracking-tight">{displayUser.username}</span>
          <CheckCircle2 className="w-4 h-4 text-ios-blue fill-ios-blue" />
          <span className="text-xs text-gray-400">▾</span>
        </button>
        <button onClick={() => setSwitcher(s => !s)} className="text-xs text-ios-blue font-semibold">Switch</button>
      </div>

      {/* User switcher */}
      {switcher && (
        <div className="mx-3 mt-2 p-3 rounded-2xl bg-[#1c1c1e] border border-white/10 space-y-1.5 animate-fade-in shadow-2xl">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Switch Fabric Identity</p>
          {allUsers.map(u => (
            <button key={u.id} onClick={() => { onSwitchUser(u); setSwitcher(false); }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors ${u.id === currentUser?.id ? 'bg-ios-blue/20 border border-ios-blue/40' : 'hover:bg-white/5'}`}>
              <div className="flex items-center gap-2.5">
                <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                <div className="text-left">
                  <div className="text-xs font-bold flex items-center gap-1">@{u.username}
                    {u.id === currentUser?.id && <span className="text-[9px] text-ios-blue">(Active)</span>}
                  </div>
                  <div className="text-[10px] text-gray-400">{u.displayName}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-green-400">Org1MSP</span>
            </button>
          ))}
        </div>
      )}

      {/* Bio section */}
      <div className="px-4 pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-[82px] h-[82px] rounded-full story-ring p-[2px]">
            <div className="w-full h-full bg-black rounded-full p-[2px]">
              <img src={displayUser.avatarUrl} alt={displayUser.username} className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
          <div className="flex items-center gap-6 text-center pr-2">
            {[['posts', userPosts.length], ['followers', displayUser.followerCount?.toLocaleString() ?? 0], ['following', displayUser.followingCount?.toLocaleString() ?? 0]].map(([label, val]) => (
              <div key={label}>
                <p className="text-base font-bold">{val}</p>
                <p className="text-[11px] text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold">{displayUser.displayName}</p>
          <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-gray-300">
            <ShieldCheck className="w-3 h-3 text-green-400" /> {displayUser.mspId || 'Org1MSP'}
          </div>
          <p className="text-[13px] text-gray-200 leading-relaxed mt-1.5">{displayUser.bio}</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setSwitcher(true)}
            className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold border border-white/10 active:scale-95 transition-all">
            Switch Profile
          </button>
          <button className="flex-1 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold border border-white/10 active:scale-95 transition-all">
            Share Profile
          </button>
        </div>
      </div>

      {/* Grid / Saved tabs */}
      <div className="flex border-t border-b border-white/[0.07] mt-4">
        {[['grid', Grid], ['saved', Bookmark]].map(([t, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 flex items-center justify-center border-b-2 transition-all ${tab === t ? 'border-white text-white' : 'border-transparent text-gray-500'}`}>
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>

      {/* Grid */}
      {tab === 'grid' ? (
        userPosts.length === 0
          ? <p className="py-16 text-center text-xs text-gray-500">No posts recorded on ledger yet.</p>
          : (
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
              {userPosts.map(post => (
                <div key={post.id} onClick={() => onSelectPost?.(post)}
                  className="group relative aspect-square bg-neutral-900 cursor-pointer overflow-hidden">
                  <img src={post.mediaUrl} alt="post"
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 f-${post.filterName?.toLowerCase() || 'normal'}`} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                    <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" />{post.likeCount}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" />{post.commentCount}</span>
                  </div>
                  <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-mono text-green-400">
                    #{post.blockNumber}
                  </div>
                </div>
              ))}
            </div>
          )
      ) : (
        <div className="p-8 text-center space-y-3">
          <Lock className="w-9 h-9 text-ios-blue mx-auto" />
          <p className="font-bold text-sm">Saved to Ledger</p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
            Saved posts are indexed immutably on the Hyperledger Fabric ledger under your identity key.
          </p>
        </div>
      )}
    </div>
  );
}
