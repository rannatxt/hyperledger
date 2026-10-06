import { useState } from 'react';
import { Search, Heart, MessageCircle, Film } from 'lucide-react';
import { getVideoPosterFallback } from '../../utils/thumbnail';

export default function ExploreView({ posts = [], onSelectPost }) {
  const [query, setQuery] = useState('');

  const filtered = posts.filter(p =>
    p.caption?.toLowerCase().includes(query.toLowerCase()) ||
    p.authorUsername?.toLowerCase().includes(query.toLowerCase()) ||
    p.contentHash?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-full max-w-2xl mx-auto pb-24 bg-white select-none font-sans">
      {/* ── iOS Search Bar ── */}
      <div className="px-3 py-2.5 sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-[#EFEFEF]">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EFEFEF] text-[#262626] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#DBDBDB] border border-transparent transition-all">
          <Search className="w-4 h-4 text-[#8E8E8E] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tags, creators, Fabric multihashes…"
            className="w-full bg-transparent border-none outline-none text-xs text-[#262626] placeholder:text-[#8E8E8E]"
          />
        </div>
      </div>

      {/* ── 3-Column Square Instagram Explore Grid ── */}
      <div className="ig-profile-grid">
        {filtered.map((post) => {
          const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(post.mediaUrl || '');
          const thumb = post.thumbnailUrl || (isVideo ? getVideoPosterFallback(post.caption, post.id) : post.mediaUrl);

          return (
            <div
              key={post.id}
              onClick={() => onSelectPost?.(post)}
              className="ig-grid-item group"
            >
              <img
                src={thumb}
                alt={post.caption || 'explore media'}
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 f-${post.filterName?.toLowerCase() || 'normal'}`}
                loading="lazy"
              />

              {/* Video Indicator */}
              {isVideo && (
                <div className="absolute top-2 right-2 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                  <Film className="w-4 h-4 fill-white" />
                </div>
              )}

              {/* Hover Scrim with Likes & Comments */}
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs pointer-events-none">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-white" />
                  {post.likeCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 fill-white" />
                  {post.commentCount || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
