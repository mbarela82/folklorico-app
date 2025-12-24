"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Bookmark,
  Volume2,
  VolumeX,
  Maximize,
  FlipHorizontal,
  Gauge,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";

// Types & Child Components
import { Database } from "@/types/supabase";
import MobileControls from "./studio/MobileControls";
import DrawerContent from "./studio/DrawerContent";

type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];
type BookmarkItem = Database["public"]["Tables"]["bookmarks"]["Row"];

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

  // --- REFS FOR INSTANT LOOPING ---
  const loopRef = useRef<{
    a: number | null;
    b: number | null;
    active: boolean;
  }>({
    a: null,
    b: null,
    active: false,
  });

  // User Context (For RBAC)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("dancer");

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Practice Tools
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMirrored, setIsMirrored] = useState(false);

  // UI Loop State
  const [activeLoopId, setActiveLoopId] = useState<string | null>(null);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [loopDuration, setLoopDuration] = useState(5);

  // Volume State
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Bookmark State
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isAddingMark, setIsAddingMark] = useState(false);
  const [newMarkNote, setNewMarkNote] = useState("");
  const [isNewMarkPublic, setIsNewMarkPublic] = useState(false);
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(
    null
  );

  // --- Portrait-video mobile-only UI state ---
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerTopRef = useRef<HTMLDivElement>(null);
  const addMarkRef = useRef<HTMLDivElement>(null);

  // Analytics
  const { logEvent } = useAnalytics();
  const hasLoggedPlay = useRef(false);

  // --- HELPER: FORCE HTTPS ---
  const getValidUrl = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `https://${path}`;
  };

  // --- LOOP LOGIC ---
  const clearLoop = () => {
    loopRef.current = { a: null, b: null, active: false };
    setLoopA(null);
    setLoopB(null);
    setActiveLoopId(null);
  };

  // 1. Initialize Player & User
  useEffect(() => {
    if (!media) return;

    // Fetch User Role & ID
    const initUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (data) setUserRole(data.role);
      }
    };
    initUser();

    // Reset All States
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackRate(1);
    setIsMirrored(false);
    clearLoop();
    setBookmarks([]);
    fetchBookmarks();

    // Reset mobile UI
    setIsVerticalVideo(false);
    setIsDrawerOpen(false);
    setIsAddingMark(false);
    setNewMarkNote("");
    setIsNewMarkPublic(false);
    setSelectedBookmarkId(null);

    if (media.media_type === "audio" && containerRef.current) {
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
        url: getValidUrl(media.file_path),
        normalize: true,
      });

      wavesurfer.current.on("play", () => setIsPlaying(true));
      wavesurfer.current.on("pause", () => setIsPlaying(false));

      // AUDIO LOOP CHECK
      wavesurfer.current.on("timeupdate", (time) => {
        setCurrentTime(time);
        const { a, b, active } = loopRef.current;
        if (active && a !== null && b !== null) {
          if (time >= b || time < a - 0.5) {
            wavesurfer.current?.setTime(a);
            if (!wavesurfer.current?.isPlaying()) wavesurfer.current?.play();
          }
        }
      });

      wavesurfer.current.on("ready", (d) => {
        setDuration(d);
        wavesurfer.current?.setVolume(isMuted ? 0 : volume);
      });

      return () => {
        wavesurfer.current?.destroy();
      };
    }
  }, [media]);

  // Track mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener?.("change", set);
    window.addEventListener("resize", set);
    return () => {
      mq.removeEventListener?.("change", set);
      window.removeEventListener("resize", set);
    };
  }, []);

  // Scroll drawer to add form
  useEffect(() => {
    if (!isDrawerOpen) return;
    const t = window.setTimeout(() => {
      if (isAddingMark) {
        addMarkRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        drawerTopRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);
    return () => window.clearTimeout(t);
  }, [isDrawerOpen, isAddingMark]);

  // Volume & Speed Listeners
  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume;
    if (wavesurfer.current) wavesurfer.current.setVolume(targetVolume);
    if (videoRef.current) videoRef.current.volume = targetVolume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (wavesurfer.current) wavesurfer.current.setPlaybackRate(playbackRate);
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // --- ACTIONS ---
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
      if (!hasLoggedPlay.current) {
        logEvent(media.id, "play");
        hasLoggedPlay.current = true;
      }
    } else {
      const v = videoRef.current;
      if (v?.paused) {
        v.play();
        setIsPlaying(true);
        if (!hasLoggedPlay.current) {
          logEvent(media.id, "play");
          hasLoggedPlay.current = true;
        }
      } else {
        v?.pause();
        setIsPlaying(false);
      }
    }
  };

  const cycleSpeed = () => {
    if (playbackRate === 1) setPlaybackRate(0.75);
    else if (playbackRate === 0.75) setPlaybackRate(0.5);
    else setPlaybackRate(1);
  };

  const toggleBookmarkLoop = (mark: BookmarkItem) => {
    if (activeLoopId === mark.id) {
      clearLoop();
      return;
    }
    const start = mark.start_time;
    const end = mark.start_time + loopDuration;
    loopRef.current = { a: start, b: end, active: true };
    setLoopA(start);
    setLoopB(end);
    setActiveLoopId(mark.id);
    jumpTo(start);
    setIsPlaying(true);
  };

  const updateLoopDuration = (newDuration: number) => {
    setLoopDuration(newDuration);
    if (loopRef.current.active && loopRef.current.a !== null) {
      const newB = loopRef.current.a + newDuration;
      loopRef.current.b = newB;
      setLoopB(newB);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const { a, b, active } = loopRef.current;
    if (active && a !== null && b !== null) {
      if (time < a - 1 || time > b + 1) {
        clearLoop();
      }
    }
    setCurrentTime(time);
    if (media?.media_type === "video" && videoRef.current) {
      videoRef.current.currentTime = time;
    } else if (media?.media_type === "audio" && wavesurfer.current) {
      wavesurfer.current.setTime(time);
    }
  };

  const jumpTo = (time: number) => {
    const { a, active } = loopRef.current;
    if (active && a !== null && Math.abs(time - a) > 0.5) {
      clearLoop();
    }
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
    const t = e.currentTarget.currentTime;
    setCurrentTime(t);
    setDuration(e.currentTarget.duration || 0);
    const { a, b, active } = loopRef.current;
    if (active && a !== null && b !== null) {
      if (t >= b || t < a - 0.5) {
        e.currentTarget.currentTime = a;
        e.currentTarget.play();
      }
    }
  };

  const handleSaveBookmark = async () => {
    if (!media) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to save notes.");
      return;
    }
    const { error } = await supabase.from("bookmarks").insert({
      media_id: media.id,
      user_id: user.id,
      start_time: currentTime,
      note: newMarkNote || `Mark at ${formatTime(currentTime)}`,
      is_public: isNewMarkPublic,
    });
    if (error) {
      console.error("Save Error:", error);
      alert(`Error saving note: ${error.message}`);
    } else {
      setIsAddingMark(false);
      setNewMarkNote("");
      setIsNewMarkPublic(false);
      fetchBookmarks();
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    if (activeLoopId === id) clearLoop();
    fetchBookmarks();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearLoop();
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

  // Determine Layout Mode
  const usePortraitMobileLayout =
    media?.media_type === "video" && isMobile && isVerticalVideo;

  if (!media) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-900 shrink-0 bg-zinc-950 relative z-50">
        <div className="text-center flex-1 px-4 overflow-hidden">
          <h2 className="font-bold text-white text-lg truncate">
            {media.title}
          </h2>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            {media.region || "Unknown Region"}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white absolute right-4 top-4"
        >
          <X size={24} />
        </button>
      </div>

      {usePortraitMobileLayout ? (
        // === MOBILE PORTRAIT LAYOUT ===
        <div className="flex-1 md:hidden flex flex-col overflow-hidden bg-black">
          <div className="relative bg-black flex-1 flex items-center justify-center px-2 pt-2">
            <video
              ref={videoRef}
              src={getValidUrl(media.file_path)}
              playsInline
              className="w-full max-h-[52vh] object-contain transition-transform duration-300"
              style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                setIsVerticalVideo(v.videoHeight > v.videoWidth);
                setDuration(v.duration || 0);
              }}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => setIsMirrored(!isMirrored)}
                className={`p-2 rounded-lg ${
                  isMirrored
                    ? "bg-indigo-600 text-white"
                    : "bg-black/50 text-white"
                }`}
              >
                <FlipHorizontal size={18} />
              </button>
              <button
                onClick={toggleFullScreen}
                className="p-2 bg-black/50 text-white rounded-lg"
              >
                <Maximize size={18} />
              </button>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 bg-black/50 text-white rounded-lg"
              >
                <Bookmark size={18} />
              </button>
            </div>
          </div>

          <div className="shrink-0">
            <MobileControls
              currentTime={currentTime}
              duration={duration}
              playbackRate={playbackRate}
              isPlaying={isPlaying}
              isAddingMark={isAddingMark}
              activeLoopId={activeLoopId}
              loopA={loopA}
              loopB={loopB}
              bookmarks={bookmarks}
              volume={volume}
              isMuted={isMuted}
              onSeek={handleSeek}
              onTogglePlay={togglePlay}
              onCycleSpeed={cycleSpeed}
              onSkip={skip}
              onToggleMute={() => setIsMuted(!isMuted)}
              onToggleAddMark={() => setIsAddingMark(!isAddingMark)}
              onOpenDrawer={() => setIsDrawerOpen(true)}
              formatTime={formatTime}
            />
          </div>

          {/* DRAWER */}
          <div
            className={`fixed inset-0 z-[60] ${
              isDrawerOpen ? "" : "pointer-events-none"
            }`}
          >
            <div
              className={`absolute inset-0 bg-black/35 transition-opacity ${
                isDrawerOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setIsDrawerOpen(false)}
            />
            <div
              className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-black/55 backdrop-blur-md border-l border-white/10 transition-transform ${
                isDrawerOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Bookmarks
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-zinc-200"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
                <div ref={drawerTopRef} />
                <DrawerContent
                  isAddingMark={isAddingMark}
                  setIsAddingMark={setIsAddingMark}
                  newMarkNote={newMarkNote}
                  setNewMarkNote={setNewMarkNote}
                  isNewMarkPublic={isNewMarkPublic}
                  setIsNewMarkPublic={setIsNewMarkPublic}
                  userRole={userRole}
                  activeLoopId={activeLoopId}
                  loopDuration={loopDuration}
                  clearLoop={clearLoop}
                  updateLoopDuration={updateLoopDuration}
                  bookmarks={bookmarks}
                  currentUserId={currentUserId}
                  selectedBookmarkId={selectedBookmarkId}
                  setSelectedBookmarkId={setSelectedBookmarkId}
                  jumpTo={jumpTo}
                  toggleBookmarkLoop={toggleBookmarkLoop}
                  handleDeleteBookmark={handleDeleteBookmark}
                  handleSaveBookmark={handleSaveBookmark}
                  formatTime={formatTime}
                  closeDrawer={() => setIsDrawerOpen(false)}
                  addMarkRef={addMarkRef}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // === STANDARD / DESKTOP LAYOUT ===
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* MEDIA AREA */}
          <div className="relative z-0 bg-black flex items-center justify-center shrink-0 h-auto min-h-[30vh] md:h-full md:w-[70%] md:border-r md:border-zinc-800 group min-h-0">
            {media.media_type === "video" && (
              <>
                <video
                  ref={videoRef}
                  src={getValidUrl(media.file_path)}
                  playsInline
                  className="w-auto h-auto max-h-[60vh] md:w-full md:h-full object-contain transition-transform duration-300"
                  style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    setIsVerticalVideo(v.videoHeight > v.videoWidth);
                    setDuration(v.duration || 0);
                  }}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlay}
                />
                <div className="absolute bottom-4 right-4 flex gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setIsMirrored(!isMirrored)}
                    className={`p-2 rounded-lg ${
                      isMirrored
                        ? "bg-indigo-600 text-white"
                        : "bg-black/50 text-white"
                    }`}
                  >
                    <FlipHorizontal size={20} />
                  </button>
                  <button
                    onClick={toggleFullScreen}
                    className="p-2 bg-black/50 text-white rounded-lg"
                  >
                    <Maximize size={20} />
                  </button>
                </div>
              </>
            )}
            {media.media_type === "audio" && (
              <div className="w-full px-4 md:px-12">
                <div className="relative w-full">
                  <div ref={containerRef} className="w-full" />
                  {activeLoopId && loopA !== null && (
                    <div
                      className="absolute top-0 bottom-0 bg-indigo-500/20 pointer-events-none z-10 border-l border-r border-indigo-500/50"
                      style={{
                        left: `${(loopA / duration) * 100}%`,
                        width: loopB
                          ? `${((loopB - loopA) / duration) * 100}%`
                          : "2px",
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CONTROLS AREA */}
          <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden md:w-[30%] relative z-10 min-h-0">
            {/* Playback Controls */}
            <div className="p-4 border-b border-zinc-800 shrink-0 bg-zinc-900 relative z-50 shadow-xl">
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

              {media.media_type === "video" && (
                <div className="mb-4 relative h-2 group/scrubber">
                  <div className="absolute inset-0 bg-zinc-700 rounded-lg z-0" />
                  {activeLoopId && loopA !== null && (
                    <div
                      className="absolute top-0 bottom-0 bg-indigo-500/30 pointer-events-none z-0"
                      style={{
                        left: `${(loopA / duration) * 100}%`,
                        width: loopB
                          ? `${((loopB - loopA) / duration) * 100}%`
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
                        style={{ left: `${(b.start_time / duration) * 100}%` }}
                      />
                    ))}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-20 focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                  />
                </div>
              )}

              <div className="flex items-center justify-between max-w-md mx-auto gap-2">
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
                <div className="flex items-center gap-2 relative">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`transition-colors ${
                      isMuted ? "text-zinc-500" : "text-white"
                    }`}
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
                    className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hidden md:block"
                  />
                </div>
              </div>
            </div>

            {/* SIDEBAR BOOKMARK CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 relative z-0">
              <DrawerContent
                isAddingMark={isAddingMark}
                setIsAddingMark={setIsAddingMark}
                newMarkNote={newMarkNote}
                setNewMarkNote={setNewMarkNote}
                isNewMarkPublic={isNewMarkPublic}
                setIsNewMarkPublic={setIsNewMarkPublic}
                userRole={userRole}
                activeLoopId={activeLoopId}
                loopDuration={loopDuration}
                clearLoop={clearLoop}
                updateLoopDuration={updateLoopDuration}
                bookmarks={bookmarks}
                currentUserId={currentUserId}
                selectedBookmarkId={selectedBookmarkId}
                setSelectedBookmarkId={setSelectedBookmarkId}
                jumpTo={jumpTo}
                toggleBookmarkLoop={toggleBookmarkLoop}
                handleDeleteBookmark={handleDeleteBookmark}
                handleSaveBookmark={handleSaveBookmark}
                formatTime={formatTime}
                closeDrawer={() => {}}
                addMarkRef={addMarkRef}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
