"use client";

import { useState, useRef, useEffect } from "react";
import { Tag, X, Filter, MoreHorizontal, Check } from "lucide-react";

interface TagFilterBarProps {
  availableTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export default function TagFilterBar({
  availableTags,
  selectedTag,
  onSelectTag,
}: TagFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (availableTags.length === 0) return null;

  return (
    <div className="w-full mb-4 relative z-20" ref={menuRef}>
      {/* --- MAIN ROW (Always Visible) --- */}
      <div className="flex items-center gap-2">
        {/* 1. Clear / All Button */}
        <button
          onClick={() => onSelectTag(null)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
            selectedTag === null
              ? "bg-white text-black border-white shadow-sm"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
          }`}
        >
          {selectedTag === null ? (
            "All"
          ) : (
            <>
              <X size={14} /> Clear
            </>
          )}
        </button>

        {/* 2. Active Tag Indicator (Only shows if a tag is selected) */}
        {selectedTag && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white border border-indigo-500 shadow-md text-xs font-bold animate-in fade-in zoom-in-95 duration-200">
            <Tag size={12} className="fill-white" />#{selectedTag}
          </div>
        )}

        {/* 3. The "Menu" Trigger (The Kebab / More Button) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
            isOpen
              ? "bg-zinc-800 text-white border-zinc-700"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
          }`}
        >
          <span className="hidden xs:inline">Filter Tags</span>
          <span className="xs:hidden">Tags</span>
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* --- DROPDOWN MENU (Floating) --- */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 max-h-60 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 origin-top-right z-30">
          <div className="text-[10px] font-bold text-zinc-500 uppercase px-2 py-1 mb-1">
            Select a Tag
          </div>

          <div className="space-y-1">
            {availableTags.map((tag) => {
              const isActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    onSelectTag(tag);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-600/10 text-indigo-400"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag
                      size={12}
                      className={isActive ? "fill-indigo-400" : ""}
                    />
                    #{tag}
                  </div>
                  {isActive && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
