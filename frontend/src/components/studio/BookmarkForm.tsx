"use client";

interface BookmarkFormProps {
  newMarkNote: string;
  setNewMarkNote: (val: string) => void;
  userRole: string;
  isNewMarkPublic: boolean;
  setIsNewMarkPublic: (val: boolean) => void;
  handleSave: () => void;
  onCancel: () => void;
  addMarkRef?: React.RefObject<HTMLDivElement | null>;
}

export default function BookmarkForm({
  newMarkNote,
  setNewMarkNote,
  userRole,
  isNewMarkPublic,
  setIsNewMarkPublic,
  handleSave,
  onCancel,
  addMarkRef,
}: BookmarkFormProps) {
  return (
    <div
      ref={addMarkRef}
      className="mb-4 bg-zinc-950 p-3 rounded-lg border border-indigo-500/50 animate-in fade-in slide-in-from-top-2"
    >
      <input
        autoFocus
        type="text"
        placeholder="Note..."
        value={newMarkNote}
        onChange={(e) => setNewMarkNote(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-white mb-2 focus:border-indigo-500 outline-none"
      />

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
            {isNewMarkPublic && <div className="w-2 h-2 bg-black rounded-sm" />}
          </div>
          <span>Make Public (Teacher Note)</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded font-medium"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 bg-zinc-800 text-zinc-400 hover:text-white text-xs py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
