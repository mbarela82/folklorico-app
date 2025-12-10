"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Bookmark,
  Trash2,
  Volume2,
  VolumeX,
  Maximize,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";

interface MediaItem {
  id: string;
  title: string;
  region: string;
  media_type: "audio" | "video";
  file_path: string;
}

interface PracticeStudioProps {
  media: MediaItem | null;
  onClose: () => void;
}

export default function PracticeStudio({
  media,
  onClose,
}: PracticeStudioProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Volume State
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Bookmark State
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isAddingMark, setIsAddingMark] = useState(false);
  const [newMarkNote, setNewMarkNote] = useState("");

  // 1. Initialize Player
  useEffect(() => {
    if (!media) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBookmarks([]);
    fetchBookmarks();

    // IF AUDIO: Setup WaveSurfer
    if (media.media_type === "audio" && containerRef.current) {
      // Destroy old instance if exists
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }

      wavesurfer.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "#4f46e5",
        progressColor: "#818cf8",
        cursorColor: "#fff",
        barWidth: 2,
        barGap: 3,
        height: 150,
        url: media.file_path,
        normalize: true,
      });

      wavesurfer.current.on("play", () => setIsPlaying(true));
      wavesurfer.current.on("pause", () => setIsPlaying(false));
      wavesurfer.current.on("timeupdate", (time) => setCurrentTime(time));
      wavesurfer.current.on("ready", (d) => {
        setDuration(d);
        wavesurfer.current?.setVolume(isMuted ? 0 : volume);
      });

      return () => {
        wavesurfer.current?.destroy();
      };
    }
  }, [media]);

  // 2. Volume Listener
  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume;
    if (wavesurfer.current) wavesurfer.current.setVolume(targetVolume);
    if (videoRef.current) videoRef.current.volume = targetVolume;
  }, [volume, isMuted]);

  const fetchBookmarks = async () => {
    if (!media) return;
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("media_id", media.id)
      .order("start_time", { ascending: true });
    if (data) setBookmarks(data);
  };

  const togglePlay = () => {
    if (media?.media_type === "audio") {
      wavesurfer.current?.playPause();
    } else {
      const v = videoRef.current;
      if (v?.paused) {
        v.play();
        setIsPlaying(true);
      } else {
        v?.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);

    if (media?.media_type === "video" && videoRef.current) {
      videoRef.current.currentTime = time;
    } else if (media?.media_type === "audio" && wavesurfer.current) {
      wavesurfer.current.setTime(time);
    }
  };

  const jumpTo = (time: number) => {
    if (media?.media_type === "audio") {
      wavesurfer.current?.setTime(time);
      wavesurfer.current?.play();
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch((err) => console.error(err));
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
    setDuration(e.currentTarget.duration || 0);
  };

  const handleSaveBookmark = async () => {
    if (!media) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("bookmarks").insert({
      media_id: media.id,
      user_id: user.id,
      start_time: currentTime,
      note: newMarkNote || `Mark at ${formatTime(currentTime)}`,
    });

    if (!error) {
      setIsAddingMark(false);
      setNewMarkNote("");
      fetchBookmarks();
    }
  };

  const handleDeleteBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("bookmarks").delete().eq("id", id);
    fetchBookmarks();
  };

  // FIX: This stops the video from toggling play/pause when you click Close
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) videoRef.current.pause();
    if (wavesurfer.current) wavesurfer.current.pause();
    onClose();
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const skip = (seconds: number) => {
    const target = currentTime + seconds;
    jumpTo(target);
  };

  if (!media) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-900 shrink-0 bg-zinc-950">
        <div className="text-center flex-1">
          <h2 className="font-bold text-white text-lg">{media.region}</h2>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            Practice Mode
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white absolute right-4 top-4 z-50"
        >
          <X size={24} />
        </button>
      </div>

      {/* MAIN BODY */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* --- LEFT SIDE: MEDIA --- */}
        <div className="relative bg-black flex items-center justify-center shrink-0 h-[30vh] md:h-full md:w-[70%] md:border-r md:border-zinc-800 group">
          {media.media_type === "video" && (
            <>
              <video
                ref={videoRef}
                src={media.file_path}
                className="h-full w-full object-contain"
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
              />
              <button
                onClick={toggleFullScreen}
                className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Full Screen"
              >
                <Maximize size={20} />
              </button>
            </>
          )}

          {media.media_type === "audio" && (
            <div className="w-full px-4 md:px-12">
              <div ref={containerRef} className="w-full" />
            </div>
          )}
        </div>

        {/* --- RIGHT SIDE: CONTROLS & BOOKMARKS --- */}
        <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden md:w-[30%]">
          {/* CONTROLS SECTION */}
          <div className="p-4 border-b border-zinc-800 shrink-0 bg-zinc-900">
            <div className="mb-2 text-center md:text-left">
              <h1 className="text-xl font-bold text-white truncate">
                {media.title}
              </h1>
              <div className="text-xs text-zinc-500 font-mono mt-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Scrubber (Video Only) */}
            {media.media_type === "video" && (
              <div className="mb-4 mt-2">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}

            {/* Playback Buttons */}
            <div className="flex items-center justify-between max-w-md mx-auto mt-2 md:gap-2">
              <button
                onClick={() => setIsAddingMark(!isAddingMark)}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isAddingMark
                    ? "text-indigo-400"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Bookmark
                  size={20}
                  fill={isAddingMark ? "currentColor" : "none"}
                />
                <span className="text-[10px]">Mark</span>
              </button>

              <button
                onClick={() => skip(-5)}
                className="text-zinc-400 hover:text-white"
              >
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

              <button
                onClick={() => skip(5)}
                className="text-zinc-400 hover:text-white"
              >
                <SkipForward size={24} />
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-2 group/vol relative">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-zinc-500 hover:text-white"
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
                  className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hidden sm:block"
                />
              </div>
            </div>
          </div>

          {/* BOOKMARKS LIST */}
          <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
            {isAddingMark && (
              <div className="mb-4 bg-zinc-950 p-3 rounded-lg border border-indigo-500/50 animate-in fade-in slide-in-from-top-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Name this spot..."
                  value={newMarkNote}
                  onChange={(e) => setNewMarkNote(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white mb-2 focus:border-indigo-500 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBookmark}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsAddingMark(false)}
                    className="px-3 bg-zinc-800 text-zinc-400 hover:text-white text-xs py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
              Saved Marks
            </h3>

            {bookmarks.length === 0 ? (
              <div className="text-zinc-600 text-sm text-center italic mt-8 p-4 border border-dashed border-zinc-800 rounded-lg">
                No bookmarks yet.
                <br />
                Tap "Mark" to save a spot.
              </div>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((mark) => (
                  <button
                    key={mark.id}
                    onClick={() => jumpTo(mark.start_time)}
                    className="w-full flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-indigo-500/50 hover:bg-zinc-800 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-indigo-400 font-mono text-xs font-bold bg-indigo-400/10 px-2 py-1 rounded">
                        {formatTime(mark.start_time)}
                      </div>
                      <span className="text-sm text-zinc-300 font-medium">
                        {mark.note}
                      </span>
                    </div>
                    <div
                      onClick={(e) => handleDeleteBookmark(mark.id, e)}
                      className="text-zinc-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
