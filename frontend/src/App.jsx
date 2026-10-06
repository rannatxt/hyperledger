import { useState, useEffect } from 'react';
import { RefreshCw, Monitor, Layers, Plus, ShieldCheck, Heart, Sparkles } from 'lucide-react';

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
  const [searchQuery,   setSearchQuery]   = useState('');

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

  // ── Delete Post Action (Immediate UI & Ledger removal) ──
  const handleDeletePost = async (postId) => {
    if (!currentUser) return;
    // Optimistic removal from state
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await api.deletePost(postId, currentUser.id);
    } catch (err) {
      console.error('Delete post error on ledger:', err);
      // Revert if failed
      refreshFeed();
      throw err;
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

  // Filter posts by search query if typed
  const displayedPosts = posts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.caption?.toLowerCase().includes(q) ||
      p.authorUsername?.toLowerCase().includes(q) ||
      p.contentHash?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] flex flex-col items-center justify-start p-0 select-none text-[#111111]">
      {/* ── Main Container (Pinterest Clean White Aesthetic) ── */}
      <div
        className={`w-full transition-all duration-300 flex flex-col relative overflow-hidden bg-white ${
          viewMode === 'desktop'
            ? 'h-screen max-w-full'
            : 'max-w-[470px] min-h-screen md:min-h-[880px] md:h-[90vh] md:my-6 md:rounded-[36px] border border-[#EAEAEA] shadow-[0_20px_50px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* ── Pinterest Clean Header ── */}
        {viewMode === 'desktop' ? (
          <DesktopTitleBar
            channelName="mychannel"
            blockHeight={posts.length + 1}
            currentUser={currentUser}
            onRefresh={() => refreshFeed()}
            loadingFeed={loadingFeed}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onOpenLedger={() => setLedgerOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenUpload={() => setUploadOpen(true)}
          />
        ) : (
          <NavHeader
            onOpenLedger={() => setLedgerOpen(true)}
            onOpenActivity={() => setLedgerOpen(true)}
            unread={2}
          />
        )}

        {/* ── DESKTOP SPLIT / MASONRY LAYOUT ── */}
        {viewMode === 'desktop' ? (
          <div className="flex-1 flex overflow-hidden bg-white">
            {/* Left: Navigation Sidebar */}
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

            {/* Center: Pinterest Masonry Scroll Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar bg-white p-4 lg:p-6 border-r border-[#EFEFEF]">
              <div className="max-w-[1280px] mx-auto space-y-5">
                {/* FEED TAB */}
                {tab === 'feed' && (
                  <>
                    <StoriesBar
                      currentUser={currentUser}
                      onOpenUpload={() => setUploadOpen(true)}
                    />

                    {/* Channel Ledger Ticker */}
                    <div className="flex items-center justify-between px-4 py-2.5 text-xs text-[#555555] font-mono rounded-2xl bg-[#F8F8F8] border border-[#EAEAEA]">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#27ae60] animate-pulse" />
                        Fabric channel: <strong className="text-[#111111]">mychannel</strong>
                        <span className="text-gray-300">|</span>
                        <span>Consensus: Raft Orderer · Org1MSP Verified</span>
                      </span>

                      <button
                        onClick={() => refreshFeed()}
                        className="flex items-center gap-1.5 font-bold text-[#111111] hover:text-[#E60023] transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingFeed ? 'animate-spin text-[#E60023]' : ''}`} />
                        <span>Sync</span>
                      </button>
                    </div>

                    {/* Pinterest Masonry Grid of Pin Cards */}
                    {loadingFeed && posts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-[#767676] text-xs gap-3">
                        <div className="w-8 h-8 border-3 border-[#E60023] border-t-transparent rounded-full animate-spin" />
                        <span>Synchronising Hyperledger Fabric blocks…</span>
                      </div>
                    ) : displayedPosts.length === 0 ? (
                      <div className="py-24 text-center space-y-2">
                        <p className="text-sm font-bold text-[#111111]">No pins found</p>
                        <p className="text-xs text-[#767676]">Be the first to publish a verified pin to the ledger!</p>
                        <button
                          onClick={() => setUploadOpen(true)}
                          className="mt-3 px-5 py-2 rounded-full bg-[#E60023] text-white font-bold text-xs shadow-md"
                        >
                          Create Pin
                        </button>
                      </div>
                    ) : (
                      <div className="masonry-columns w-full">
                        {displayedPosts.map(post => (
                          <DesktopPostCard
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            onLikeToggle={handleLike}
                            onOpenComments={p => setCommentPost(p)}
                            onOpenLedger={openLedger}
                            onDeletePost={handleDeletePost}
                          />
                        ))}
                      </div>
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
                    onDeletePost={handleDeletePost}
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
          <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
            <StatusBar onDynamicIslandClick={() => setLedgerOpen(true)} />

            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 bg-white">
              {tab === 'feed' && (
                <div className="p-3">
                  <StoriesBar
                    currentUser={currentUser}
                    onOpenUpload={() => setUploadOpen(true)}
                  />

                  <div className="flex items-center justify-between px-3 py-2 text-[11px] text-[#555555] font-mono border-b border-[#EFEFEF] mb-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#27ae60] animate-pulse" />
                      Fabric: <strong className="text-[#111111]">mychannel</strong>
                    </span>
                    <button onClick={() => refreshFeed()} className="flex items-center gap-1 hover:text-[#E60023] font-bold">
                      <RefreshCw className={`w-3 h-3 ${loadingFeed ? 'animate-spin text-[#E60023]' : ''}`} />
                      Sync
                    </button>
                  </div>

                  <div className="space-y-4">
                    {displayedPosts.map(post => (
                      <DesktopPostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onLikeToggle={handleLike}
                        onOpenComments={p => setCommentPost(p)}
                        onOpenLedger={openLedger}
                        onDeletePost={handleDeletePost}
                      />
                    ))}
                  </div>
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
                  onDeletePost={handleDeletePost}
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
