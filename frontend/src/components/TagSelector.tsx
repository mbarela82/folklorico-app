"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Tag, ArrowUp } from "lucide-react"; // Added ArrowUp
import { Database } from "@/types/supabase";

type TagItem = Database["public"]["Tables"]["tags"]["Row"];

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagSelector({
  selectedTags,
  onChange,
}: TagSelectorProps) {
  const [input, setInput] = useState("");
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 1. Fetch existing tags for autocomplete
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase.from("tags").select("*").order("name");
      if (data) setAvailableTags(data);
    };
    fetchTags();
  }, []);

  // 2. Add Tag Logic
  const handleAddTag = (tagName: string) => {
    const cleaned = tagName.trim();
    if (cleaned && !selectedTags.includes(cleaned)) {
      onChange([...selectedTags, cleaned]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(input);
    }
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  // Filter suggestions based on input
  const suggestions = availableTags.filter(
    (t) =>
      t.name.toLowerCase().includes(input.toLowerCase()) &&
      !selectedTags.includes(t.name)
  );

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1 ml-1">
        <Tag size={12} /> Tags
      </label>

      {/* FIX: Scrollable Tag Container 
         - max-h-24: Limits height to about 3 lines of tags
         - overflow-y-auto: Scrolls if you add more
      */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1 no-scrollbar">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-500/30 shrink-0"
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-white transition-colors ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Field with Mobile "Add" Button */}
      <div className="relative group">
        <input
          type="text"
          placeholder="Add tags (e.g. 'Skirt Work')"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-3 pr-12 text-white text-sm focus:border-indigo-500 outline-none transition-colors"
        />

        {/* The Mobile "Add" Button */}
        <button
          onClick={() => handleAddTag(input)}
          disabled={!input.trim()}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all ${
            input.trim()
              ? "bg-indigo-600 text-white opacity-100 shadow-lg"
              : "bg-transparent text-zinc-600 opacity-50 cursor-not-allowed"
          }`}
        >
          <ArrowUp size={16} />
        </button>

        {/* Suggestions Dropdown */}
        {showSuggestions && input.length > 0 && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
            {suggestions.map((t) => (
              <button
                key={t.id}
                onClick={() => handleAddTag(t.name)}
                className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border-b border-zinc-800/50 last:border-0"
              >
                #{t.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
