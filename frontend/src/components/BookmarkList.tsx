"use client";

import { Globe, Lock, Repeat, Trash2 } from "lucide-react";
import { Database } from "@/types/supabase";

type BookmarkItem = Database["public"]["Tables"]["bookmarks"]["Row"];

interface BookmarkListProps {
  bookmarks: BookmarkItem[];
  currentUserId: string | null;
  activeLoopId: string | null;
  onJump: (time: number) => void;
  onLoop: (bookmark: BookmarkItem) => void;
  onDelete: (id: string) => void;
  formatTime: (seconds: number) => string;
}

export default function BookmarkList({
  bookmarks,
  currentUserId,
  activeLoopId,
  onJump,
  onLoop,
  onDelete,
  formatTime,
}: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="text-zinc-600 text-sm text-center italic mt-8 p-4 border border-dashed border-zinc-800 rounded-lg">
        No bookmarks yet. <br /> Tap "Mark" to save a spot.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((mark) => {
        const isLooping = activeLoopId === mark.id;
        const isOwner = mark.user_id === currentUserId;
        const isPublic = mark.is_public;

        return (
          <div
            key={mark.id}
            className={`w-full flex items-center justify-between p-3 border rounded-lg transition-all group relative overflow-hidden ${
              isLooping
                ? "bg-indigo-900/10 border-indigo-500/50"
                : "bg-zinc-950 border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            {/* Public Strip Indicator */}
            {isPublic && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
            )}

            <div
              className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
              onClick={() => onJump(mark.start_time)}
            >
              {/* Time Badge */}
              <div
                className={`font-mono text-xs font-bold px-2 py-1 rounded shrink-0 ${
                  isLooping
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {formatTime(mark.start_time)}
              </div>

              {/* Note Content */}
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-sm font-medium truncate ${
                    isPublic ? "text-amber-100" : "text-zinc-300"
                  }`}
                >
                  {mark.note}
                </span>

                {/* --- VISIBILITY BADGES (The New Feature) --- */}
                <div className="mt-1">
                  {isPublic ? (
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Globe size={10} /> Teacher Note
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Lock size={10} /> Private Note
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 pl-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLoop(mark);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isLooping
                    ? "text-indigo-400 bg-indigo-400/10"
                    : "text-zinc-600 hover:text-white hover:bg-zinc-700"
                }`}
                title="Loop this section"
              >
                <Repeat size={16} />
              </button>

              {/* Only show delete if I own it or I am an admin (handled by policy, but UI helper here) */}
              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(mark.id);
                  }}
                  className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
