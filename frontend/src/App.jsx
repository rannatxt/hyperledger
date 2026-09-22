import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

import StatusBar       from './components/ios/StatusBar';
import NavHeader       from './components/ios/NavHeader';
import StoriesBar      from './components/ios/StoriesBar';
import PostCard        from './components/ios/PostCard';
import BottomTabBar    from './components/ios/BottomTabBar';
import UploadSheet     from './components/ios/UploadSheet';
import LedgerModal     from './components/ios/LedgerModal';
import CommentsSheet   from './components/ios/CommentsSheet';
import ProfileView     from './components/ios/ProfileView';
import ExploreView     from './components/ios/ExploreView';

import { api } from './services/api';

export default function App() {
  const [tab,           setTab]           = useState('feed');
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
    // Optimistic update
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
    <div className="min-h-screen bg-black flex justify-center select-none">
      {/* iPhone device frame — max 470px */}
      <div className="w-full max-w-[470px] min-h-screen bg-black border-x border-white/[0.07] flex flex-col relative overflow-hidden shadow-[0_0_60px_rgba(0,122,255,0.06)]">

        {/* ── iOS Status Bar ── */}
        <StatusBar onDynamicIslandClick={() => setLedgerOpen(true)} />

        {/* ── Navigation Header ── */}
        <NavHeader
          onOpenLedger={() => setLedgerOpen(true)}
          onOpenActivity={() => setLedgerOpen(true)}
          unread={2}
        />

        {/* ── Main Scroll Area ── */}
        <main className="flex-1 overflow-y-auto no-scrollbar">

          {/* FEED TAB */}
          {tab === 'feed' && (
            <div className="pb-28">
              <StoriesBar
                currentUser={currentUser}
                onOpenUpload={() => setUploadOpen(true)}
              />

              {/* Ledger sync row */}
              <div className="flex items-center justify-between px-3 py-2 text-[11px] text-ios-gray1 font-mono border-b border-white/[0.05]">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-green" />
                  Fabric channel: <strong className="text-white ml-0.5">mychannel</strong>
                </span>
                <button onClick={() => refreshFeed()} className="flex items-center gap-1 hover:text-white transition-colors">
                  <RefreshCw className={`w-3 h-3 ${loadingFeed ? 'animate-spin text-ios-blue' : ''}`} />
                  Sync
                </button>
              </div>

              {/* Posts */}
              {loadingFeed && posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-ios-gray1 text-xs gap-2">
                  <div className="w-6 h-6 border-2 border-ios-blue border-t-transparent rounded-full animate-spin" />
                  Synchronising Hyperledger Fabric ledger…
                </div>
              ) : posts.length === 0 ? (
                <p className="py-24 text-center text-xs text-ios-gray1">No blocks committed yet — be the first to mint a post!</p>
              ) : (
                posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onLikeToggle={handleLike}
                    onOpenComments={p => setCommentPost(p)}
                    onOpenLedger={openLedger}
                  />
                ))
              )}
            </div>
          )}

          {/* EXPLORE TAB */}
          {tab === 'explore' && (
            <ExploreView posts={posts} onSelectPost={openLedger} />
          )}

          {/* LEDGER TAB */}
          {tab === 'ledger' && (
            <div className="pb-28">
              <div className="p-4 text-center">
                <button onClick={() => setLedgerOpen(true)}
                  className="px-5 py-2.5 bg-ios-blue text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 active:scale-95 transition-transform mb-4">
                  Open Blockchain Inspector
                </button>
              </div>
              <ExploreView posts={posts} onSelectPost={openLedger} />
            </div>
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
        </main>

        {/* ── Frosted Acrylic Bottom Navigation ── */}
        <BottomTabBar
          active={tab}
          onTab={setTab}
          onOpenUpload={() => setUploadOpen(true)}
          currentUser={currentUser}
          blockCount={posts.length + 1}
        />

        {/* ── Modals ── */}
        <UploadSheet
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
