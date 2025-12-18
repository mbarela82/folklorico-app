import BookmarkList from "@/components/BookmarkList";
import { Repeat, X } from "lucide-react";
import type { BookmarkItem } from "./types";

export default function DesktopBookmarksPanel({
  // add form
  isAddingMark,
  newMarkNote,
  onChangeNewMarkNote,
  userRole,
  isNewMarkPublic,
  onToggleNewMarkPublic,
  onSaveBookmark,
  onCancelAdd,

  // loop status
  activeLoopId,
  loopDuration,
  onClearLoop,
  onUpdateLoopDuration,

  // list
  bookmarks,
  currentUserId,
  onJump,
  onLoop,
  onDelete,
  formatTime,
}: {
  isAddingMark: boolean;
  newMarkNote: string;
  onChangeNewMarkNote: (v: string) => void;
  userRole: string;
  isNewMarkPublic: boolean;
  onToggleNewMarkPublic: () => void;
  onSaveBookmark: () => void;
  onCancelAdd: () => void;

  activeLoopId: string | null;
  loopDuration: number;
  onClearLoop: () => void;
  onUpdateLoopDuration: (sec: number) => void;

  bookmarks: BookmarkItem[];
  currentUserId: string | null;
  onJump: (time: number) => void;
  onLoop: (mark: BookmarkItem) => void;
  onDelete: (id: string) => void;
  formatTime: (seconds: number) => string;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 relative z-0">
      {/* A. ADD BOOKMARK FORM */}
      {isAddingMark && (
        <div className="mb-4 bg-zinc-950 p-3 rounded-lg border border-indigo-500/50 animate-in fade-in slide-in-from-top-2">
          <input
            autoFocus
            type="text"
            placeholder="Note..."
            value={newMarkNote}
            onChange={(e) => onChangeNewMarkNote(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white mb-2 focus:border-indigo-500 outline-none"
          />

          {(userRole === "teacher" || userRole === "admin") && (
            <div
              onClick={onToggleNewMarkPublic}
              className="flex items-center gap-2 mb-3 cursor-pointer text-xs font-bold text-zinc-400 hover:text-white"
            >
              <div
                className={`w-4 h-4 border rounded flex items-center justify-center ${
                  isNewMarkPublic ? "bg-amber-500 border-amber-500" : "border-zinc-600"
                }`}
              >
                {isNewMarkPublic && <div className="w-2 h-2 bg-black rounded-sm" />}
              </div>
              <span>Make Public (Teacher Note)</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onSaveBookmark}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded font-medium"
            >
              Save
            </button>
            <button
              onClick={onCancelAdd}
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
              <Repeat size={14} className="animate-spin-slow" /> Looping Section
            </div>
            <button
              onClick={onClearLoop}
              className="text-zinc-400 hover:text-white bg-black/20 p-1 rounded-full"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((sec) => (
              <button
                key={sec}
                onClick={() => onUpdateLoopDuration(sec)}
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
        onJump={onJump}
        onLoop={onLoop}
        onDelete={onDelete}
        formatTime={formatTime}
      />
    </div>
  );
}
