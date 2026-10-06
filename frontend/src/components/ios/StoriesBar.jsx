import { Plus } from 'lucide-react';

const STORIES = [
  { id: 's1', username: 'ranna',        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', unseen: true },
  { id: 's2', username: 'elena_crypto', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', unseen: true },
  { id: 's3', username: 'marcus_art',   avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', unseen: false },
  { id: 's4', username: 'hyper_peer',   avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', unseen: true },
];

export default function StoriesBar({ currentUser, onOpenUpload, onSelectStory }) {
  return (
    <div className="w-full bg-white border-b border-[#EFEFEF] py-3.5 px-3 select-none">
      <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar">
        {/* "Your story" with Instagram blue plus button */}
        <div
          onClick={onOpenUpload}
          className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group"
        >
          <div className="relative">
            <div className="w-[66px] h-[66px] rounded-full p-[2px] bg-transparent">
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="Your story"
                className="w-full h-full rounded-full object-cover border border-[#E5E5E5]"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-[20px] h-[20px] bg-[#0095F6] rounded-full flex items-center justify-center border-2 border-white group-active:scale-95 transition-transform shadow-sm">
              <Plus className="w-3.5 h-3.5 text-white stroke-[3]" />
            </div>
          </div>
          <span className="text-[11px] font-normal text-[#262626] truncate max-w-[70px]">Your story</span>
        </div>

        {/* Peer stories with Instagram gradient rings */}
        {STORIES.map((story) => (
          <div
            key={story.id}
            onClick={() => onSelectStory?.(story)}
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
          >
            <div
              className={`w-[66px] h-[66px] rounded-full p-[2.5px] ${
                story.unseen ? 'ig-story-ring' : 'ig-story-ring-gray'
              }`}
            >
              <div className="w-full h-full bg-white rounded-full p-[2px]">
                <img
                  src={story.avatar}
                  alt={story.username}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <span className="text-[11px] font-normal text-[#262626] truncate max-w-[70px]">
              {story.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
