import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import StoriesBar from './components/StoriesBar';
import PostCard from './components/PostCard';
import ProfileView from './components/ProfileView';
import UploadModal from './components/UploadModal';
import LedgerInspectorModal from './components/LedgerInspectorModal';
import ActivityDrawer from './components/ActivityDrawer';
import { api } from './services/api';
import { ShieldCheck, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [feedPosts, setFeedPosts] = useState([]);
  const [currentTab, setCurrentTab] = useState('feed'); // 'feed' | 'profile'
  const [viewingProfile, setViewingProfile] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [highlightTx, setHighlightTx] = useState(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [activities, setActivities] = useState([
    {
      id: 'act_1',
      type: 'block',
      actorUsername: 'orderer.example.com',
      message: 'Genesis block mined on channel mychannel with Org1MSP verification',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'act_2',
      type: 'like',
      actorUsername: 'elena_crypto',
      message: 'liked your genesis post',
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ]);

  // Sync dark class on body
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, [isDark]);

  // Load initial users
  useEffect(() => {
    const initData = async () => {
      try {
        const loadedUsers = await api.getUsers();
        setUsers(loadedUsers);
        if (loadedUsers.length > 0) {
          setCurrentUser(loadedUsers[0]);
          setViewingProfile(loadedUsers[0]);
        }
      } catch (err) {
        console.error('Failed to load initial users:', err);
      }
    };
    initData();
  }, []);

  // Load feed when currentUser changes
  const loadFeed = async (viewerId) => {
    setIsLoadingFeed(true);
    try {
      const posts = await api.getFeed(viewerId);
      setFeedPosts(posts);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadFeed(currentUser.id);
    }
  }, [currentUser?.id]);

  const handleSwitchUser = (user) => {
    setCurrentUser(user);
    if (currentTab === 'profile') {
      setViewingProfile(user);
    }
  };

  const handleAuthorClick = async (authorId) => {
    try {
      const profile = await api.getProfile(authorId);
      setViewingProfile(profile);
      setCurrentTab('profile');
    } catch (err) {
      console.error('Failed to fetch author profile:', err);
    }
  };

  const handlePostCreated = (newPost) => {
    setFeedPosts(prev => [newPost, ...prev]);
    setActivities(prev => [
      {
        id: 'act_' + Date.now(),
        type: 'block',
        actorUsername: currentUser?.username,
        message: `minted post ${newPost.id.slice(0, 12)}... on ledger`,
        timestamp: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const handleOpenLedgerTx = (post) => {
    setHighlightTx(post);
    setIsLedgerOpen(true);
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-black text-white' : 'bg-[#FAFAFA] text-[#262626]'}`}>
      {/* Fixed Left Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenLedger={() => setIsLedgerOpen(true)}
        isDark={isDark}
        setIsDark={setIsDark}
        unreadActivityCount={activities.length}
        onToggleActivity={() => setIsActivityOpen(!isActivityOpen)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pl-16 md:pl-64 min-h-screen overflow-x-hidden">
        {currentTab === 'feed' ? (
          <div className="w-full max-w-5xl mx-auto px-2 md:px-6 py-4 flex gap-8 justify-center">
            {/* Center Feed Stream */}
            <div className="w-full max-w-[470px]">
              {/* Stories Tray */}
              <StoriesBar
                users={users}
                currentUser={currentUser}
                onSelectUser={(user) => {
                  setViewingProfile(user);
                  setCurrentTab('profile');
                }}
                onOpenUpload={() => setIsUploadOpen(true)}
                isDark={isDark}
              />

              {/* Feed Header status */}
              <div className="flex items-center justify-between px-2 mb-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
                  Hyperledger Fabric channel: <strong className="text-white font-mono">mychannel</strong>
                </span>
                <button
                  onClick={() => loadFeed(currentUser?.id)}
                  className="hover:text-white transition-colors flex items-center gap-1"
                  title="Refresh feed"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingFeed ? 'animate-spin text-brand-blue' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>

              {/* Posts Stream */}
              {isLoadingFeed && feedPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-brand-blue mb-2" />
                  <span>Reading blocks from Fabric world state...</span>
                </div>
              ) : feedPosts.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-xs">
                  No posts yet. Be the first to mint a post on ledger!
                </div>
              ) : (
                feedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onOpenLedgerTx={handleOpenLedgerTx}
                    onAuthorClick={handleAuthorClick}
                    isDark={isDark}
                  />
                ))
              )}
            </div>

            {/* Right Side Info Widget (Desktop only) */}
            <div className="hidden lg:block w-80 flex-shrink-0 pt-4">
              {/* Current Profile Card */}
              {currentUser && (
                <div className="flex items-center justify-between mb-6">
                  <div 
                    onClick={() => {
                      setViewingProfile(currentUser);
                      setCurrentTab('profile');
                    }}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.username}
                      className="w-12 h-12 rounded-full object-cover border border-brand-blue/50"
                    />
                    <div>
                      <div className="font-bold text-xs group-hover:underline">@{currentUser.username}</div>
                      <div className="text-xs text-gray-500">{currentUser.displayName}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">Org1MSP Identity</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions / Peers */}
              <div className={`p-4 rounded-2xl border mb-6 ${
                isDark ? 'bg-[#121212] border-[#262626]' : 'bg-white border-[#dbdbdb]'
              }`}>
                <div className="flex items-center justify-between mb-3 text-xs font-bold">
                  <span className="text-gray-400">Ledger Peers</span>
                  <button onClick={() => setIsLedgerOpen(true)} className="text-[11px] text-brand-blue hover:underline">
                    Explorer
                  </button>
                </div>

                <div className="space-y-3">
                  {users.filter(u => u.id !== currentUser?.id).map((peer) => (
                    <div key={peer.id} className="flex items-center justify-between text-xs">
                      <div 
                        onClick={() => {
                          setViewingProfile(peer);
                          setCurrentTab('profile');
                        }}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <img
                          src={peer.avatarUrl}
                          alt={peer.username}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <span className="font-bold group-hover:underline block leading-tight">
                            {peer.username}
                          </span>
                          <span className="text-[10px] text-gray-500">Fabric Participant</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSwitchUser(peer)}
                        className="text-[11px] font-bold text-brand-blue hover:text-brand-hover"
                      >
                        Switch
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architecture Info Card */}
              <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                isDark ? 'bg-[#121212] border-[#262626] text-gray-400' : 'bg-white border-[#dbdbdb] text-gray-600'
              }`}>
                <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  InstaLedger Architecture
                </div>
                <p className="text-[11px] leading-relaxed">
                  Every like, comment, follow, and post metadata is an immutable transaction on Hyperledger Fabric. Media binaries are hashed and stored via simulated IPFS.
                </p>
                <div className="pt-2 border-t border-[#262626]/50 flex items-center justify-between text-[10px] font-mono">
                  <span>Channel: mychannel</span>
                  <span className="text-emerald-400">Consensus: Raft</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Profile View */
          <ProfileView
            profileUser={viewingProfile || currentUser}
            currentUser={currentUser}
            onSelectPost={handleOpenLedgerTx}
            onUserFollowUpdated={async () => {
              const updatedUsers = await api.getUsers();
              setUsers(updatedUsers);
            }}
            isDark={isDark}
          />
        )}
      </main>

      {/* Upload Post Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentUser={currentUser}
        onPostCreated={handlePostCreated}
        isDark={isDark}
      />

      {/* Ledger Inspector Modal */}
      <LedgerInspectorModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        highlightTx={highlightTx}
        isDark={isDark}
      />

      {/* Activity Drawer */}
      <ActivityDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        activities={activities}
        onActivityClick={(act) => {
          setIsActivityOpen(false);
          setIsLedgerOpen(true);
        }}
        isDark={isDark}
      />
    </div>
  );
}
