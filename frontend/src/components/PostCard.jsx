import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { formatTimestamp, truncateCid, copyToClipboard } from '../utils/helpers';
import { api } from '../services/api';

export default function PostCard({
  post,
  currentUser,
  onOpenLedgerTx,
  onAuthorClick,
  isDark
}) {
  const [liked, setLiked] = useState(post.isLikedByViewer || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCopiedCid, setIsCopiedCid] = useState(false);
  const [saved, setSaved] = useState(false);

  // Handle Like / Unlike
  const handleToggleLike = async () => {
    if (!currentUser) return;
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (newLikedState) {
        await api.likePost(post.id, currentUser.id);
      } else {
        await api.unlikePost(post.id, currentUser.id);
      }
    } catch (err) {
      console.error('Like toggle failed on ledger:', err);
      // Revert optimistic update
      setLiked(!newLikedState);
      setLikeCount(prev => (!newLikedState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  // Double-tap photo to like
  const handleDoubleTap = () => {
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
    if (!liked) {
      handleToggleLike();
    }
  };

  // Load comments
  const handleToggleComments = async () => {
    if (!showComments) {
      try {
        const list = await api.getComments(post.id);
        setComments(list);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      }
    }
    setShowComments(!showComments);
  };

  // Submit comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await api.addComment(post.id, currentUser.id, commentText.trim());
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setShowComments(true);
    } catch (err) {
      console.error('Failed to post comment to ledger:', err);
      alert('Error committing comment to ledger: ' + err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Copy IPFS CID
  const handleCopyCid = async () => {
    const ok = await copyToClipboard(post.contentHash);
    if (ok) {
      setIsCopiedCid(true);
      setTimeout(() => setIsCopiedCid(false), 2000);
    }
  };

  return (
    <article className={`w-full max-w-[470px] mx-auto border rounded-xl overflow-hidden mb-6 transition-colors ${
      isDark ? 'bg-black border-[#262626]' : 'bg-white border-[#dbdbdb] shadow-sm'
    }`}>
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onAuthorClick(post.authorId)}
            className="w-10 h-10 rounded-full p-[2px] story-gradient cursor-pointer"
          >
            <div className={`w-full h-full rounded-full p-0.5 ${isDark ? 'bg-black' : 'bg-white'}`}>
              <img
                src={post.authorAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + post.authorUsername}
                alt={post.authorUsername}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <span 
                onClick={() => onAuthorClick(post.authorId)}
                className="font-bold text-sm hover:underline cursor-pointer tracking-tight"
              >
                {post.authorUsername}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue fill-brand-blue" />
              <span className="text-gray-500 text-xs">• {formatTimestamp(post.timestamp)}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Org1MSP · Fabric Block Verified</span>
            </div>
          </div>
        </div>

        {/* Ledger Proof Button */}
        <button
          onClick={() => onOpenLedgerTx(post)}
          className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 font-medium transition-all ${
            isDark 
              ? 'border-[#333] hover:border-brand-blue text-gray-300 hover:text-white bg-[#141414]' 
              : 'border-gray-200 hover:border-brand-blue text-gray-600 hover:text-black bg-gray-50'
          }`}
          title="Inspect blockchain block proof"
        >
          <span>Ledger Proof</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Media View */}
      <div 
        onDoubleClick={handleDoubleTap}
        className="relative w-full aspect-square bg-[#0a0a0a] flex items-center justify-center overflow-hidden cursor-pointer select-none"
      >
        <img
          src={post.mediaUrl || `/api/ipfs/${post.contentHash}`}
          alt={post.caption || 'Decentralized media'}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Double-tap heart animation */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl animate-heart-burst" />
          </div>
        )}
      </div>

      {/* Post Action Buttons */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleLike}
              className="group focus:outline-none transition-transform active:scale-125"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  liked
                    ? 'text-brand-red fill-brand-red'
                    : isDark ? 'text-white hover:text-gray-400' : 'text-black hover:text-gray-600'
                }`}
              />
            </button>

            <button
              onClick={handleToggleComments}
              className={`focus:outline-none transition-colors ${
                isDark ? 'text-white hover:text-gray-400' : 'text-black hover:text-gray-600'
              }`}
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            <button
              onClick={handleCopyCid}
              className={`focus:outline-none transition-colors ${
                isDark ? 'text-white hover:text-gray-400' : 'text-black hover:text-gray-600'
              }`}
              title="Copy IPFS Share Link"
            >
              <Send className="w-5 h-5 -rotate-12" />
            </button>
          </div>

          <button
            onClick={() => setSaved(!saved)}
            className="focus:outline-none"
          >
            <Bookmark
              className={`w-6 h-6 ${
                saved
                  ? isDark ? 'text-white fill-white' : 'text-black fill-black'
                  : isDark ? 'text-white' : 'text-black'
              }`}
            />
          </button>
        </div>

        {/* IPFS CID Badge */}
        <div className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg mb-2 ${
          isDark ? 'bg-[#161616] text-gray-300' : 'bg-gray-100 text-gray-700'
        }`}>
          <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
            <span className="font-bold text-pink-500">IPFS:</span>
            <span className="truncate">{post.contentHash}</span>
          </div>
          <button
            onClick={handleCopyCid}
            className="flex items-center gap-1 text-[10px] text-brand-blue hover:underline ml-2 flex-shrink-0"
          >
            {isCopiedCid ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy CID</span>
              </>
            )}
          </button>
        </div>

        {/* Like Count */}
        <div className="font-semibold text-sm mb-1.5">
          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          <span className="text-[11px] font-normal text-gray-400 ml-1.5">(On-Chain)</span>
        </div>

        {/* Caption */}
        <div className="text-sm mb-1.5 leading-snug">
          <span 
            onClick={() => onAuthorClick(post.authorId)}
            className="font-bold mr-2 hover:underline cursor-pointer"
          >
            {post.authorUsername}
          </span>
          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
            {post.caption}
          </span>
        </div>

        {/* Comments Count Toggle */}
        <button
          onClick={handleToggleComments}
          className="text-xs text-gray-500 font-medium mb-2 hover:underline block"
        >
          {showComments
            ? 'Hide comments'
            : comments.length > 0
            ? `View all ${comments.length} comments`
            : post.commentCount > 0
            ? `View ${post.commentCount} comments`
            : 'Add a comment...'}
        </button>

        {/* Comments List */}
        {showComments && (
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
            {comments.map((cmt) => (
              <div key={cmt.id} className="text-xs flex items-start gap-2 leading-tight">
                <img
                  src={cmt.authorAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + cmt.authorUsername}
                  alt={cmt.authorUsername}
                  className="w-5 h-5 rounded-full object-cover mt-0.5"
                />
                <div>
                  <span className="font-bold mr-1.5">{cmt.authorUsername}</span>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{cmt.text}</span>
                  <span className="text-[10px] text-gray-500 ml-2">{formatTimestamp(cmt.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment Input */}
        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-2 border-t border-[#262626]/40">
          <input
            type="text"
            placeholder="Add a comment on ledger..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className={`w-full text-xs bg-transparent focus:outline-none placeholder-gray-500 ${
              isDark ? 'text-white' : 'text-black'
            }`}
          />
          {commentText.trim() && (
            <button
              type="submit"
              disabled={isSubmittingComment}
              className="text-xs font-bold text-brand-blue hover:text-brand-hover disabled:opacity-50 flex-shrink-0"
            >
              {isSubmittingComment ? 'Mining...' : 'Post'}
            </button>
          )}
        </form>
      </div>
    </article>
  );
}
