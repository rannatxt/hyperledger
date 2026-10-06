import { useState, useEffect } from 'react';
import { X, Send, Loader2, ShieldCheck, Heart } from 'lucide-react';
import { api } from '../../services/api';

export default function CommentsSheet({ post, currentUser, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState('');
  const [posting,  setPosting]  = useState(false);

  useEffect(() => {
    if (!post) return;
    setLoading(true);
    api.getComments(post.id)
      .then(res => setComments(res?.comments || res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [post]);

  if (!post) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !currentUser || posting) return;
    setPosting(true);
    try {
      const added = await api.addComment(post.id, currentUser.id, text.trim());
      const cmt = added?.comment ?? added;
      setComments(prev => [...prev, cmt]);
      setText('');
      onCommentAdded?.();
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-[24px] border border-[#DBDBDB] shadow-2xl flex flex-col h-[75vh] max-h-[640px] animate-sheet-up overflow-hidden">
        {/* iOS Drag Handle */}
        <div className="w-full flex justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-9 h-1 bg-[#DBDBDB] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EFEFEF] bg-white">
          <span className="w-6" />
          <span className="text-sm font-bold text-[#262626]">Comments</span>
          <button onClick={onClose} className="p-1 text-[#262626] hover:opacity-70 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of comments */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-white">
          {/* Post Author Caption Row */}
          <div className="flex items-start gap-3 pb-3 border-b border-[#EFEFEF]">
            <img src={post.authorAvatar} alt={post.authorUsername} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-[#262626] mr-1.5">{post.authorUsername}</span>
              <span className="text-xs text-[#262626] leading-relaxed">{post.caption}</span>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#737373]">
                <ShieldCheck className="w-3 h-3 text-[#00BA88]" />
                <span>Block #{post.blockNumber} · Org1MSP Verified</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-[#737373] text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0095F6]" />
              <span>Fetching comments from Fabric ledger…</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8E8E8E]">
              No comments yet. Start the conversation!
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id || Math.random()} className="flex items-start gap-3">
                <img
                  src={c.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                  alt={c.authorUsername}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#262626]">{c.authorUsername}</span>
                    <span className="text-[10px] text-[#8E8E8E] font-mono">Org1MSP</span>
                  </div>
                  <p className="text-xs text-[#262626] mt-0.5 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input form */}
        <form onSubmit={submit} className="p-3 border-t border-[#EFEFEF] bg-white flex items-center gap-2.5">
          {currentUser && (
            <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          )}
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 bg-[#FAFAFA] px-3.5 py-2 rounded-full text-xs text-[#262626] placeholder:text-[#8E8E8E] outline-none border border-[#E5E5E5] focus:border-[#0095F6]"
          />
          <button
            type="submit"
            disabled={!text.trim() || posting}
            className={`text-xs font-bold px-2 py-1 transition-colors ${
              text.trim() && !posting
                ? 'text-[#0095F6] hover:text-[#1877F2] active:scale-95'
                : 'text-[#DBDBDB] cursor-not-allowed'
            }`}
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin text-[#0095F6]" /> : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
