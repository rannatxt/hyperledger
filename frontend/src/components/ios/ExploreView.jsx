import { useState } from 'react';
import { Search, Heart, MessageCircle } from 'lucide-react';

export default function ExploreView({ posts, onSelectPost }) {
  const [query, setQuery] = useState('');

  const filtered = posts.filter(p =>
    p.caption?.toLowerCase().includes(query.toLowerCase()) ||
    p.authorUsername?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-full max-w-[470px] mx-auto pb-24">
      {/* Search bar */}
      <div className="px-3 py-2.5 sticky top-0 bg-black/90 backdrop-blur-md z-20 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1c1c1e] text-gray-300 border border-white/10">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search posts, hashes, authors…"
            className="w-full bg-transparent border-none outline-none text-[13px] placeholder:text-gray-500" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {filtered.map((post, idx) => {
          const large = idx % 7 === 1;
          return (
            <div key={post.id} onClick={() => onSelectPost?.(post)}
              className={`group relative bg-neutral-900 cursor-pointer overflow-hidden ${large ? 'col-span-2 row-span-2' : 'aspect-square'}`}>
              <img src={post.mediaUrl} alt="explore"
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 f-${post.filterName?.toLowerCase() || 'normal'}`} />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" />{post.likeCount}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" />{post.commentCount}</span>
              </div>
              <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-mono text-ios-blue border border-white/10">
                #{post.blockNumber}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
