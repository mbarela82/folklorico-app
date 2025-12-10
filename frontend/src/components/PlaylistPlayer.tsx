"use client";

import { useState, useRef, useEffect } from "react";
import { X, Play, Pause, SkipBack, SkipForward, Music } from "lucide-react";

interface MediaItem {
  id: string;
  title: string;
  region: string;
  media_type: "audio" | "video";
  file_path: string;
}

interface PlaylistPlayerProps {
  playlist: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
}

export default function PlaylistPlayer({
  playlist,
  initialIndex = 0,
  onClose,
}: PlaylistPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false); // Start paused
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = playlist[currentIndex];

  useEffect(() => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current?.play().catch((e) => console.log("Play error", e));
    }
    setProgress(0);
  }, [currentIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = (e: any) => {
    setProgress(e.currentTarget.currentTime);
    setDuration(e.currentTarget.duration || 0);
  };

  const handleNext = () => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col md:flex-row animate-in slide-in-from-bottom duration-300 text-white">
      {/* === LEFT: MUSIC VISUALIZER AREA === */}
      <div className="flex-1 flex flex-col relative bg-zinc-950">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-zinc-900 to-transparent flex justify-between z-20 pointer-events-none">
          <div>
            <h2 className="text-xl font-bold drop-shadow-md">
              {currentTrack.title}
            </h2>
            <p className="text-indigo-400 text-sm font-medium drop-shadow-md tracking-wider">
              {currentTrack.region}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-zinc-800/50 hover:bg-zinc-700 rounded-full backdrop-blur-sm transition-colors"
        >
          <X size={24} />
        </button>

        {/* Main Display */}
        <div
          className="flex-1 flex flex-col items-center justify-center relative cursor-pointer"
          onClick={togglePlay}
        >
          <audio
            ref={audioRef}
            src={currentTrack.file_path}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleNext}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Visual Circle */}
          <div className="relative">
            {isPlaying && (
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
            )}

            <div className="w-48 h-48 md:w-64 md:h-64 bg-zinc-900 rounded-full border-4 border-zinc-800 flex items-center justify-center shadow-2xl relative z-10">
              <Music
                size={80}
                className={`text-indigo-500 transition-all duration-700 ${
                  isPlaying ? "scale-110" : "scale-100 opacity-50"
                }`}
              />
            </div>
          </div>

          <div className="mt-8 text-zinc-500 font-mono text-sm uppercase tracking-widest">
            {isPlaying ? "Now Playing" : "Paused"}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bg-zinc-900 border-t border-zinc-800 p-6 pb-10 md:pb-6">
          <div className="flex items-center gap-3 mb-4 text-xs font-mono text-zinc-400">
            <span>{formatTime(progress)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              disabled={currentIndex === 0}
              className="text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <SkipBack size={32} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="w-16 h-16 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transform hover:scale-105 transition-all"
            >
              {isPlaying ? (
                <Pause size={32} fill="currentColor" />
              ) : (
                <Play size={32} fill="currentColor" className="ml-1" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              disabled={currentIndex === playlist.length - 1}
              className="text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              <SkipForward size={32} />
            </button>
          </div>
        </div>
      </div>

      {/* === RIGHT: QUEUE LIST === */}
      <div className="h-[40vh] md:h-full md:w-96 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col">
        <div className="p-5 border-b border-zinc-900 bg-zinc-900/50">
          <div className="flex items-center gap-2 text-white mb-1">
            <Music size={18} className="text-indigo-500" />
            <span className="font-bold text-sm uppercase tracking-wider">
              Queue
            </span>
          </div>
          <p className="text-xs text-zinc-500">{playlist.length} tracks</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {playlist.map((item, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={`${item.id}-${index}`}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsPlaying(true);
                }}
                className={`w-full flex items-center gap-4 p-3 rounded-lg text-left transition-all group ${
                  isActive
                    ? "bg-zinc-800/80 border-l-2 border-indigo-500"
                    : "hover:bg-zinc-900/50 border-l-2 border-transparent"
                }`}
              >
                <div
                  className={`text-xs font-mono w-6 text-center ${
                    isActive
                      ? "text-indigo-400"
                      : "text-zinc-600 group-hover:text-zinc-400"
                  }`}
                >
                  {isActive ? (
                    <Play size={12} fill="currentColor" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`text-sm font-medium truncate ${
                      isActive
                        ? "text-white"
                        : "text-zinc-400 group-hover:text-zinc-300"
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-xs text-zinc-600 truncate">
                    {item.region}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
