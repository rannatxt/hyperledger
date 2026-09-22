import { Plus } from 'lucide-react';

const STORIES = [
  { id: 's1', username: 'ranna',        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', unseen: true },
  { id: 's2', username: 'elena_crypto', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', unseen: true },
  { id: 's3', username: 'marcus_art',   avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', unseen: false },
];

export default function StoriesBar({ currentUser, onOpenUpload, onSelectStory }) {
  return (
    <div className="flex items-center gap-3.5 px-3 py-3 overflow-x-auto no-scrollbar border-b border-white/[0.06]">
      {/* Your Story */}
      <div onClick={onOpenUpload} className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-ios-gray4 overflow-hidden">
            <img src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt="you" className="w-full h-full object-cover" />
          </div>
          <button className="absolute bottom-0 right-0 bg-ios-blue rounded-full p-1 border-2 border-black group-hover:scale-110 transition-transform shadow">
            <Plus className="w-3 h-3 text-white stroke-[3]" />
          </button>
        </div>
        <span className="text-[11px] text-gray-300 truncate max-w-[64px]">Your story</span>
      </div>

      {/* Peer stories */}
      {STORIES.map(story => (
        <div key={story.id} onClick={() => onSelectStory?.(story)}
          className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer active:scale-95 transition-transform">
          <div className={`w-16 h-16 rounded-full p-[2px] ${story.unseen ? 'story-ring' : 'border border-ios-gray4'}`}>
            <div className="w-full h-full bg-black rounded-full p-[2px]">
              <img src={story.avatar} alt={story.username} className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
          <span className="text-[11px] text-gray-300 truncate max-w-[64px]">{story.username}</span>
        </div>
      ))}
    </div>
  );
}
