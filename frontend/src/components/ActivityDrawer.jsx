import React from 'react';
import { X, Heart, UserPlus, MessageCircle, ShieldCheck, Clock } from 'lucide-react';
import { formatTimestamp } from '../utils/helpers';

export default function ActivityDrawer({
  isOpen,
  onClose,
  activities,
  onActivityClick,
  isDark
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-sm h-full border-l shadow-2xl flex flex-col transition-all ${
        isDark ? 'bg-[#121212] border-[#262626] text-white' : 'bg-white border-[#dbdbdb] text-black'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isDark ? 'border-[#262626]' : 'border-[#dbdbdb]'
        }`}>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-brand-red fill-brand-red" />
            <h3 className="font-bold text-base">Ledger Activity</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-xs">
              No recent blockchain activities recorded.
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                onClick={() => onActivityClick && onActivityClick(act)}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  isDark ? 'border-[#262626] bg-[#181818] hover:bg-[#202020]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="mt-0.5">
                  {act.type === 'like' && <Heart className="w-4 h-4 text-brand-red fill-brand-red" />}
                  {act.type === 'follow' && <UserPlus className="w-4 h-4 text-brand-blue" />}
                  {act.type === 'comment' && <MessageCircle className="w-4 h-4 text-pink-500" />}
                  {act.type === 'block' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                </div>

                <div className="flex-1 text-xs">
                  <div className="leading-snug mb-1">
                    <span className="font-bold mr-1">@{act.actorUsername || 'system'}</span>
                    <span className="text-gray-300">{act.message}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(act.timestamp)}</span>
                    <span className="text-brand-blue">• Org1MSP</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
