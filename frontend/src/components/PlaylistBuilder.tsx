"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  Plus,
  X,
  Save,
  Music,
  Video,
  ArrowUp,
  ArrowDown,
  ListMusic,
  Loader2,
} from "lucide-react";

// Matches your existing media_items structure
interface MediaItem {
  id: string;
  title: string;
  region: string;
  media_type: "audio" | "video";
}

export default function PlaylistBuilder() {
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch Library
  useEffect(() => {
    const fetchMedia = async () => {
      const { data } = await supabase
        .from("media_items") // Correct table name
        .select("*")
        .order("title");
      if (data) setLibrary(data);
    };
    fetchMedia();
  }, []);

  // 2. Handlers
  const addToPlaylist = (item: MediaItem) => {
    // Optional: Add logic here to prevent duplicates if you want
    setPlaylist([...playlist, item]);
  };

  const removeFromPlaylist = (index: number) => {
    const newPlaylist = [...playlist];
    newPlaylist.splice(index, 1);
    setPlaylist(newPlaylist);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === playlist.length - 1) return;

    const newPlaylist = [...playlist];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Swap items
    [newPlaylist[index], newPlaylist[targetIndex]] = [
      newPlaylist[targetIndex],
      newPlaylist[index],
    ];
    setPlaylist(newPlaylist);
  };

  const handleSave = async () => {
    if (!playlistTitle.trim() || playlist.length === 0) return;
    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to save.");
      setIsSaving(false);
      return;
    }

    // A. Create Playlist Header
    const { data: plistData, error: plistError } = await supabase
      .from("playlists")
      .insert({ title: playlistTitle, user_id: user.id })
      .select()
      .single();

    if (plistError || !plistData) {
      console.error(plistError);
      alert("Error saving playlist header");
      setIsSaving(false);
      return;
    }

    // B. Create Playlist Items (Linked to media_items)
    const itemsToInsert = playlist.map((item, index) => ({
      playlist_id: plistData.id,
      media_id: item.id,
      order_index: index,
    }));

    const { error: itemsError } = await supabase
      .from("playlist_items")
      .insert(itemsToInsert);

    setIsSaving(false);

    if (!itemsError) {
      alert("Playlist saved successfully!");
      setPlaylist([]);
      setPlaylistTitle("");
    } else {
      console.error(itemsError);
      alert("Error saving playlist items");
    }
  };

  // Filter library based on search
  const filteredLibrary = library.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
          <ListMusic size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Playlist Builder</h1>
          <p className="text-zinc-400">
            Create setlists for your performances.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[75vh]">
        {/* === LEFT COL: LIBRARY === */}
        <div className="flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900">
            <h2 className="font-bold text-zinc-300 mb-2">Library</h2>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Search songs, regions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredLibrary.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800 group transition-colors cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-800 rounded-full text-zinc-400">
                    {item.media_type === "video" ? (
                      <Video size={16} />
                    ) : (
                      <Music size={16} />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-zinc-500">{item.region}</div>
                  </div>
                </div>
                <button
                  onClick={() => addToPlaylist(item)}
                  className="p-2 bg-zinc-800 hover:bg-indigo-600 hover:text-white text-zinc-400 rounded-full transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* === RIGHT COL: STAGING AREA === */}
        <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
              Playlist Name
            </label>
            <input
              type="text"
              placeholder="e.g. Christmas Performance 2025"
              value={playlistTitle}
              onChange={(e) => setPlaylistTitle(e.target.value)}
              className="w-full bg-transparent text-2xl font-bold placeholder:text-zinc-700 outline-none border-b border-transparent focus:border-indigo-500 pb-2 transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-950/30">
            {playlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-xl">
                <ListMusic size={48} className="mb-4 opacity-20" />
                <p>Your setlist is empty.</p>
                <p className="text-xs">Add items from the library.</p>
              </div>
            ) : (
              playlist.map((item, index) => (
                <div
                  key={`${item.id}-${index}`} // Composite key
                  className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg group hover:border-zinc-700 transition-all"
                >
                  <div className="text-zinc-600 font-mono text-xs w-6 text-center">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <div className="font-medium text-sm text-zinc-200">
                      {item.title}
                    </div>
                    <div className="text-xs text-zinc-500">{item.region}</div>
                  </div>

                  {/* Reorder & Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col gap-0.5 mr-2">
                      <button
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="text-zinc-500 hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveItem(index, "down")}
                        disabled={index === playlist.length - 1}
                        className="text-zinc-500 hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromPlaylist(index)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-between items-center">
            <div className="text-xs text-zinc-500">{playlist.length} items</div>
            <button
              onClick={handleSave}
              disabled={isSaving || playlist.length === 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? "Saving..." : "Save Playlist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
