"use client";
import {
  Gauge,
  Bookmark,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  VolumeX,
  Volume2,
} from "lucide-react";

interface StudioControlsProps {
  currentTime: number;
  duration: number;
  playbackRate: number;
  cycleSpeed: () => void;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAddingMark: boolean;
  setIsAddingMark: (val: boolean) => void;
  skip: (sec: number) => void;
  togglePlay: () => void;
  isPlaying: boolean;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  volume: number;
  setVolume: (val: number) => void;
  formatTime: (sec: number) => string;
  bookmarks: any[];
  activeLoopId: string | null;
  loopA: number | null;
  loopB: number | null;
  mediaType: string;
}

export default function StudioControls({
  currentTime,
  duration,
  playbackRate,
  cycleSpeed,
  handleSeek,
  isAddingMark,
  setIsAddingMark,
  skip,
  togglePlay,
  isPlaying,
  isMuted,
  setIsMuted,
  volume,
  setVolume,
  formatTime,
  bookmarks,
  activeLoopId,
  loopA,
  loopB,
  mediaType,
}: StudioControlsProps) {
  return (
    <div className="p-4 border-b border-zinc-800 shrink-0 bg-zinc-900 relative z-50 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-zinc-500 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        <button
          onClick={cycleSpeed}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-bold text-zinc-300"
        >
          <Gauge size={14} />
          <span>{playbackRate}x</span>
        </button>
      </div>

      {/* FIXED SCRUBBER: Added max and value syncing */}
      {mediaType === "video" && (
        <div className="mb-4 relative h-2 group/scrubber">
          <div className="absolute inset-0 bg-zinc-700 rounded-lg z-0" />
          {activeLoopId && loopA !== null && (
            <div
              className="absolute top-0 bottom-0 bg-indigo-500/30 pointer-events-none z-0"
              style={{
                left: `${(loopA / duration) * 100}%`,
                width: loopB ? `${((loopB - loopA) / duration) * 100}%` : "2px",
              }}
            />
          )}
          <div className="absolute top-0 w-full h-full z-10 pointer-events-none">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className={`absolute top-0 h-full w-1 rounded-full ${
                  b.is_public ? "bg-amber-400 z-20" : "bg-white z-10"
                }`}
                style={{ left: `${(b.start_time / duration) * 100}%` }}
              />
            ))}
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0} // Ensure max is set
            value={currentTime || 0} // Sync value
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-20 focus:outline-none 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
          />
        </div>
      )}

      <div className="flex items-center justify-between max-w-md mx-auto gap-2">
        <button
          onClick={() => setIsAddingMark(!isAddingMark)}
          className={`flex flex-col items-center gap-1 ${
            isAddingMark ? "text-indigo-400" : "text-zinc-500"
          }`}
        >
          <Bookmark size={20} fill={isAddingMark ? "currentColor" : "none"} />
          <span className="text-[10px]">Mark</span>
        </button>
        <button onClick={() => skip(-5)} className="text-zinc-400">
          <SkipBack size={24} />
        </button>
        <button
          onClick={togglePlay}
          className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white"
        >
          {isPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-1" />
          )}
        </button>
        <button onClick={() => skip(5)} className="text-zinc-400">
          <SkipForward size={24} />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={isMuted ? "text-zinc-500" : "text-white"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer hidden md:block"
          />
        </div>
      </div>
    </div>
  );
}
