import { useState, useEffect } from 'react';
import { RefreshCw, Monitor, Layers } from 'lucide-react';

import DesktopTitleBar      from './components/desktop/DesktopTitleBar';
import DesktopSidebar       from './components/desktop/DesktopSidebar';
import DesktopInspectorPane from './components/desktop/DesktopInspectorPane';
import DesktopPostCard      from './components/desktop/DesktopPostCard';
import DesktopUploadModal   from './components/desktop/DesktopUploadModal';

import StatusBar            from './components/ios/StatusBar';
import NavHeader            from './components/ios/NavHeader';
import StoriesBar           from './components/ios/StoriesBar';
import BottomTabBar         from './components/ios/BottomTabBar';
import LedgerModal          from './components/ios/LedgerModal';
import CommentsSheet        from './components/ios/CommentsSheet';
import ProfileView          from './components/ios/ProfileView';
import ExploreView          from './components/ios/ExploreView';

import { api } from './services/api';

export default function App() {
  const [tab,           setTab]           = useState('feed');
  const [viewMode,      setViewMode]      = useState('desktop'); // 'desktop' | 'compact'
  const [posts,         setPosts]         = useState([]);
  const [users,         setUsers]         = useState([]);
  const [currentUser,   setCurrentUser]   = useState(null);
  const [loadingFeed,   setLoadingFeed]   = useState(true);

  // Modal states
  const [uploadOpen,    setUploadOpen]    = useState(false);
  const [ledgerOpen,    setLedgerOpen]    = useState(false);
  const [commentPost,   setCommentPost]   = useState(null);
  const [selectedPost,  setSelectedPost]  = useState(null);

  // ── Init ──
  useEffect(() => {
    const init = async () => {
      try {
        const loadedUsers = await api.getUsers();
        const userList = loadedUsers?.users || loadedUsers || [];
        setUsers(userList);
        if (userList.length > 0) setCurrentUser(userList[0]);
      } catch (err) {
        console.error('Init error:', err);
      }
    };
    init();
  }, []);

  // ── Load feed when currentUser changes ──
  const refreshFeed = async (uid) => {
    setLoadingFeed(true);
    try {
      const result = await api.getFeed(uid || currentUser?.id);
      setPosts(result?.posts || result || []);
    } catch (err) {
      console.error('Feed error:', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) refreshFeed(currentUser.id);
  }, [currentUser?.id]);

  // ── Like toggle ──
  const handleLike = async (postId) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked = !p.isLikedByViewer;
      return { ...p, isLikedByViewer: liked, likeCount: liked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1) };
    }));
    try {
      await api.toggleLike(postId, currentUser.id);
    } catch (err) {
      console.error('Like error:', err);
      refreshFeed();
    }
  };

  // ── Post created ──
  const handlePostCreated = (result) => {
    const newPost = result?.post ?? result;
    if (newPost) setPosts(prev => [newPost, ...prev]);
    setTab('feed');
  };

  const openLedger = (post) => {
    setSelectedPost(post || null);
    setLedgerOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#070b14] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,122,255,0.15),rgba(255,255,255,0))] flex items-center justify-center p-0 md:p-6 lg:p-8 select-none">
      {/* ── Native Mac Catalyst / iPadOS Centered Container ── */}
      <div
        className={`w-full transition-all duration-300 flex flex-col relative overflow-hidden bg-black/95 backdrop-blur-2xl ${
          viewMode === 'desktop'
            ? 'max-w-[1400px] h-screen md:h-[92vh] max-h-[960px] md:rounded-[28px] border border-white/[0.12] shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_80px_rgba(0,122,255,0.08)]'
            : 'max-w-[470px] min-h-screen md:min-h-[880px] md:h-[90vh] md:rounded-[40px] border border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* ── Desktop Title Bar (Traffic Lights, Channel, Sync) ── */}
        <DesktopTitleBar
          channelName="mychannel"
          blockHeight={posts.length + 1}
          currentUser={currentUser}
          onRefresh={() => refreshFeed()}
          loadingFeed={loadingFeed}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onOpenLedger={() => setLedgerOpen(true)}
        />

        {/* ── DESKTOP SPLIT LAYOUT ── */}
        {viewMode === 'desktop' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Mac Catalyst Sidebar */}
            <DesktopSidebar
              activeTab={tab}
              setActiveTab={setTab}
              currentUser={currentUser}
              users={users}
              onSwitchUser={(u) => { setCurrentUser(u); refreshFeed(u.id); }}
              onOpenUpload={() => setUploadOpen(true)}
              onOpenLedger={() => setLedgerOpen(true)}
              blockCount={posts.length + 1}
            />

            {/* Center: Main Scroll Area (Feed / Explore / Profile) */}
            <main className="flex-1 overflow-y-auto no-scrollbar bg-black/60 p-4 lg:p-6 border-r border-white/[0.06]">
              <div className="max-w-[620px] mx-auto space-y-4">
                {/* FEED TAB */}
                {tab === 'feed' && (
                  <>
                    <StoriesBar
                      currentUser={currentUser}
                      onOpenUpload={() => setUploadOpen(true)}
                    />

                    {/* Channel Ledger Ticker */}
                    <div className="flex items-center justify-between px-3 py-2 text-[11px] text-gray-400 font-mono rounded-[14px] bg-[#141416] border border-white/[0.06]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
                        Fabric channel: <strong className="text-white ml-0.5">mychannel</strong>
                        <span className="text-gray-500">|</span>
                        <span>State: Org1MSP (Raft Orderer)</span>
                      </span>
                      <button
                        onClick={() => refreshFeed()}
                        className="flex items-center gap-1 hover:text-white transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingFeed ? 'animate-spin text-[#007aff]' : ''}`} />
                        <span>Sync</span>
                      </button>
                    </div>

                    {/* Posts List */}
                    {loadingFeed && posts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-xs gap-2">
                        <div className="w-6 h-6 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" />
                        Synchronising Hyperledger Fabric ledger…
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="py-24 text-center text-xs text-gray-400">
                        No blocks committed yet — be the first to mint a post!
                      </div>
                    ) : (
                      posts.map(post => (
                        <DesktopPostCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onLikeToggle={handleLike}
                          onOpenComments={p => setCommentPost(p)}
                          onOpenLedger={openLedger}
                        />
                      ))
                    )}
                  </>
                )}

                {/* EXPLORE TAB */}
                {tab === 'explore' && (
                  <ExploreView posts={posts} onSelectPost={openLedger} />
                )}

                {/* PROFILE TAB */}
                {tab === 'profile' && (
                  <ProfileView
                    user={currentUser}
                    allUsers={users}
                    posts={posts}
                    currentUser={currentUser}
                    onSwitchUser={u => { setCurrentUser(u); refreshFeed(u.id); }}
                    onSelectPost={openLedger}
                  />
                )}
              </div>
            </main>

            {/* Right: Desktop Inspector Widget Pane */}
            <DesktopInspectorPane
              currentUser={currentUser}
              users={users}
              posts={posts}
              onSelectPost={openLedger}
              onOpenLedger={() => setLedgerOpen(true)}
              onSwitchUser={(u) => { setCurrentUser(u); refreshFeed(u.id); }}
            />
          </div>
        ) : (
          /* ── COMPACT IPAD / IPHONE VIEW ── */
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <StatusBar onDynamicIslandClick={() => setLedgerOpen(true)} />
            <NavHeader
              onOpenLedger={() => setLedgerOpen(true)}
              onOpenActivity={() => setLedgerOpen(true)}
              unread={2}
            />

            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
              {tab === 'feed' && (
                <div>
                  <StoriesBar
                    currentUser={currentUser}
                    onOpenUpload={() => setUploadOpen(true)}
                  />

                  <div className="flex items-center justify-between px-3 py-2 text-[11px] text-gray-400 font-mono border-b border-white/[0.05]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
                      Fabric channel: <strong className="text-white ml-0.5">mychannel</strong>
                    </span>
                    <button onClick={() => refreshFeed()} className="flex items-center gap-1 hover:text-white transition-colors">
                      <RefreshCw className={`w-3 h-3 ${loadingFeed ? 'animate-spin text-[#007aff]' : ''}`} />
                      Sync
                    </button>
                  </div>

                  {posts.map(post => (
                    <DesktopPostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onLikeToggle={handleLike}
                      onOpenComments={p => setCommentPost(p)}
                      onOpenLedger={openLedger}
                    />
                  ))}
                </div>
              )}

              {tab === 'explore' && <ExploreView posts={posts} onSelectPost={openLedger} />}

              {tab === 'profile' && (
                <ProfileView
                  user={currentUser}
                  allUsers={users}
                  posts={posts}
                  currentUser={currentUser}
                  onSwitchUser={u => { setCurrentUser(u); refreshFeed(u.id); }}
                  onSelectPost={openLedger}
                />
              )}
            </main>

            <BottomTabBar
              active={tab}
              onTab={setTab}
              onOpenUpload={() => setUploadOpen(true)}
              currentUser={currentUser}
              blockCount={posts.length + 1}
            />
          </div>
        )}

        {/* ── Dialog Modals ── */}
        <DesktopUploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          currentUser={currentUser}
          onPostCreated={handlePostCreated}
        />

        <LedgerModal
          isOpen={ledgerOpen}
          onClose={() => { setLedgerOpen(false); setSelectedPost(null); }}
          highlightPost={selectedPost}
        />

        <CommentsSheet
          post={commentPost}
          currentUser={currentUser}
          onClose={() => setCommentPost(null)}
          onCommentAdded={() => {
            if (commentPost) {
              setPosts(prev => prev.map(p =>
                p.id === commentPost.id ? { ...p, commentCount: p.commentCount + 1 } : p
              ));
            }
          }}
        />
      </div>
    </div>
  );
}
