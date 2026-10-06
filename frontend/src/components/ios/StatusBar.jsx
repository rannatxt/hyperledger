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
    <div className="w-full bg-white px-6 pt-3 pb-1.5 flex items-center justify-between text-[#111111] select-none z-40 border-b border-[#F0F0F0]">
      {/* Time */}
      <span className="text-[13px] font-bold tracking-tight w-14 font-sans text-left text-[#111111]">
        {time || '9:41'}
      </span>

      {/* Dynamic Island pill */}
      <button
        onClick={onDynamicIslandClick}
        className="flex items-center gap-2 px-3 py-1 bg-[#F0F0F0] hover:bg-[#EAEAEA] border border-[#E0E0E0] rounded-full h-[26px] active:scale-95 transition-all"
        title="Tap to inspect Hyperledger Fabric Ledger"
      >
        <span className="w-2 h-2 rounded-full bg-[#27ae60] animate-pulse" />
        <span className="text-[10px] font-mono text-[#111111] font-semibold tracking-tight">
          Fabric · Raft
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#E60023]" />
      </button>

      {/* Cellular + Wifi + Battery */}
      <div className="flex items-center gap-1.5 w-14 justify-end text-[#111111]">
        {/* Cellular bars */}
        <div className="flex items-end gap-[1.5px] h-3">
          <span className="w-[3px] h-1.5 bg-[#111111] rounded-[0.5px]" />
          <span className="w-[3px] h-2 bg-[#111111] rounded-[0.5px]" />
          <span className="w-[3px] h-2.5 bg-[#111111] rounded-[0.5px]" />
          <span className="w-[3px] h-3 bg-[#111111] rounded-[0.5px]" />
        </div>

        <Wifi className="w-3.5 h-3.5 stroke-[2.2] text-[#111111]" />

        {/* Battery with 100% green fill */}
        <div className="relative flex items-center w-5 h-2.5 border border-[#111111] rounded-[3px] p-[1.5px]">
          <div className="h-full w-[85%] bg-[#27ae60] rounded-[1.5px]" />
          <div className="absolute -right-[3px] w-[2px] h-1.5 bg-[#111111] rounded-r-[1px]" />
        </div>
      </div>
    </div>
  );
}
