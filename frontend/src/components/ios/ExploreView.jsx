import { useState } from 'react';
import { Search, Heart, MessageCircle, Play } from 'lucide-react';
import { getVideoPosterFallback } from '../../utils/thumbnail';

export default function ExploreView({ posts = [], onSelectPost }) {
  const [query, setQuery] = useState('');

  const filtered = posts.filter(p =>
    p.caption?.toLowerCase().includes(query.toLowerCase()) ||
    p.authorUsername?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 bg-white select-none">
      {/* Search bar */}
      <div className="px-4 py-3 sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-[#EFEFEF]">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#F0F0F0] text-[#111111] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#E60023]/25 border border-transparent transition-all">
          <Search className="w-4 h-4 text-[#767676]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pins, tags, authors, multihashes…"
            className="w-full bg-transparent border-none outline-none text-xs text-[#111111] placeholder:text-[#767676]"
          />
        </div>
      </div>

      {/* Pinterest Masonry Grid */}
      <div className="masonry-columns p-4">
        {filtered.map((post) => {
          const isVideo = post.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(post.mediaUrl || '');
          const thumb = post.thumbnailUrl || (isVideo ? getVideoPosterFallback(post.caption, post.id) : post.mediaUrl);

          return (
            <div
              key={post.id}
              onClick={() => onSelectPost?.(post)}
              className="masonry-brick group cursor-pointer mb-4"
            >
              <div className="bg-white rounded-[20px] border border-[#EFEFEF] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="relative aspect-[4/5] bg-[#F5F5F5] overflow-hidden">
                  <img
                    src={thumb}
                    alt={post.caption || 'pin'}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 f-${post.filterName?.toLowerCase() || 'normal'}`}
                    loading="lazy"
                  />

                  {isVideo && (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-bold flex items-center gap-1 border border-white/20">
                      <Play className="w-3 h-3 fill-white" /> VIDEO
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-[#111111] border border-black/5">
                    #{post.blockNumber ?? '0'} Fabric
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  {post.caption && (
                    <p className="text-xs font-semibold text-[#111111] line-clamp-2 leading-snug">
                      {post.caption}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#767676]">
                    <span className="font-bold text-[#111111]">@{post.authorUsername}</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <Heart className={`w-3 h-3 ${post.likeCount > 0 ? 'fill-[#E60023] text-[#E60023]' : ''}`} />
                        {post.likeCount || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageCircle className="w-3 h-3" />
                        {post.commentCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
