"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  Plus,
  X,
  Music,
  Loader2,
  Save,
  GripVertical,
  Globe,
  Lock,
  ListMusic,
} from "lucide-react";
import Toast from "@/components/Toast";

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
  ); // Mobile Tab State

  const [library, setLibrary] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

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
    const { data } = await supabase
      .from("playlist_items")
      .select("*, media_items(*)")
      .eq("playlist_id", initialData.id)
      .order("order_index");

    if (data) {
      const formatted = data.map((item: any) => item.media_items);
      setSelectedItems(formatted);
    }
  };

  // --- DRAG & DROP ---
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

  const handleAddItem = (item: any) => {
    setSelectedItems([...selectedItems, item]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
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
    // FIX: Adjusted height logic for better mobile/desktop fit
    <div className="flex flex-col h-[85vh] md:h-[600px] w-full text-zinc-100">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* --- HEADER --- */}
      {/* FIX: Increased padding-bottom (pb-6) for better spacing from the line */}
      <div className="flex flex-col gap-4 pb-6 border-zinc-800 shrink-0">
        {/* Row 1: Inputs */}
        <div className="flex gap-3">
          <input
            autoFocus={!isEditing}
            type="text"
            placeholder="Playlist Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 text-lg font-bold placeholder:font-normal placeholder:text-zinc-600 transition-colors"
          />

          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`w-12 flex items-center justify-center rounded-lg transition-colors border ${
              isPublic
                ? "bg-green-900/20 border-green-900 text-green-500"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
            title={isPublic ? "Public Playlist" : "Private Playlist"}
          >
            {isPublic ? <Globe size={20} /> : <Lock size={20} />}
          </button>
        </div>

        {/* Row 2: Mobile Tabs (Hidden on Desktop) */}
        <div className="flex md:hidden bg-zinc-900 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("playlist")}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === "playlist"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Review Tracks ({selectedItems.length})
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === "library"
                ? "bg-zinc-800 text-white shadow"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Add Songs
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex overflow-hidden gap-6 mt-4">
        {/* LEFT: PLAYLIST (Visible if Desktop OR Mobile Tab is Playlist) */}
        <div
          className={`flex-1 flex-col bg-zinc-900/30 rounded-xl border border-zinc-800 overflow-hidden ${
            activeTab === "playlist" ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Setlist
            </span>
            <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-mono">
              {selectedItems.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {selectedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3">
                <div className="p-4 bg-zinc-800/50 rounded-full">
                  <ListMusic size={32} className="opacity-40" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">No tracks yet.</p>
                  <p className="text-xs opacity-70">Add from the library.</p>
                </div>
                <button
                  onClick={() => setActiveTab("library")}
                  className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full font-bold md:hidden mt-2"
                >
                  Go to Library
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
                  className="flex items-center gap-3 p-3 bg-zinc-900/80 border border-zinc-800/50 rounded-lg group hover:border-zinc-600 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <div className="text-zinc-600 cursor-grab hover:text-zinc-400">
                    <GripVertical size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-zinc-300">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-zinc-600 uppercase tracking-wide">
                      {item.region}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: LIBRARY (Visible if Desktop OR Mobile Tab is Library) */}
        <div
          className={`w-full md:w-72 flex-col bg-zinc-900/30 rounded-xl border border-zinc-800 overflow-hidden ${
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
                placeholder="Search songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 text-xs py-2.5 pl-9 pr-3 rounded-lg border border-zinc-800 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
            {filteredLibrary.map((item) => (
              <button
                key={item.id}
                onClick={() => handleAddItem(item)}
                className="w-full flex items-center justify-between p-2.5 hover:bg-zinc-800 rounded-lg text-left group transition-colors border border-transparent hover:border-zinc-700"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-sm font-medium truncate text-zinc-400 group-hover:text-zinc-200">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-zinc-600">{item.region}</div>
                </div>
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <Plus
                    size={14}
                    className="text-zinc-500 group-hover:text-white shrink-0"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="flex justify-end gap-3 pt-6 border-zinc-800 mt-auto shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all text-sm hover:scale-105 active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          {isEditing ? "Save Changes" : "Create"}
        </button>
      </div>
    </div>
  );
}
