"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, Plus, X, Music, Loader2, GripVertical } from "lucide-react";
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
  const [step, setStep] = useState<1 | 2>(isEditing ? 2 : 1);
  const [title, setTitle] = useState(initialData?.title || "");
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
    // AUDIO ONLY FILTER
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

  // --- DRAG AND DROP ---
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

  const handleAddItem = (item: any) =>
    setSelectedItems([...selectedItems, item]);

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

    // 1. Header
    if (isEditing) {
      const { error } = await supabase
        .from("playlists")
        .update({ title })
        .eq("id", playlistId);
      if (error) {
        setIsSaving(false);
        setToast({ msg: "Error updating title", type: "error" });
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("playlists")
        .insert({ title, user_id: user.id })
        .select()
        .single();
      if (error) {
        setIsSaving(false);
        setToast({ msg: "Error creating playlist", type: "error" });
        return;
      }
      playlistId = data.id;
    }

    // 2. Items
    if (isEditing) {
      const { error: delError } = await supabase
        .from("playlist_items")
        .delete()
        .eq("playlist_id", playlistId);
      if (delError) {
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

      const { error: insertError } = await supabase
        .from("playlist_items")
        .insert(itemsToInsert);
      if (insertError) {
        setIsSaving(false);
        setToast({ msg: "Error saving tracks", type: "error" });
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
    <div
      className={`space-y-4 text-zinc-100 flex flex-col transition-all duration-300 ${
        step === 2 ? "h-[60vh] md:h-[500px]" : "h-auto"
      }`}
    >
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {step === 1 ? (
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Playlist Name
            </label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Rehearsal Mix"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                if (title.trim()) setStep(2);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 h-full overflow-hidden">
          {/* LEFT: SELECTED */}
          <div className="flex-1 flex flex-col bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="p-3 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent font-bold outline-none w-full mr-2"
              />
              <span className="text-xs text-zinc-500 whitespace-nowrap">
                {selectedItems.length} tracks
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {selectedItems.length === 0 && (
                <div className="text-center text-zinc-500 mt-10 text-sm">
                  Drag audio here
                </div>
              )}

              {selectedItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  draggable
                  className="flex items-center gap-3 p-2 bg-zinc-800 rounded-lg cursor-grab active:cursor-grabbing hover:bg-zinc-700 group border border-transparent hover:border-zinc-600 transition-colors"
                >
                  <div className="text-zinc-500 cursor-grab">
                    <GripVertical size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-zinc-500">{item.region}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: LIBRARY */}
          <div className="w-full md:w-64 flex flex-col bg-zinc-900/30 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="p-3 border-b border-zinc-800">
              <input
                type="text"
                placeholder="Search audio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 text-sm p-2 rounded border border-zinc-800 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredLibrary.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="w-full flex items-center justify-between p-2 hover:bg-zinc-800 rounded text-left group transition-colors"
                >
                  <span className="text-sm truncate w-32">{item.title}</span>
                  <Plus
                    size={14}
                    className="text-zinc-500 group-hover:text-white"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="flex justify-between pt-2 border-t border-zinc-800">
          <button
            onClick={() => setStep(1)}
            className="text-zinc-400 hover:text-white"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            {isSaving && <Loader2 className="animate-spin" size={16} />}{" "}
            {isEditing ? "Save Changes" : "Create Playlist"}
          </button>
        </div>
      )}
    </div>
  );
}
