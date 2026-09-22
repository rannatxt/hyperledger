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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#161616] ios-sheet border-t border-white/10 shadow-2xl flex flex-col h-[75vh] animate-sheet-up">
        {/* Grabber */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-600/60 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08]">
          <span className="w-6" />
          <span className="text-sm font-bold">Comments</span>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Original caption */}
          <div className="flex items-start gap-3 pb-3 border-b border-white/[0.06]">
            <img src={post.authorAvatar} alt={post.authorUsername} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            <div className="text-[13px] leading-relaxed">
              <span className="font-bold mr-1.5">{post.authorUsername}</span>
              <span className="text-gray-200">{post.caption}</span>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-ios-gray1 font-mono">
                <ShieldCheck className="w-3 h-3 text-ios-blue" /> Original Ledger Caption
              </div>
            </div>
          </div>

          {loading
            ? <div className="flex items-center justify-center py-12 text-gray-500 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-ios-blue" /> Fetching from world state…
              </div>
            : comments.length === 0
              ? <p className="text-center py-12 text-xs text-gray-500">No comments yet — start the decentralised conversation!</p>
              : comments.map(cmt => (
                <div key={cmt.id ?? cmt._id} className="flex items-start gap-3">
                  <img src={cmt.authorAvatar} alt={cmt.authorUsername} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 text-[13px] leading-relaxed">
                    <span className="font-bold mr-1.5">{cmt.authorUsername}</span>
                    <span className="text-gray-200">{cmt.text}</span>
                  </div>
                </div>
              ))
          }
        </div>

        {/* Input */}
        <form onSubmit={submit} className="p-3 bg-black/80 border-t border-white/10 flex items-center gap-2">
          <img src={currentUser?.avatarUrl} alt={currentUser?.username} className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0" />
          <input type="text" value={text} onChange={e => setText(e.target.value)}
            placeholder={`Add a comment as @${currentUser?.username}…`}
            className="flex-1 bg-[#1c1c1e] border border-white/10 rounded-full px-4 py-2 text-[13px] text-white placeholder:text-gray-500 focus:outline-none focus:border-ios-blue" />
          <button type="submit" disabled={!text.trim() || posting}
            className="text-xs font-bold text-ios-blue disabled:text-gray-600 px-2">
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
