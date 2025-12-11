"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Save } from "lucide-react";

interface EditMediaFormProps {
  mediaItem: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditMediaForm({
  mediaItem,
  onSuccess,
  onCancel,
}: EditMediaFormProps) {
  const [title, setTitle] = useState(mediaItem.title);
  const [region, setRegion] = useState(mediaItem.region);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim() || !region.trim()) {
      setError("Title and Region are required.");
      return;
    }
    setIsSaving(true);
    setError("");

    const { error: dbError } = await supabase
      .from("media_items")
      .update({ title, region })
      .eq("id", mediaItem.id);

    setIsSaving(false);

    if (dbError) {
      setError("Failed to update media info.");
    } else {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
          Region
        </label>
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
        />
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}
