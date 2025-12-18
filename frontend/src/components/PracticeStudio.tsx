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
  Repeat,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";

// Components
import BookmarkList from "@/components/BookmarkList";

import { Database } from "@/types/supabase";
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

  // --- Portrait-video mobile-only UI state (scoped) ---
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileBottomInset, setMobileBottomInset] = useState(88);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerTopRef = useRef<HTMLDivElement>(null);
  const addMarkRef = useRef<HTMLDivElement>(null);

  // Analytics
  const { logEvent } = useAnalytics();
  const hasLoggedPlay = useRef(false);

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

    // Reset portrait-mobile UI (scoped, does not affect fullscreen)
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
        url: media.file_path,
        normalize: true,
      });

      wavesurfer.current.on("play", () => setIsPlaying(true));
      wavesurfer.current.on("pause", () => setIsPlaying(false));

      // AUDIO LOOP CHECK (Reads from Ref)
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

  // Track mobile breakpoint (used only to enable portrait-mobile layout)
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

  // Compute bottom inset ONLY for portrait-video mobile layout (so fullscreen/music stay original)
  useEffect(() => {
    if (!media || media.media_type !== "video" || !isMobile || !isVerticalVideo)
      return;

    const setInset = () => {
      const vv = window.visualViewport;
      const height = vv?.height ?? window.innerHeight;
      const offsetTop = vv?.offsetTop ?? 0;
      const bottomObscured = Math.max(
        0,
        window.innerHeight - (height + offsetTop)
      );

      // Conservative minimum for gesture nav across Pixels/Samsungs + PWA
      const minInset = 96;
      setMobileBottomInset(Math.max(minInset, Math.round(bottomObscured)));
    };

    setInset();
    window.addEventListener("resize", setInset);
    window.visualViewport?.addEventListener("resize", setInset);
    window.visualViewport?.addEventListener("scroll", setInset);

    return () => {
      window.removeEventListener("resize", setInset);
      window.visualViewport?.removeEventListener("resize", setInset);
      window.visualViewport?.removeEventListener("scroll", setInset);
    };
  }, [media, isMobile, isVerticalVideo]);

  // Micro-polish: scroll drawer to add form when opening via Mark
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

  // Listeners
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

  // --- SEEK & JUMP ---
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

  // ORIGINAL fullscreen logic (unchanged)
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

  // --- BOOKMARK CRUD ---
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

  const usePortraitMobileLayout =
    media?.media_type === "video" && isMobile && isVerticalVideo;

  const MobileVerticalControls = () => (
    <div
      className="p-4 border-t border-zinc-800 bg-zinc-950"
      style={{ paddingBottom: mobileBottomInset + 16 }}
    >
      {/* time + speed */}
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

      {/* scrubber (video only) */}
      <div className="mb-4 relative h-2 group/scrubber">
        <div className="absolute inset-0 bg-zinc-700 rounded-lg z-0" />

        {/* loop box */}
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

        {/* bookmark ticks */}
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

      {/* playback buttons */}
      <div className="flex items-center justify-between max-w-md mx-auto gap-2">
        {/* Mark: open drawer + show add form */}
        <button
          onClick={() => {
            setIsDrawerOpen(true);
            setIsAddingMark(true);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isAddingMark ? "text-indigo-400" : "text-zinc-500 hover:text-white"
          }`}
        >
          <Bookmark size={20} fill={isAddingMark ? "currentColor" : "none"} />
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

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`transition-colors ${
            isMuted ? "text-zinc-500" : "text-white"
          }`}
          title="Mute"
        >
          {isMuted || volume === 0 ? (
            <VolumeX size={20} />
          ) : (
            <Volume2 size={20} />
          )}
        </button>
      </div>
    </div>
  );

  const DrawerBookmarkContent = () => (
    <>
      {/* Add mark form */}
      {isAddingMark && (
        <div
          ref={addMarkRef}
          className="mb-4 bg-black/40 p-3 rounded-lg border border-indigo-500/40 animate-in fade-in slide-in-from-top-2"
        >
          <input
            autoFocus
            type="text"
            placeholder="Note..."
            value={newMarkNote}
            onChange={(e) => setNewMarkNote(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white mb-2 focus:border-indigo-500 outline-none"
          />

          {(userRole === "teacher" || userRole === "admin") && (
            <div
              onClick={() => setIsNewMarkPublic(!isNewMarkPublic)}
              className="flex items-center gap-2 mb-3 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white"
            >
              <div
                className={`w-4 h-4 border rounded flex items-center justify-center ${
                  isNewMarkPublic
                    ? "bg-amber-500 border-amber-500"
                    : "border-white/30"
                }`}
              >
                {isNewMarkPublic && (
                  <div className="w-2 h-2 bg-black rounded-sm" />
                )}
              </div>
              <span>Make Public (Teacher Note)</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSaveBookmark}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setIsAddingMark(false)}
              className="px-3 bg-white/10 text-zinc-200 hover:text-white text-xs py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loop status */}
      {activeLoopId && (
        <div className="mb-3 px-3 py-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg flex flex-col gap-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider">
              <Repeat size={14} className="animate-spin-slow" /> Looping Section
            </div>
            <button
              onClick={clearLoop}
              className="text-zinc-200 hover:text-white bg-white/10 p-1 rounded-full"
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
                    : "bg-white/5 border-white/10 text-zinc-200 hover:text-white hover:bg-white/10"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      )}

      <BookmarkList
        bookmarks={bookmarks}
        currentUserId={currentUserId}
        activeLoopId={activeLoopId}
        selectedId={selectedBookmarkId}
        onJump={(time, id) => {
          setSelectedBookmarkId(id);
          jumpTo(time);
          setIsDrawerOpen(false); // close drawer on jump
        }}
        onLoop={(mark) => {
          setSelectedBookmarkId(mark.id);
          toggleBookmarkLoop(mark);
          // do NOT close drawer on loop toggle
        }}
        onDelete={(id) => handleDeleteBookmark(id)}
        formatTime={formatTime}
      />
    </>
  );

  const MobileSideDrawer = () => (
    <div
      className={`fixed inset-0 z-[60] ${
        isDrawerOpen ? "" : "pointer-events-none"
      }`}
    >
      {/* overlay */}
      <div
        className={`absolute inset-0 bg-black/35 transition-opacity ${
          isDrawerOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* drawer */}
      <div
        className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-black/55 backdrop-blur-md border-l border-white/10
        transition-transform ${
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
          <DrawerBookmarkContent />
        </div>
      </div>
    </div>
  );

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

      {/* BODY */}
      {usePortraitMobileLayout ? (
        <div
          className="flex-1 md:hidden flex flex-col overflow-y-auto bg-black"
          style={{ paddingBottom: mobileBottomInset }}
        >
          {/* Video */}
          <div className="relative bg-black flex items-center justify-center px-2 pt-2">
            <video
              ref={videoRef}
              src={media.file_path}
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

            {/* Top-right controls */}
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => setIsMirrored(!isMirrored)}
                className={`p-2 rounded-lg ${
                  isMirrored
                    ? "bg-indigo-600 text-white"
                    : "bg-black/50 text-white"
                }`}
                title="Mirror Video (for learning)"
              >
                <FlipHorizontal size={18} />
              </button>

              <button
                onClick={toggleFullScreen}
                className="p-2 bg-black/50 text-white rounded-lg"
                title="Fullscreen"
              >
                <Maximize size={18} />
              </button>

              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 bg-black/50 text-white rounded-lg"
                title="Bookmarks"
              >
                <Bookmark size={18} />
              </button>
            </div>
          </div>

          {/* Controls below video */}
          <div className="shrink-0">
            <MobileVerticalControls />
          </div>

          {/* Drawer */}
          <MobileSideDrawer />
        </div>
      ) : (
        // ORIGINAL BODY (kept as-is, except we add onLoadedMetadata to detect portrait for the mobile-only branch)
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* LEFT: MEDIA (Z-0) */}
          <div className="relative z-0 bg-black flex items-center justify-center shrink-0 h-auto min-h-[30vh] md:h-full md:w-[70%] md:border-r md:border-zinc-800 group min-h-0">
            {media.media_type === "video" && (
              <>
                <video
                  ref={videoRef}
                  src={media.file_path}
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
                    title="Mirror Video (for learning)"
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

            {/* AUDIO WAVEFORM */}
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

          {/* RIGHT: CONTROLS (Z-10) */}
          <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden md:w-[30%] relative z-10 min-h-0">
            <div className="p-4 border-b border-zinc-800 shrink-0 bg-zinc-900 relative z-50 shadow-xl">
              {/* ROW 1: TIME & SPEED */}
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

              {/* ROW 2: SCRUBBER (Video Only) */}
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

              {/* ROW 3: PLAYBACK BUTTONS */}
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

                {/* Volume */}
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

            {/* --- BOOKMARKS CONTENT (tabs removed) --- */}
            <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 relative z-0">
              {/* A. ADD BOOKMARK FORM */}
              {isAddingMark && (
                <div className="mb-4 bg-zinc-950 p-3 rounded-lg border border-indigo-500/50 animate-in fade-in slide-in-from-top-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Note..."
                    value={newMarkNote}
                    onChange={(e) => setNewMarkNote(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white mb-2 focus:border-indigo-500 outline-none"
                  />

                  {/* TEACHER TOGGLE */}
                  {(userRole === "teacher" || userRole === "admin") && (
                    <div
                      onClick={() => setIsNewMarkPublic(!isNewMarkPublic)}
                      className="flex items-center gap-2 mb-3 cursor-pointer text-xs font-bold text-zinc-400 hover:text-white"
                    >
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center ${
                          isNewMarkPublic
                            ? "bg-amber-500 border-amber-500"
                            : "border-zinc-600"
                        }`}
                      >
                        {isNewMarkPublic && (
                          <div className="w-2 h-2 bg-black rounded-sm" />
                        )}
                      </div>
                      <span>Make Public (Teacher Note)</span>
                    </div>
                  )}

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

              {/* B. LOOP STATUS */}
              {activeLoopId && (
                <div className="mb-3 px-3 py-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg flex flex-col gap-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                      <Repeat size={14} className="animate-spin-slow" /> Looping
                      Section
                    </div>
                    <button
                      onClick={clearLoop}
                      className="text-zinc-400 hover:text-white bg-black/20 p-1 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {/* Duration Buttons */}
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
              )}

              {/* C. THE LIST */}
              <BookmarkList
                bookmarks={bookmarks}
                currentUserId={currentUserId}
                activeLoopId={activeLoopId}
                selectedId={selectedBookmarkId}
                onJump={(time, id) => {
                  setSelectedBookmarkId(id);
                  jumpTo(time);
                }}
                onLoop={(mark) => {
                  setSelectedBookmarkId(mark.id);
                  toggleBookmarkLoop(mark);
                }}
                onDelete={(id) => handleDeleteBookmark(id)}
                formatTime={formatTime}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
