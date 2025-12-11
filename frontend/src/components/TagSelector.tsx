"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Plus, Tag } from "lucide-react";

interface TagSelectorProps {
  selectedTags: string[]; // List of tag NAMES
  onChange: (tags: string[]) => void;
}

export default function TagSelector({
  selectedTags,
  onChange,
}: TagSelectorProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);

  // Fetch all available tags for autocomplete
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase.from("tags").select("*").order("name");
      if (data) setAllTags(data);
    };
    fetchTags();
  }, []);

  const handleAdd = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      const val = input.trim();
      if (!selectedTags.includes(val)) {
        onChange([...selectedTags, val]);
      }
      setInput("");
    }
  };

  const handleRemove = (tagToRemove: string) => {
    onChange(selectedTags.filter((t) => t !== tagToRemove));
  };

  // Filter suggestions
  const filtered = allTags.filter(
    (t) =>
      t.name.toLowerCase().includes(input.toLowerCase()) &&
      !selectedTags.includes(t.name)
  );

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-zinc-500 uppercase ml-1 flex items-center gap-1">
        <Tag size={12} /> Tags
      </label>

      {/* Selected Chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded-full border border-indigo-500/30"
          >
            #{tag}
            <button
              onClick={() => handleRemove(tag)}
              className="hover:text-white"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Type tag & hit Enter..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleAdd}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none transition-colors"
        />

        {/* Autocomplete Dropdown */}
        {input && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 max-h-32 overflow-y-auto">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onChange([...selectedTags, t.name]);
                  setInput("");
                }}
                className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
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
