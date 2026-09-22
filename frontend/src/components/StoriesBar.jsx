import React from 'react';
import { Plus } from 'lucide-react';

export default function StoriesBar({ users, currentUser, onSelectUser, onOpenUpload, isDark }) {
  return (
    <div className={`w-full border-b py-3.5 px-4 mb-4 overflow-x-auto flex items-center gap-4 scrollbar-none transition-colors ${
      isDark ? 'border-[#262626] bg-black' : 'border-[#dbdbdb] bg-white'
    }`}>
      {/* Current User Story / Add Post */}
      <div 
        onClick={onOpenUpload}
        className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
      >
        <div className="relative w-16 h-16 rounded-full p-0.5 border border-dashed border-gray-500 group-hover:border-pink-500 transition-colors">
          <img
            src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=me'}
            alt="Your story"
            className="w-full h-full rounded-full object-cover"
          />
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-brand-blue rounded-full flex items-center justify-center text-white border-2 border-black">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>
        <span className="text-[11px] font-medium tracking-tight text-gray-400 group-hover:text-white truncate max-w-[68px]">
          Your story
        </span>
      </div>

      {/* Other Peer Stories */}
      {users.map((user) => {
        const isCurrent = user.id === currentUser?.id;
        return (
          <div
            key={user.id}
            onClick={() => onSelectUser(user)}
            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
          >
            <div className={`w-16 h-16 rounded-full p-[2px] transition-transform group-hover:scale-105 ${
              isCurrent ? 'border-2 border-gray-600' : 'story-gradient'
            }`}>
              <div className={`w-full h-full rounded-full p-0.5 ${isDark ? 'bg-black' : 'bg-white'}`}>
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <span className="text-[11px] font-medium tracking-tight text-gray-400 group-hover:text-white truncate max-w-[68px]">
              {user.username}
            </span>
          </div>
        );
      })}
    </div>
  );
}
