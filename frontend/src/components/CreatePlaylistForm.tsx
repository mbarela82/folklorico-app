"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  Plus,
  Check,
  X,
  Loader2,
  Save,
  Globe,
  Lock,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Music,
} from "lucide-react";
import Toast from "@/components/Toast";

// Import Types
import { Database } from "@/types/supabase";
type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];

interface CreatePlaylistFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export default function CreatePlaylistForm({
  onSuccess,
  onCancel,
  initialData,
}: CreatePlaylistFormProps) {
  const isEditing = !!initialData;

  // State
  const [title, setTitle] = useState(initialData?.title || "");
  const [isPublic, setIsPublic] = useState(initialData?.is_public || false);
  const [activeTab, setActiveTab] = useState<"playlist" | "library">(
    "playlist"
  );

  // Data State
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Drag & Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetchLibrary();
    if (isEditing) fetchExistingItems();
  }, []);

  const fetchLibrary = async () => {
    const { data } = await supabase
      .from("media_items")
      .select("*")
      .eq("media_type", "audio")
      .order("title");
    if (data) setLibrary(data);
  };

  const fetchExistingItems = async () => {
    const pid = initialData.id;
    const { data } = await supabase
      .from("playlist_items")
      .select(`*, media_items (*)`)
      .eq("playlist_id", pid)
      .order("order_index");

    if (data) {
      const formatted = data.map((item: any) => item.media_items as MediaItem);
      setSelectedItems(formatted);
    }
  };

  const handleAddItem = (item: MediaItem) => {
    setSelectedItems([...selectedItems, item]);

    // Trigger the "Flash" effect
    setAddedId(item.id);
    setTimeout(() => {
      setAddedId(null);
    }, 1000);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === selectedItems.length - 1) return;

    const newItems = [...selectedItems];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];
    setSelectedItems(newItems);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    position: number
  ) => {
    dragItem.current = position;
  };

  const handleDragEnter = (
    e: React.DragEvent<HTMLDivElement>,
    position: number
  ) => {
    dragOverItem.current = position;
    const newItems = [...selectedItems];
    const dragItemContent = newItems[dragItem.current!];
    newItems.splice(dragItem.current!, 1);
    newItems.splice(dragOverItem.current!, 0, dragItemContent);
    dragItem.current = position;
    setSelectedItems(newItems);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setToast({ msg: "Please enter a title", type: "error" });
      return;
    }
    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let playlistId = initialData?.id;

    if (isEditing) {
      const { error } = await supabase
        .from("playlists")
        .update({ title, is_public: isPublic })
        .eq("id", playlistId);
      if (error) {
        setIsSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("playlists")
        .insert({ title, user_id: user.id, is_public: isPublic })
        .select()
        .single();
      if (error) {
        setIsSaving(false);
        return;
      }
      playlistId = data.id;
    }

    if (isEditing) {
      const { error } = await supabase
        .from("playlist_items")
        .delete()
        .eq("playlist_id", playlistId);
      if (error) {
        setIsSaving(false);
        return;
      }
    }

    if (selectedItems.length > 0) {
      const itemsToInsert = selectedItems.map((item, index) => ({
        playlist_id: playlistId,
        media_id: item.id,
        order_index: index,
      }));
      const { error } = await supabase
        .from("playlist_items")
        .insert(itemsToInsert);
      if (error) {
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    onSuccess();
  };

  const filteredLibrary = library.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // FIX: Removed extra 'p-6 md:p-8' that squished the layout
    <div className="flex flex-col h-[65vh] md:h-[550px] w-full text-zinc-100">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 pb-4 border-b border-zinc-800 shrink-0 px-6 pt-4">
        <div className="flex gap-4 items-center">
          <input
            autoFocus={!isEditing}
            type="text"
            placeholder="Playlist Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg font-bold placeholder:text-zinc-600 focus:border-indigo-500 outline-none transition-colors"
          />

          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors border ${
              isPublic
                ? "bg-green-900/20 border-green-900 text-green-500"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {isPublic ? <Globe size={20} /> : <Lock size={20} />}
          </button>
        </div>

        {/* Mobile Tabs */}
        <div className="flex md:hidden bg-zinc-900 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("playlist")}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === "playlist"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-500"
            }`}
          >
            Setlist ({selectedItems.length})
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === "library"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-500"
            }`}
          >
            Library
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 flex overflow-hidden px-6 py-4 gap-6">
        {/* === LEFT COLUMN: SETLIST === */}
        <div
          className={`flex-1 flex-col bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden ${
            activeTab === "playlist" ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="p-3 border-b border-zinc-800 flex justify-between items-center shrink-0 bg-zinc-900">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Setlist
            </span>
            <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500 font-mono border border-zinc-700">
              {selectedItems.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {selectedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3">
                <Music size={32} className="opacity-20" />
                <p className="text-sm">Setlist is empty.</p>
                <button
                  onClick={() => setActiveTab("library")}
                  className="text-xs text-indigo-400 font-bold md:hidden"
                >
                  Add Songs
                </button>
              </div>
            ) : (
              selectedItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  draggable
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800 group transition-colors cursor-default md:cursor-grab md:active:cursor-grabbing"
                >
                  <div className="text-zinc-600 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={14} />
                  </div>

                  <div className="text-xs font-mono text-zinc-500 w-5 text-center">
                    {index + 1}.
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-zinc-300 group-hover:text-zinc-100">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-zinc-600 uppercase tracking-wide">
                      {item.region}
                    </div>
                  </div>

                  {/* Mobile Arrows */}
                  <div className="flex flex-col gap-1 md:hidden">
                    <button
                      onClick={() => moveItem(index, "up")}
                      disabled={index === 0}
                      className="text-zinc-600 hover:text-white disabled:opacity-20"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveItem(index, "down")}
                      disabled={index === selectedItems.length - 1}
                      className="text-zinc-600 hover:text-white disabled:opacity-20"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* === RIGHT COLUMN: LIBRARY === */}
        <div
          className={`flex-1 flex-col bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden ${
            activeTab === "library" ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="p-3 border-b border-zinc-800 shrink-0 bg-zinc-900">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={14}
              />
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 text-xs py-2 pl-9 pr-3 rounded-lg border border-zinc-800 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredLibrary.map((item) => {
              // --- FLASH LOGIC HERE ---
              const isAdded = addedId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  // If added, flash green background
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left group transition-all duration-300 ${
                    isAdded ? "bg-green-900/20" : "hover:bg-zinc-800"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div
                      className={`text-sm font-medium truncate transition-colors ${
                        isAdded
                          ? "text-green-200"
                          : "text-zinc-400 group-hover:text-zinc-200"
                      }`}
                    >
                      {item.title}
                    </div>
                    <div className="text-[10px] text-zinc-600">
                      {item.region}
                    </div>
                  </div>

                  {/* Icon Box: Flashes Green + Checkmark on success */}
                  <div
                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-300 shrink-0 ${
                      isAdded
                        ? "border-green-500 bg-green-500 text-white scale-110"
                        : "border-zinc-700 group-hover:border-indigo-500 group-hover:bg-indigo-500/20 text-zinc-500 group-hover:text-indigo-400"
                    }`}
                  >
                    {isAdded ? (
                      <Check size={14} className="stroke-[3]" />
                    ) : (
                      <Plus size={14} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800 mt-auto shrink-0 px-6 pb-4">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all text-sm hover:scale-105 active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          {isEditing ? "Save" : "Create"}
        </button>
      </div>
    </div>
  );
}
