import { Plus } from 'lucide-react';

const STORIES = [
  { id: 's1', username: 'ranna',        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', unseen: true },
  { id: 's2', username: 'elena_crypto', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', unseen: true },
  { id: 's3', username: 'marcus_art',   avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', unseen: false },
];

export default function StoriesBar({ currentUser, onOpenUpload, onSelectStory }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 overflow-x-auto no-scrollbar border-b border-[#EFEFEF] bg-white">
      {/* Create Pin / Story */}
      <div onClick={onOpenUpload} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#CCCCCC] group-hover:border-[#E60023] overflow-hidden p-0.5 transition-colors">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt="you"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <button className="absolute -bottom-0.5 -right-0.5 bg-[#E60023] rounded-full p-1 border-2 border-white group-hover:scale-110 transition-transform shadow-sm">
            <Plus className="w-3 h-3 text-white stroke-[3]" />
          </button>
        </div>
        <span className="text-[11px] font-bold text-[#111111] truncate max-w-[64px]">New Pin</span>
      </div>

      {/* Peer stories */}
      {STORIES.map(story => (
        <div
          key={story.id}
          onClick={() => onSelectStory?.(story)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
        >
          <div className={`w-14 h-14 rounded-full p-[2px] ${story.unseen ? 'ring-2 ring-[#E60023]' : 'border border-[#EAEAEA]'}`}>
            <div className="w-full h-full bg-white rounded-full p-[2px]">
              <img src={story.avatar} alt={story.username} className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#555555] truncate max-w-[64px]">{story.username}</span>
        </div>
      ))}
    </div>
  );
}
