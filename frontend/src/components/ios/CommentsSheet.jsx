import { useState, useEffect } from 'react';
import { X, Send, Loader2, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] border border-[#EAEAEA] shadow-2xl flex flex-col h-[75vh] max-h-[640px] animate-sheet-up overflow-hidden">
        {/* Grabber */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EFEFEF] bg-white">
          <span className="w-6" />
          <span className="text-sm font-bold text-[#111111]">Comments on Pin</span>
          <button onClick={onClose} className="p-1 text-[#767676] hover:text-[#111111] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-white">
          {/* Original caption */}
          <div className="flex items-start gap-3 pb-3 border-b border-[#EFEFEF]">
            <img src={post.authorAvatar} alt={post.authorUsername} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-[#111111] mr-1.5">{post.authorUsername}</span>
              <span className="text-xs text-[#333333] leading-relaxed">{post.caption}</span>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#767676]">
                <ShieldCheck className="w-3 h-3 text-[#27ae60]" />
                <span>Block #{post.blockNumber} · Org1MSP Verified</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-[#767676] text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
              <span>Fetching ledger comments…</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#767676]">
              No comments yet — be the first to comment on this block!
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id || Math.random()} className="flex items-start gap-3">
                <img
                  src={c.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                  alt={c.authorUsername}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#111111]">{c.authorUsername}</span>
                    <span className="text-[10px] text-[#767676] font-mono">Org1MSP</span>
                  </div>
                  <p className="text-xs text-[#222222] mt-0.5 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={submit} className="p-3 border-t border-[#EFEFEF] bg-white flex items-center gap-2">
          {currentUser && (
            <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          )}
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a comment to this block…"
            className="flex-1 bg-[#F0F0F0] px-4 py-2 rounded-full text-xs text-[#111111] placeholder:text-[#767676] outline-none focus:bg-white focus:ring-2 focus:ring-[#E60023]/20"
          />
          <button
            type="submit"
            disabled={!text.trim() || posting}
            className={`p-2 rounded-full transition-all ${
              text.trim() && !posting
                ? 'bg-[#E60023] text-white hover:bg-[#AD081B] active:scale-95'
                : 'bg-[#F0F0F0] text-gray-400 cursor-not-allowed'
            }`}
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
