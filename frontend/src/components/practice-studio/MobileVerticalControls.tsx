import { Bookmark, Gauge, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import type { BookmarkItem } from "./types";

export default function MobileVerticalControls({
  currentTime,
  duration,
  playbackRate,
  cycleSpeed,
  activeLoopId,
  loopA,
  loopB,
  bookmarks,
  handleSeek,

  isAddingMark,
  onPressMark,
  isPlaying,
  togglePlay,
  onSkipBack,
  onSkipForward,

  isMuted,
  volume,
  onToggleMute,

  mobileBottomInset,
  formatTime,
}: {
  currentTime: number;
  duration: number;
  playbackRate: number;
  cycleSpeed: () => void;

  activeLoopId: string | null;
  loopA: number | null;
  loopB: number | null;
  bookmarks: BookmarkItem[];
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;

  isAddingMark: boolean;
  onPressMark: () => void;

  isPlaying: boolean;
  togglePlay: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;

  isMuted: boolean;
  volume: number;
  onToggleMute: () => void;

  mobileBottomInset: number;
  formatTime: (seconds: number) => string;
}) {
  return (
    <div
      className="p-4 border-t border-zinc-800 bg-zinc-950"
      style={{ paddingBottom: mobileBottomInset + 16 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-zinc-500 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        <button
          onClick={cycleSpeed}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
        >
          <Gauge size={14} />
          <span>{playbackRate}x</span>
        </button>
      </div>

      <div className="mb-4 relative h-2 group/scrubber">
        <div className="absolute inset-0 bg-zinc-700 rounded-lg z-0" />

        {activeLoopId && loopA !== null && (
          <div
            className="absolute top-0 bottom-0 bg-indigo-500/30 pointer-events-none z-0"
            style={{
              left: `${duration ? (loopA / duration) * 100 : 0}%`,
              width: loopB
                ? `${duration ? ((loopB - loopA) / duration) * 100 : 0}%`
                : "2px",
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
              style={{
                left: `${duration ? (b.start_time / duration) * 100 : 0}%`,
              }}
            />
          ))}
        </div>

        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-20 focus:outline-none
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
        />
      </div>

      <div className="flex items-center justify-between max-w-md mx-auto gap-2">
        <button
          onClick={onPressMark}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isAddingMark ? "text-indigo-400" : "text-zinc-500 hover:text-white"
          }`}
        >
          <Bookmark size={20} fill={isAddingMark ? "currentColor" : "none"} />
          <span className="text-[10px]">Mark</span>
        </button>

        <button onClick={onSkipBack} className="text-zinc-400 hover:text-white">
          <SkipBack size={24} />
        </button>

        <button
          onClick={togglePlay}
          className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-all"
        >
          {isPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-1" />
          )}
        </button>

        <button onClick={onSkipForward} className="text-zinc-400 hover:text-white">
          <SkipForward size={24} />
        </button>

        <button
          onClick={onToggleMute}
          className={`transition-colors ${isMuted ? "text-zinc-500" : "text-white"}`}
          title="Mute"
        >
          {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>
    </div>
  );
}
