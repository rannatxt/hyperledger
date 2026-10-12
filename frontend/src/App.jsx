import { useState, useEffect } from 'react';
import { RefreshCw, Smartphone, Monitor } from 'lucide-react';

import DesktopTitleBar      from './components/desktop/DesktopTitleBar';
import DesktopSidebar       from './components/desktop/DesktopSidebar';
import DesktopInspectorPane from './components/desktop/DesktopInspectorPane';

import StatusBar            from './components/ios/StatusBar';
import NavHeader            from './components/ios/NavHeader';
import StoriesBar           from './components/ios/StoriesBar';
import PostCard             from './components/ios/PostCard';
import BottomTabBar         from './components/ios/BottomTabBar';
import LedgerModal          from './components/ios/LedgerModal';
import CommentsSheet        from './components/ios/CommentsSheet';
import ProfileView          from './components/ios/ProfileView';
import ExploreView          from './components/ios/ExploreView';
import UploadSheet          from './components/ios/UploadSheet';
import PostAcceptedToast    from './components/ios/PostAcceptedToast';
import PostDetailsModal     from './components/common/PostDetailsModal';
import InstagramAuthModal   from './components/common/InstagramAuthModal';

import { api } from './services/api';
import { getDevicePosts, deletePostFromDevice, savePostToDevice } from './services/localStorageService';

const DEFAULT_USERS = [
  {
    id: 'user_ranna',
    username: 'ranna',
    displayName: 'Raana Nayak',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Decentralized media creator & core architect on Hyperledger Fabric ⛓️',
    followerCount: 284,
    followingCount: 142,
    mspId: 'Org1MSP'
  },
  {
    id: 'user_teacher_eva',
    username: 'teacher_eva',
    displayName: 'Professor Eva',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    bio: 'Blockchain educator & verified cryptography instructor · Org1MSP',
    followerCount: 420,
    followingCount: 180,
    mspId: 'Org1MSP'
  },
  {
    id: 'user_megha',
    username: 'megha',
    displayName: 'Megha',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Decentralized content contributor & peer validator · Org1MSP',
    followerCount: 310,
    followingCount: 115,
    mspId: 'Org1MSP'
  },
  {
    id: 'user_hyper',
    username: 'hyper_peer',
    displayName: 'HyperPeer Node',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bio: 'Core consensus validator & state synchronization peer on channel mychannel',
    followerCount: 1042,
    followingCount: 18,
    mspId: 'Org1MSP'
  }
];

export default function App() {
  const [tab,           setTab]           = useState('feed'); // 'feed' | 'explore' | 'activity' | 'profile'
  // Load view mode from localStorage, default to desktop view
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = window.localStorage.getItem('viewMode');
      return saved === 'mobile-ios' ? 'mobile-ios' : 'desktop-ios';
    } catch {
      return 'desktop-ios';
    }
  });

  // Sync viewMode changes to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem('viewMode', viewMode);
    } catch {}
  }, [viewMode]);
  const [posts,         setPosts]         = useState([]);
  const [users,         setUsers]         = useState(DEFAULT_USERS);
  const [currentUser,   setCurrentUser]   = useState(() => {
    try {
      const saved = window.localStorage.getItem('instaledger_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.id || parsed.username) && parsed.username !== 'elena_crypto' && parsed.username !== 'marcus_art') {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_USERS[0];
  });
  const [loadingFeed,   setLoadingFeed]   = useState(true);
  const [searchQuery,   setSearchQuery]   = useState('');

  // Modals & Notifications
  const [uploadOpen,    setUploadOpen]    = useState(false);
  const [ledgerOpen,    setLedgerOpen]    = useState(false);
  const [commentPost,   setCommentPost]   = useState(null);
  const [selectedPost,  setSelectedPost]  = useState(null);
  const [detailsPost,   setDetailsPost]   = useState(null);
  const [acceptedPost,  setAcceptedPost]  = useState(null);
  const [authOpen,      setAuthOpen]      = useState(false);
  const [authView,      setAuthView]      = useState('switcher'); // 'switcher' | 'add-account' | 'login' | 'signup'

  const openAccountSwitcher = (view = 'switcher') => {
    setAuthView(view);
    setAuthOpen(true);
  };

  // Handle logout: clear session and go back to auth/login modal
  const handleLogout = () => {
    setCurrentUser(null);
    setPosts([]);
    try {
      window.localStorage.removeItem('instaledger_auth_user');
      window.localStorage.removeItem('instaledger_token');
    } catch {}
    // Reopen auth modal in login view so user sees Instagram login screen
    setAuthView('login');
    setAuthOpen(true);
  };

  const isDesktop = viewMode === 'desktop-ios' || viewMode === 'desktop';

  // ── Init: Load local phone storage (IndexedDB) & backend users ──
  useEffect(() => {
    const init = async () => {
      // 1. Load posts saved locally on the user's phone / browser
      try {
        const localPosts = await getDevicePosts();
        if (localPosts && localPosts.length > 0) {
          setPosts(localPosts);
        }
      } catch (err) {
        console.warn('Local device storage load warning:', err);
      }

      // 2. Fetch users and active identities
      try {
        const loadedUsers = await api.getUsers();
        const rawUserList = loadedUsers?.users || loadedUsers;
        const userList = (Array.isArray(rawUserList) ? rawUserList : []).filter(
          u => u && u.username !== 'elena_crypto' && u.username !== 'marcus_art'
        );
        if (userList.length > 0) {
          setUsers(userList);
          try {
            const saved = window.localStorage.getItem('instaledger_auth_user');
            if (saved) {
              const parsed = JSON.parse(saved);
              const found = userList.find(u => u.id === parsed?.id || u.username === parsed?.username);
              if (found) {
                setCurrentUser(found);
                return;
              }
            }
          } catch {}
          setCurrentUser(prev => (prev && prev.username !== 'elena_crypto' && prev.username !== 'marcus_art') ? prev : userList[0]);
        }
      } catch (err) {
        console.warn('Using offline fallback identities:', err);
      }
    };
    init();
  }, []);

  // ── Load & sync feed with local phone storage ──
  const refreshFeed = async (uid) => {
    setLoadingFeed(true);
    try {
      const viewerId = uid || currentUser?.id;
      let serverPosts = [];
      try {
        const result = await api.getFeed(viewerId);
        serverPosts = result?.posts || result || [];
      } catch (apiErr) {
        console.warn('API getFeed offline/fallback:', apiErr);
      }

      // Get posts stored on device
      const devicePosts = await getDevicePosts();

      // Merge unique posts by ID: local phone uploads take precedence
      const mergedMap = new Map();
      devicePosts.forEach(p => mergedMap.set(p.id, p));
      serverPosts.forEach(p => {
        if (!mergedMap.has(p.id)) {
          mergedMap.set(p.id, p);
        } else {
          // Keep local media data URLs — they contain actual blob data the server doesn't have
          const local = mergedMap.get(p.id);
          mergedMap.set(p.id, {
            ...local,
            ...p,
            // Always preserve local data URLs so media displays correctly
            previewUrl: local.previewUrl || p.previewUrl,
            imageUrl: (local.imageUrl && local.imageUrl.startsWith('data:')) ? local.imageUrl : (p.imageUrl || local.imageUrl),
            videoUrl: (local.videoUrl && local.videoUrl.startsWith('data:')) ? local.videoUrl : (p.videoUrl || local.videoUrl),
            thumbnailUrl: local.thumbnailUrl || p.thumbnailUrl,
            mediaUrl: (local.previewUrl || (local.mediaUrl && local.mediaUrl.startsWith('data:'))) ? (local.previewUrl || local.mediaUrl) : (p.mediaUrl || local.mediaUrl),
          });
        }
      });


      const combined = Array.from(mergedMap.values());
      // Sort newest first
      combined.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      setPosts(combined);
    } catch (err) {
      console.error('Feed refresh error:', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      refreshFeed(currentUser.id);
    }
  }, [currentUser?.id]);

  // ── Like toggle ──
  const handleLike = async (postId) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked = !p.isLikedByViewer;
      const updated = {
        ...p,
        isLikedByViewer: liked,
        likeCount: liked ? (p.likeCount || 0) + 1 : Math.max(0, (p.likeCount || 0) - 1)
      };
      // Persist like status to local storage
      savePostToDevice(updated).catch(() => {});
      return updated;
    }));

    try {
      await api.toggleLike(postId, currentUser.id);
    } catch (err) {
      console.warn('Like sync warning:', err);
    }
  };

  // ── Delete Post Action (Immediate UI & Local Device Removal) ──
  const handleDeletePost = async (postId) => {
    // 1. Optimistic removal from UI state
    setPosts(prev => prev.filter(p => p.id !== postId));

    // 2. Permanently delete from local phone storage (IndexedDB)
    try {
      await deletePostFromDevice(postId);
    } catch (e) {
      console.warn('Error deleting from device storage:', e);
    }

    // 3. Submit deletion to Hyperledger Fabric ledger
    try {
      await api.deletePost(postId, currentUser?.id);
    } catch (err) {
      console.warn('Ledger delete warning:', err);
    }
  };

  // ── Post Created Action: Accept to Ledger & Show Confirmation Toast ──
  const handlePostCreated = (newPost) => {
    if (newPost) {
      setPosts(prev => [newPost, ...prev.filter(p => p.id !== newPost.id)]);
      // Display immediate blockchain verification confirmation
      setAcceptedPost(newPost);
      // Auto dismiss after 7 seconds
      setTimeout(() => {
        setAcceptedPost(current => (current?.id === newPost.id ? null : current));
      }, 7000);
    }
    setTab('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLedger = (post) => {
    setSelectedPost(post || null);
    setLedgerOpen(true);
  };

  // Search filter
  const displayedPosts = posts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.caption?.toLowerCase().includes(q) ||
      p.authorUsername?.toLowerCase().includes(q) ||
      p.contentHash?.toLowerCase().includes(q)
    );
  });

  // If all accounts log out, render authentic Instagram Login/Signup landing page directly
  if (!currentUser) {
    return (
      <div className="w-full min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <InstagramAuthModal
          isOpen={true}
          initialView="login"
          currentUser={null}
          allUsers={users}
          onClose={() => {
            const fallbackUser = users[0] || DEFAULT_USERS[0];
            setCurrentUser(fallbackUser);
            try {
              window.localStorage.setItem('instaledger_auth_user', JSON.stringify(fallbackUser));
            } catch (e) {}
            refreshFeed(fallbackUser.id);
            setAuthOpen(false);
          }}
          onSwitchUser={(u) => {
            setCurrentUser(u);
            try {
              window.localStorage.setItem('instaledger_auth_user', JSON.stringify(u));
            } catch (e) {}
            refreshFeed(u.id);
            setAuthOpen(false);
          }}
          onAuthSuccess={(u, token) => {
            setCurrentUser(u);
            try {
              window.localStorage.setItem('instaledger_auth_user', JSON.stringify(u));
            } catch (e) {}
            refreshFeed(u.id);
            setAuthOpen(false);
          }}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] flex flex-col items-center justify-start p-0 select-none text-[#262626] font-sans">
      {/* ── Blockchain Acceptance Confirmation Toast ── */}
      <PostAcceptedToast
        post={acceptedPost}
        onClose={() => setAcceptedPost(null)}
        onInspectLedger={(post) => openLedger(post)}
      />

      {/* ── Main Container: Default iOS Desktop View vs Authentic Framed Mobile Simulator ── */}
      <div
        className={`w-full transition-all duration-300 flex flex-col relative overflow-hidden bg-white ${
          isDesktop
            ? 'h-screen max-w-full'
            : 'max-w-[440px] min-h-screen md:min-h-[850px] md:h-[92vh] md:my-5 md:rounded-[46px] border-[10px] md:border-[12px] border-[#1C1C1E] shadow-[0_25px_60px_rgba(0,0,0,0.18)]'
        }`}
      >
        {/* ── Mobile View Top Switcher Banner (when in phone simulator mode) ── */}
        {!isDesktop && (
          <div className="w-full bg-[#F8F9FA] px-4 py-2 border-b border-[#EAEAEA] flex items-center justify-between text-xs font-sans">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#737373]">
              <Smartphone className="w-3.5 h-3.5 text-[#0095F6]" />
              <span>iPhone 16 Pro View</span>
            </span>
            <button
              onClick={() => setViewMode('desktop-ios')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0095F6] hover:bg-[#1877F2] text-white text-[11px] font-semibold transition-all shadow-xs active:scale-95"
              title="Switch to iOS Desktop View"
            >
              <Monitor className="w-3 h-3" />
              <span>Desktop View</span>
            </button>
          </div>
        )}

        {/* ── Top Navigation Bar ── */}
        {isDesktop ? (
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
            onOpenAccountSwitcher={openAccountSwitcher}
          />
        ) : (
          <>
            <StatusBar onDynamicIslandClick={() => setLedgerOpen(true)} />
            <NavHeader
              currentUser={currentUser}
              onOpenAccountSwitcher={openAccountSwitcher}
              onOpenLedger={() => setLedgerOpen(true)}
              onOpenActivity={() => setLedgerOpen(true)}
              onOpenUpload={() => setUploadOpen(true)}
              onRefresh={() => refreshFeed()}
              loadingFeed={loadingFeed}
              unread={1}
              onToggleViewMode={() => setViewMode('desktop-ios')}
            />
          </>
        )}

        {/* ── DEFAULT IOS DESKTOP VIEW (Photo 5 Workspace) ── */}
        {isDesktop ? (
          <div className="flex-1 flex overflow-hidden bg-[#FAFAFA]">
            {/* Left: Fixed-width Sidebar Navigation */}
            <DesktopSidebar
              activeTab={tab}
              setActiveTab={setTab}
              currentUser={currentUser}
              users={users}
              onSwitchUser={(u) => { setCurrentUser(u); refreshFeed(u.id); }}
              onOpenUpload={() => setUploadOpen(true)}
              onOpenLedger={() => setLedgerOpen(true)}
              onOpenAccountSwitcher={openAccountSwitcher}
              blockCount={posts.length + 104}
            />

            {/* Center: Desktop Workspace Feed Area with Clean Shadows, White Background, and Smooth Padding */}
            <main className="flex-1 overflow-y-auto no-scrollbar bg-[#F8F9FA] flex justify-center py-6 px-4 md:px-8">
              <div className="w-full max-w-[620px] bg-[#FFFFFF] rounded-2xl border border-[#E5E5E5] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4 sm:p-6 space-y-5">
                {/* FEED TAB */}
                {tab === 'feed' && (
                  <>
                    {/* Story Tray at Top of Feed */}
                    <StoriesBar
                      currentUser={currentUser}
                      onOpenUpload={() => setUploadOpen(true)}
                    />

                    {/* Single-Column Feed */}
                    {loadingFeed && posts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-[#8E8E8E] text-xs gap-3">
                        <div className="w-7 h-7 border-2 border-[#0095F6] border-t-transparent rounded-full animate-spin" />
                        <span>Synchronising Hyperledger Fabric feed…</span>
                      </div>
                    ) : displayedPosts.length === 0 ? (
                      <div className="py-24 text-center space-y-2">
                        <p className="text-sm font-bold text-[#262626]">No Posts Yet</p>
                        <p className="text-xs text-[#737373]">Share your photos or video reels to the Fabric ledger!</p>
                        <button
                          onClick={() => setUploadOpen(true)}
                          className="mt-3 px-4 py-2 rounded-lg bg-[#0095F6] text-white font-semibold text-xs shadow-xs hover:bg-[#1877F2]"
                        >
                          Create Post
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 pb-6">
                        {displayedPosts.map(post => (
                          <PostCard
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
                  <ExploreView
                    posts={posts}
                    onSelectPost={(post) => setDetailsPost(post)}
                    onOpenLedger={openLedger}
                    onOpenComments={p => setCommentPost(p)}
                  />
                )}

                {/* ACTIVITY / LEDGER TAB */}
                {tab === 'activity' && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] text-center space-y-2">
                      <h3 className="text-sm font-bold text-[#262626]">Hyperledger Activity & Endorsements</h3>
                      <p className="text-xs text-[#737373]">
                        All transactions, endorsements, and duplicate checks are logged immutably on channel <strong>mychannel</strong>.
                      </p>
                      <button
                        onClick={() => setLedgerOpen(true)}
                        className="px-4 py-2 rounded-lg bg-[#0095F6] text-white text-xs font-semibold hover:bg-[#1877F2] transition-colors"
                      >
                        Open Ledger Explorer
                      </button>
                    </div>
                  </div>
                )}

                {/* PROFILE TAB (3-Column Square Grid) */}
                {tab === 'profile' && (
                  <ProfileView
                    user={currentUser}
                    allUsers={users}
                    posts={posts}
                    currentUser={currentUser}
                    onSwitchUser={u => { setCurrentUser(u); refreshFeed(u.id); }}
                    onSelectPost={(post) => setDetailsPost(post)}
                    onDeletePost={handleDeletePost}
                    onOpenAccountSwitcher={openAccountSwitcher}
                  />
                )}
              </div>
            </main>

            {/* Right: Desktop Inspector & Accounts Sidebar */}
            <DesktopInspectorPane
              currentUser={currentUser}
              users={users}
              posts={posts}
              onSelectPost={(post) => setDetailsPost(post)}
              onOpenLedger={() => setLedgerOpen(true)}
              onSwitchUser={(u) => { setCurrentUser(u); refreshFeed(u.id); }}
              onOpenAccountSwitcher={openAccountSwitcher}
            />
          </div>
        ) : (
          /* ── AUTHENTIC FRAMED IOS PHONE SIMULATOR VIEW ── */
          <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
            <main className="flex-1 overflow-y-auto no-scrollbar pb-20 bg-white">
              {tab === 'feed' && (
                <>
                  <StoriesBar
                    currentUser={currentUser}
                    onOpenUpload={() => setUploadOpen(true)}
                  />

                  {loadingFeed && posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-[#8E8E8E] text-xs gap-3">
                      <div className="w-6 h-6 border-2 border-[#0095F6] border-t-transparent rounded-full animate-spin" />
                      <span>Loading feed…</span>
                    </div>
                  ) : displayedPosts.length === 0 ? (
                    <div className="py-24 text-center space-y-2 px-4">
                      <p className="text-sm font-bold text-[#262626]">No Posts Yet</p>
                      <p className="text-xs text-[#737373]">Post a photo or video — it will be registered on the Hyperledger Fabric Decentralized Ledger State!</p>
                      <button
                        onClick={() => setUploadOpen(true)}
                        className="mt-3 px-4 py-2 rounded-lg bg-[#0095F6] text-white font-semibold text-xs shadow-xs"
                      >
                        Create Post
                      </button>
                    </div>
                  ) : (
                    <div>
                      {displayedPosts.map(post => (
                        <PostCard
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

              {tab === 'explore' && (
                <ExploreView
                  posts={posts}
                  onSelectPost={(post) => setDetailsPost(post)}
                  onOpenLedger={openLedger}
                  onOpenComments={p => setCommentPost(p)}
                />
              )}

              {tab === 'activity' && (
                <div className="p-4 space-y-3">
                  <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-center space-y-2">
                    <p className="text-xs font-bold text-[#262626]">Fabric Ledger Status</p>
                    <p className="text-[11px] text-[#737373]">Raft Consensus · Org1MSP Verified Endorsements</p>
                    <button
                      onClick={() => setLedgerOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#0095F6] text-white text-xs font-semibold"
                    >
                      Inspect Blocks
                    </button>
                  </div>
                </div>
              )}

              {tab === 'profile' && (
                <ProfileView
                  user={currentUser}
                  allUsers={users}
                  posts={posts}
                  currentUser={currentUser}
                  onSwitchUser={u => { setCurrentUser(u); refreshFeed(u.id); }}
                  onSelectPost={(post) => setDetailsPost(post)}
                  onDeletePost={handleDeletePost}
                  onOpenAccountSwitcher={openAccountSwitcher}
                />
              )}
            </main>

            {/* iOS Frosted-Glass Bottom Tab Bar */}
            <BottomTabBar
              active={tab}
              onTab={setTab}
              onOpenUpload={() => setUploadOpen(true)}
              currentUser={currentUser}
              unreadActivity={1}
              onOpenAccountSwitcher={openAccountSwitcher}
            />
          </div>
        )}

        {/* ── Native Modals & Sheets ── */}
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

        <PostDetailsModal
          post={detailsPost}
          isOpen={!!detailsPost}
          onClose={() => setDetailsPost(null)}
          currentUser={currentUser}
          onLikeToggle={handleLike}
          onOpenLedger={(post) => {
            setDetailsPost(null);
            openLedger(post);
          }}
        />

        <CommentsSheet
          post={commentPost}
          currentUser={currentUser}
          onClose={() => setCommentPost(null)}
          onCommentAdded={() => {
            if (commentPost) {
              setPosts(prev => prev.map(p =>
                p.id === commentPost.id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
              ));
            }
          }}
        />

        {/* ── Instagram Authentic Multi-User Auth Modal (Photos 4, 5, 6, 7) ── */}
        <InstagramAuthModal
          isOpen={authOpen}
          initialView={authView}
          currentUser={currentUser}
          allUsers={users}
          onClose={() => setAuthOpen(false)}
          onSwitchUser={(u) => {
            setCurrentUser(u);
            try {
              window.localStorage.setItem('instaledger_auth_user', JSON.stringify(u));
            } catch (e) {}
            refreshFeed(u.id);
          }}
          onAuthSuccess={(u, token) => {
            setCurrentUser(u);
            try {
              window.localStorage.setItem('instaledger_auth_user', JSON.stringify(u));
            } catch (e) {}
            refreshFeed(u.id);
            api.getUsers().then(list => {
              const uList = list?.users || list;
              if (Array.isArray(uList) && uList.length > 0) {
                setUsers(uList.filter(u => u && u.username !== 'elena_crypto' && u.username !== 'marcus_art'));
              }
            }).catch(() => {});
          }}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}
