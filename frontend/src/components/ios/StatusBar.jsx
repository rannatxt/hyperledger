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
    <div className="w-full bg-black px-6 pt-3 pb-1.5 flex items-center justify-between text-white select-none z-40">
      {/* Time */}
      <span className="text-[14px] font-semibold tracking-tight w-14 font-sans text-left">
        {time || '9:41'}
      </span>

      {/* Dynamic Island */}
      <button
        onClick={onDynamicIslandClick}
        className="flex items-center gap-2 px-3 py-1 bg-black border border-white/15 rounded-full h-[28px] hover:border-[#007aff]/60 active:scale-95 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
        title="Tap to inspect Hyperledger Fabric Ledger"
      >
        <span className="w-2 h-2 rounded-full bg-[#34c759] animate-pulse" />
        <span className="text-[10px] font-mono text-gray-300 font-medium tracking-tight">
          Fabric · Raft
        </span>
        <span className="w-2 h-2 rounded-full bg-[#007aff]" />
      </button>

      {/* Cellular + Wifi + Battery */}
      <div className="flex items-center gap-1.5 w-14 justify-end">
        {/* Cellular bars */}
        <div className="flex items-end gap-[1.5px] h-3">
          <span className="w-[3px] h-1.5 bg-white rounded-[0.5px]" />
          <span className="w-[3px] h-2 bg-white rounded-[0.5px]" />
          <span className="w-[3px] h-2.5 bg-white rounded-[0.5px]" />
          <span className="w-[3px] h-3 bg-white rounded-[0.5px]" />
        </div>

        <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />

        {/* Battery with 100% green fill */}
        <div className="relative flex items-center w-5 h-2.5 border border-white/80 rounded-[3px] p-[1.5px]">
          <div className="h-full w-[85%] bg-[#34c759] rounded-[1.5px]" />
          <div className="absolute -right-[3px] w-[2px] h-1.5 bg-white/70 rounded-r-[1px]" />
        </div>
      </div>
    </div>
  );
}
