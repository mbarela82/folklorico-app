"use client";
import { Repeat, X } from "lucide-react";

interface LoopStatusProps {
  loopDuration: number;
  updateLoopDuration: (sec: number) => void;
  clearLoop: () => void;
}

export default function LoopStatus({
  loopDuration,
  updateLoopDuration,
  clearLoop,
}: LoopStatusProps) {
  return (
    <div className="mb-3 px-3 py-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg flex flex-col gap-3 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Repeat size={14} className="animate-spin-slow" /> Looping Section
        </div>
        <button
          onClick={clearLoop}
          className="text-zinc-400 hover:text-white bg-black/20 p-1 rounded-full"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex gap-2">
        {[5, 10, 15, 20].map((sec) => (
          <button
            key={sec}
            onClick={() => updateLoopDuration(sec)}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded border transition-colors ${
              loopDuration === sec
                ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {sec}s
          </button>
        ))}
      </div>
    </div>
  );
}
