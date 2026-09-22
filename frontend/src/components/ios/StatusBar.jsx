import { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';

export default function StatusBar({ onDynamicIslandClick }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const h = n.getHours() % 12 || 12;
      const m = n.getMinutes().toString().padStart(2, '0');
      setTime(`${h}:${m}`);
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full bg-black px-5 pt-2 pb-1 flex items-center justify-between text-white select-none">
      {/* Time */}
      <span className="text-[13px] font-semibold tracking-tight w-12">{time || '9:41'}</span>

      {/* Dynamic Island */}
      <button
        onClick={onDynamicIslandClick}
        className="flex items-center gap-1.5 px-3 py-0.5 bg-black border border-white/10 rounded-full h-7 hover:border-ios-blue/50 transition-all"
        title="Tap to inspect Fabric Ledger"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-green" />
        <span className="text-[10px] font-mono text-gray-400 tracking-tight">mychannel · Raft</span>
        <span className="w-1.5 h-1.5 rounded-full bg-ios-blue/80" />
      </button>

      {/* Signal + Battery */}
      <div className="flex items-center gap-1.5 w-12 justify-end">
        <div className="flex items-end gap-px h-3">
          <span className="w-[3px] h-1   bg-white rounded-sm"/>
          <span className="w-[3px] h-1.5 bg-white rounded-sm"/>
          <span className="w-[3px] h-2   bg-white rounded-sm"/>
          <span className="w-[3px] h-3   bg-white rounded-sm"/>
        </div>
        <Wifi className="w-3.5 h-3.5" />
        <div className="relative flex items-center w-5 h-2.5 border border-white/70 rounded-[3px] p-[1.5px]">
          <div className="h-full w-[80%] bg-green-500 rounded-[1.5px]" />
          <div className="absolute -right-[3px] w-[3px] h-1.5 bg-white/60 rounded-r-sm" />
        </div>
      </div>
    </div>
  );
}
