"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAnalytics } from "@/hooks/useAnalytics";
import WaveSurfer from "wavesurfer.js";

// Studio Sub-components
import StudioHeader from "./studio/StudioHeader";
import MediaDisplay from "./studio/MediaDisplay";
import StudioControls from "./studio/StudioControls";
import BookmarkForm from "./studio/BookmarkForm";
import LoopStatus from "./studio/LoopStatus";
import MobileVerticalLayout from "./studio/MobileVerticalLayout";

// Shared Components
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
  // --- REFS ---
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const loopRef = useRef<{
    a: number | null;
    b: number | null;
    active: boolean;
  }>({
    a: null,
    b: null,
    active: false,
  });
  const hasLoggedPlay = useRef(false);

  // --- STATE ---
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("dancer");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMirrored, setIsMirrored] = useState(false);
  const [activeLoopId, setActiveLoopId] = useState<string | null>(null);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [loopDuration, setLoopDuration] = useState(5);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isAddingMark, setIsAddingMark] = useState(false);
  const [newMarkNote, setNewMarkNote] = useState("");
  const [isNewMarkPublic, setIsNewMarkPublic] = useState(false);
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileBottomInset, setMobileBottomInset] = useState(88);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { logEvent } = useAnalytics();

  // --- LOGIC HELPERS ---
  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const clearLoop = useCallback(() => {
    loopRef.current = { a: null, b: null, active: false };
    setLoopA(null);
    setLoopB(null);
    setActiveLoopId(null);
  }, []);

  const jumpTo = useCallback(
    (time: number) => {
      const { a, active } = loopRef.current;
      if (active && a !== null && Math.abs(time - a) > 0.5) clearLoop();

      if (media?.media_type === "audio") {
        if (wavesurfer.current) {
          wavesurfer.current.setTime(time);
          wavesurfer.current.play().catch(() => {});
        }
      } else if (videoRef.current) {
        const v = videoRef.current;
        if (v.readyState >= 1) {
          v.currentTime = time;
          v.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    },
    [media, clearLoop]
  );

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

  const handleSaveBookmark = async () => {
    if (!media) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("You must be logged in to save notes.");

    const { error } = await supabase.from("bookmarks").insert({
      media_id: media.id,
      user_id: user.id,
      start_time: currentTime,
      note: newMarkNote || `Mark at ${formatTime(currentTime)}`,
      is_public: isNewMarkPublic,
    });

    if (error) {
      alert(`Save failed: ${error.message}`);
    } else {
      setIsAddingMark(false);
      setNewMarkNote("");
      setIsNewMarkPublic(false);
      await fetchBookmarks();
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (!error) {
      if (activeLoopId === id) clearLoop();
      fetchBookmarks();
    }
  };

  const toggleBookmarkLoop = (mark: BookmarkItem) => {
    if (activeLoopId === mark.id) {
      clearLoop();
      return;
    }
    const start = mark.start_time;
    const end = start + loopDuration;

    loopRef.current = { a: start, b: end, active: true };
    setLoopA(start);
    setLoopB(end);
    setActiveLoopId(mark.id);

    jumpTo(start);
  };

  // --- DURATION WATCHER ---
  useEffect(() => {
    if (loopRef.current.active && loopRef.current.a !== null) {
      const newB = loopRef.current.a + loopDuration;
      loopRef.current.b = newB;
      setLoopB(newB);
    }
  }, [loopDuration]);

  const handleVideoUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    const t = v.currentTime;
    setCurrentTime(t);
    setDuration(v.duration || 0);

    const { a, b, active } = loopRef.current;
    if (active && a !== null && b !== null) {
      if (t >= b || t < a - 0.5) {
        v.currentTime = a;
        if (v.paused) v.play().catch(() => {});
      }
    }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!media) return;

    const init = async () => {
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
    init();
    fetchBookmarks();

    if (media.media_type === "audio" && containerRef.current) {
      if (wavesurfer.current) wavesurfer.current.destroy();

      wavesurfer.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "#4f46e5",
        progressColor: "#818cf8",
        barWidth: 2,
        barGap: 3,
        height: 150,
        url: media.file_path,
        normalize: true,
      });

      wavesurfer.current.on("timeupdate", (t) => {
        setCurrentTime(t);
        const { a, b, active } = loopRef.current;
        if (active && a !== null && b !== null && (t >= b || t < a - 0.5)) {
          wavesurfer.current?.setTime(a);
        }
      });
      wavesurfer.current.on("ready", (d) => setDuration(d));
      wavesurfer.current.on("play", () => setIsPlaying(true));
      wavesurfer.current.on("pause", () => setIsPlaying(false));

      return () => wavesurfer.current?.destroy();
    }
  }, [media]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const vol = isMuted ? 0 : volume;
    if (wavesurfer.current) wavesurfer.current.setVolume(vol);
    if (videoRef.current) videoRef.current.volume = vol;
  }, [volume, isMuted]);

  useEffect(() => {
    if (wavesurfer.current) wavesurfer.current.setPlaybackRate(playbackRate);
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  if (!media) return null;

  // --- PROPS PREP ---
  const controlProps = {
    currentTime,
    duration,
    playbackRate,
    isPlaying,
    isMuted,
    volume,
    bookmarks,
    activeLoopId,
    loopA,
    loopB,
    formatTime,
    cycleSpeed: () =>
      setPlaybackRate((r) => (r === 1 ? 0.75 : r === 0.75 ? 0.5 : 1)),
    handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = parseFloat(e.target.value);
      setCurrentTime(t);
      if (videoRef.current) videoRef.current.currentTime = t;
      if (wavesurfer.current) wavesurfer.current.setTime(t);
    },
    setIsAddingMark,
    isAddingMark,
    skip: (s: number) => jumpTo(currentTime + s),
    togglePlay: () => {
      if (media?.media_type === "audio") wavesurfer.current?.playPause();
      else {
        const v = videoRef.current;
        if (v?.paused) {
          v.play();
          setIsPlaying(true);
        } else {
          v?.pause();
          setIsPlaying(false);
        }
      }
    },
    setVolume,
    setIsMuted,
    mediaType: media.media_type,
  };

  const bookmarkListProps = {
    bookmarks,
    currentUserId,
    activeLoopId,
    formatTime,
    onJump: (t: number) => {
      jumpTo(t);
      setIsDrawerOpen(false);
    },
    onLoop: toggleBookmarkLoop,
    onDelete: handleDeleteBookmark, // Restored!
  };

  const formProps = {
    newMarkNote,
    setNewMarkNote,
    userRole,
    isNewMarkPublic,
    setIsNewMarkPublic,
    handleSave: handleSaveBookmark,
    onCancel: () => setIsAddingMark(false),
  };

  const usePortraitMobileLayout =
    media.media_type === "video" && isMobile && isVerticalVideo;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-300">
      <StudioHeader
        title={media.title}
        region={media.region}
        onClose={onClose}
      />

      {usePortraitMobileLayout ? (
        <MobileVerticalLayout
          media={media}
          videoRef={videoRef}
          isMirrored={isMirrored}
          setIsMirrored={setIsMirrored}
          mobileBottomInset={mobileBottomInset}
          setIsDrawerOpen={setIsDrawerOpen}
          setIsVerticalVideo={setIsVerticalVideo}
          setDuration={setDuration}
          handleVideoTimeUpdate={handleVideoUpdate}
          togglePlay={controlProps.togglePlay}
          setIsPlaying={setIsPlaying}
          controlProps={controlProps}
          drawerProps={{
            isDrawerOpen,
            setIsDrawerOpen,
            children: (
              <>
                {isAddingMark && <BookmarkForm {...formProps} />}
                {activeLoopId && (
                  <LoopStatus
                    loopDuration={loopDuration}
                    updateLoopDuration={(sec) => setLoopDuration(sec)}
                    clearLoop={clearLoop}
                  />
                )}
                <BookmarkList {...bookmarkListProps} />
              </>
            ),
          }}
        />
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          <MediaDisplay
            mediaType={media.media_type as "video" | "audio"}
            filePath={media.file_path}
            videoRef={videoRef}
            containerRef={containerRef}
            isMirrored={isMirrored}
            setIsMirrored={setIsMirrored}
            toggleFullScreen={() => videoRef.current?.requestFullscreen()}
            togglePlay={controlProps.togglePlay}
            handleVideoTimeUpdate={handleVideoUpdate}
            setIsVerticalVideo={setIsVerticalVideo}
            setDuration={setDuration}
            activeLoopId={activeLoopId}
            loopA={loopA}
            loopB={loopB}
            duration={duration}
          />

          <div className="flex-1 flex flex-col bg-zinc-900 overflow-hidden md:w-[30%] relative z-10">
            <StudioControls {...controlProps} />
            <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 relative">
              {isAddingMark && <BookmarkForm {...formProps} />}
              {activeLoopId && (
                <LoopStatus
                  loopDuration={loopDuration}
                  updateLoopDuration={(sec) => setLoopDuration(sec)}
                  clearLoop={clearLoop}
                />
              )}
              <BookmarkList {...bookmarkListProps} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
