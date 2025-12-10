import { Play, Music, Video } from "lucide-react";

// This defines what data a Card needs to work
interface MediaCardProps {
  title: string;
  region: string;
  type: "audio" | "video";
  onClick: () => void;
}

export default function MediaCard({
  title,
  region,
  type,
  onClick,
}: MediaCardProps) {
  return (
    <div
      onClick={onClick}
      className="group bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-4 relative overflow-hidden"
    >
      {/* 1. The Icon Box (Left side) */}
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
          type === "audio"
            ? "bg-indigo-900/30 text-indigo-400"
            : "bg-emerald-900/30 text-emerald-400"
        }`}
      >
        {type === "audio" ? <Music size={24} /> : <Video size={24} />}
      </div>

      {/* 2. Text Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-zinc-100 truncate">{title}</h3>
        <p className="text-sm text-zinc-400 truncate">{region}</p>
      </div>

      {/* 3. Play Button (Only shows when hovering) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 rounded-full p-2 text-white shadow-lg">
        <Play size={16} fill="currentColor" />
      </div>
    </div>
  );
}
