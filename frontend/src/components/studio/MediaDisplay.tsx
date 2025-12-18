import { Maximize, FlipHorizontal } from "lucide-react";

interface MediaDisplayProps {
  mediaType: "video" | "audio";
  filePath: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isMirrored: boolean;
  setIsMirrored: (val: boolean) => void;
  toggleFullScreen: () => void;
  togglePlay: () => void;
  handleVideoTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  setIsVerticalVideo: (val: boolean) => void;
  setDuration: (val: number) => void;
  activeLoopId: string | null;
  loopA: number | null;
  loopB: number | null;
  duration: number;
}

export default function MediaDisplay({
  mediaType,
  filePath,
  videoRef,
  containerRef,
  isMirrored,
  setIsMirrored,
  toggleFullScreen,
  togglePlay,
  handleVideoTimeUpdate,
  setIsVerticalVideo,
  setDuration,
  activeLoopId,
  loopA,
  loopB,
  duration,
}: MediaDisplayProps) {
  return (
    <div className="relative z-0 bg-black flex items-center justify-center shrink-0 h-auto min-h-[30vh] md:h-full md:w-[70%] md:border-r md:border-zinc-800 group min-h-0">
      {mediaType === "video" ? (
        <>
          <video
            ref={videoRef}
            src={filePath}
            playsInline
            className="w-auto h-auto max-h-[60vh] md:w-full md:h-full object-contain transition-transform duration-300"
            style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setIsVerticalVideo(v.videoHeight > v.videoWidth);
              setDuration(v.duration || 0);
            }}
            onTimeUpdate={handleVideoTimeUpdate}
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
      ) : (
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
  );
}
