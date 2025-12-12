"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Save } from "lucide-react";
import TagSelector from "@/components/TagSelector";

// Import Types
import { Database } from "@/types/supabase";
type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];

interface EditMediaFormProps {
  mediaItem: MediaItem;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditMediaForm({
  mediaItem,
  onSuccess,
  onCancel,
}: EditMediaFormProps) {
  const [title, setTitle] = useState(mediaItem.title);
  const [region, setRegion] = useState(mediaItem.region || "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // 1. Load Existing Tags on Mount
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase
        .from("media_tags")
        .select(
          `
          tags (
            name
          )
        `
        )
        .eq("media_id", mediaItem.id);

      if (data) {
        // Safe mapping to handle the nested structure
        const names = data.map((row: any) => row.tags?.name).filter(Boolean);
        setSelectedTags(names);
      }
    };
    fetchTags();
  }, [mediaItem.id]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setIsSaving(true);
    setError("");

    try {
      // A. Update Basic Info
      const { error: dbError } = await supabase
        .from("media_items")
        .update({ title, region })
        .eq("id", mediaItem.id);

      if (dbError) throw dbError;

      // B. Update Tags (Strategy: Resolve IDs -> Clear Old -> Insert New)
      const tagIds: number[] = [];

      for (const tagName of selectedTags) {
        // Find existing tag
        const { data: existing } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tagName)
          .single();

        if (existing) {
          tagIds.push(existing.id);
        } else {
          // Create new tag
          const { data: newTag, error: createError } = await supabase
            .from("tags")
            .insert({ name: tagName })
            .select()
            .single();

          if (createError) throw createError;
          if (newTag) tagIds.push(newTag.id);
        }
      }

      // Clear old links
      const { error: deleteError } = await supabase
        .from("media_tags")
        .delete()
        .eq("media_id", mediaItem.id);

      if (deleteError) throw deleteError;

      // Insert new links
      if (tagIds.length > 0) {
        const links = tagIds.map((tId) => ({
          media_id: mediaItem.id,
          tag_id: tId,
        }));
        const { error: insertError } = await supabase
          .from("media_tags")
          .insert(links);
        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      console.error("Save Error:", err);
      setError(err.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // FIX: Added 'p-6' to give content room to breathe
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">
            Region
          </label>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
          />
        </div>

        <div>
          <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} />
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800 mt-4">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-zinc-400 hover:text-white font-medium text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 text-sm"
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
