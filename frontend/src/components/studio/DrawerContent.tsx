"use client";

import { X, Repeat } from "lucide-react";
import BookmarkList from "@/components/BookmarkList";
import { Database } from "@/types/supabase";

type BookmarkItem = Database["public"]["Tables"]["bookmarks"]["Row"];

interface DrawerContentProps {
  isAddingMark: boolean;
  setIsAddingMark: (v: boolean) => void;
  newMarkNote: string;
  setNewMarkNote: (v: string) => void;
  isNewMarkPublic: boolean;
  setIsNewMarkPublic: (v: boolean) => void;
  userRole: string;
  activeLoopId: string | null;
  loopDuration: number;
  clearLoop: () => void;
  updateLoopDuration: (seconds: number) => void;
  bookmarks: BookmarkItem[];
  currentUserId: string | null;
  selectedBookmarkId: string | null;
  setSelectedBookmarkId: (id: string | null) => void;
  jumpTo: (time: number) => void;
  toggleBookmarkLoop: (mark: BookmarkItem) => void;
  handleDeleteBookmark: (id: string) => void;
  handleSaveBookmark: () => void;
  formatTime: (seconds: number) => string;
  closeDrawer: () => void;
  addMarkRef: React.RefObject<HTMLDivElement | null>;
}

export default function DrawerContent({
  isAddingMark,
  setIsAddingMark,
  newMarkNote,
  setNewMarkNote,
  isNewMarkPublic,
  setIsNewMarkPublic,
  userRole,
  activeLoopId,
  loopDuration,
  clearLoop,
  updateLoopDuration,
  bookmarks,
  currentUserId,
  selectedBookmarkId,
  setSelectedBookmarkId,
  jumpTo,
  toggleBookmarkLoop,
  handleDeleteBookmark,
  handleSaveBookmark,
  formatTime,
  closeDrawer,
  addMarkRef,
}: DrawerContentProps) {
  return (
    <>
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
          closeDrawer();
        }}
        onLoop={(mark) => {
          setSelectedBookmarkId(mark.id);
          toggleBookmarkLoop(mark);
        }}
        onDelete={(id) => handleDeleteBookmark(id)}
        formatTime={formatTime}
      />
    </>
  );
}
