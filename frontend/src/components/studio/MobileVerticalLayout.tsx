"use client";
import { FlipHorizontal, Maximize, Bookmark } from "lucide-react";
import StudioControls from "./StudioControls";
import MobileSideDrawer from "./MobileSideDrawer";

interface MobileVerticalLayoutProps {
  media: any;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isMirrored: boolean;
  setIsMirrored: (v: boolean) => void;
  toggleFullScreen: () => void;
  setIsVerticalVideo: (v: boolean) => void;
  setDuration: (v: number) => void;
  handleVideoTimeUpdate: (e: any) => void;
  togglePlay: () => void;
  setIsPlaying: (v: boolean) => void;
  setIsDrawerOpen: (v: boolean) => void;
  mobileBottomInset: number;
  controlProps: any;
  drawerProps: any;
}

export default function MobileVerticalLayout({
  media,
  videoRef,
  isMirrored,
  setIsMirrored,
  toggleFullScreen,
  setIsVerticalVideo,
  setDuration,
  handleVideoTimeUpdate,
  togglePlay,
  setIsPlaying,
  setIsDrawerOpen,
  mobileBottomInset,
  controlProps,
  drawerProps,
}: MobileVerticalLayoutProps) {
  return (
    <div
      className="flex-1 md:hidden flex flex-col overflow-y-auto bg-black"
      style={{ paddingBottom: mobileBottomInset }}
    >
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

        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-2 rounded-lg ${
              isMirrored ? "bg-indigo-600 text-white" : "bg-black/50 text-white"
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
        <StudioControls {...controlProps} isMobileVertical />
      </div>

      <MobileSideDrawer {...drawerProps} />
    </div>
  );
}
