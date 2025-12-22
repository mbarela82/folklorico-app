"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Music, PlusCircle, MapPin, Filter, Layers } from "lucide-react";

import { useRegions, useMediaLibrary, useProfile } from "@/hooks/useTroupeData";
import MediaCard from "@/components/MediaCard";
import PracticeStudio from "@/components/PracticeStudio";
import UploadModal from "@/components/UploadModal";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";
import EditMediaForm from "@/components/EditMediaForm";
import Toast from "@/components/Toast";
import TagFilterBar from "@/components/TagFilterBar";
import { Database } from "@/types/supabase";

type MediaItemWithTags = Database["public"]["Tables"]["media_items"]["Row"] & {
  tags?: string[];
};

export default function MusicPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const playId = searchParams.get("play");

  // Filter State
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // DATA HOOKS
  const { data: regions = [] } = useRegions("audio");
  const { data: mediaItems = [], isLoading } = useMediaLibrary(
    "audio",
    selectedRegion
  );
  const { data: profile } = useProfile();
  const isAdmin = profile?.role === "admin" || profile?.role === "teacher";

  // UI State
  const [currentMedia, setCurrentMedia] = useState<MediaItemWithTags | null>(
    null
  );
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItemWithTags | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // --- DEEP LINKING LOGIC ---
  useEffect(() => {
    if (playId && mediaItems.length > 0) {
      const targetItem = mediaItems.find((item) => item.id === playId);
      if (targetItem) {
        setCurrentMedia(targetItem);
      }
    }
  }, [playId, mediaItems]);

  // Derived State (Tags)
  const availableTags = useMemo(() => {
    const allTags = mediaItems.flatMap((item) => item.tags || []);
    return Array.from(new Set(allTags)).sort();
  }, [mediaItems]);

  const filteredItems = mediaItems.filter((item) => {
    if (!filterTag) return true;
    return item.tags && item.tags.includes(filterTag);
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["media", "audio"] });
    queryClient.invalidateQueries({ queryKey: ["regions", "audio"] });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/media/${deleteId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete media");

      refreshData();
      setToast({ msg: "Track deleted successfully", type: "success" });
    } catch (error) {
      console.error(error);
      setToast({ msg: "Error deleting item", type: "error" });
    }
    setDeleteId(null);
  };

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full pb-24 md:pb-8">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {currentMedia && (
        <PracticeStudio
          media={currentMedia as any}
          onClose={() => {
            setCurrentMedia(null);
          }}
        />
      )}

      {/* MODALS */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          refreshData();
          setToast({ msg: "Upload Complete", type: "success" });
        }}
        defaultType="audio"
      />

      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Edit Track"
      >
        {editingItem && (
          <EditMediaForm
            mediaItem={editingItem}
            onSuccess={() => {
              setEditingItem(null);
              refreshData();
              setToast({ msg: "Track Updated", type: "success" });
            }}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </Modal>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Audio?"
        message="This will remove it from all playlists as well."
        type="danger"
        confirmText="Yes, Delete"
      />

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Music className="text-indigo-400" /> Music Library
          </h1>
          <p className="text-zinc-400">Master tracks for practice.</p>
        </div>

        <div className="flex flex-row gap-3 w-full md:w-auto items-center">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <MapPin size={16} />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full appearance-none bg-zinc-900 border border-zinc-700 text-white pl-10 pr-8 py-3 rounded-xl text-sm font-medium focus:border-indigo-500 outline-none cursor-pointer hover:bg-zinc-800 transition-colors"
            >
              <option value="All">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
              <Filter size={12} />
            </div>
          </div>

          {/* Only Show Upload Button if Admin/Teacher */}
          {isAdmin && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all shrink-0"
            >
              <PlusCircle size={20} />
              <span className="hidden sm:inline">Upload</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="mb-6">
        <TagFilterBar
          availableTags={availableTags}
          selectedTag={filterTag}
          onSelectTag={setFilterTag}
        />
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <div className="text-zinc-500 animate-pulse">Loading library...</div>
      ) : filteredItems.length === 0 ? (
        <div className="h-64 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 gap-4">
          <Music size={48} className="opacity-20" />
          <p>No audio tracks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <MediaCard
              key={item.id}
              title={item.title}
              region={item.region || ""}
              type="audio"
              thumbnailUrl={item.thumbnail_url}
              tags={item.tags}
              onClick={() => setCurrentMedia(item)}
              onEdit={isAdmin ? () => setEditingItem(item) : undefined}
              onDelete={isAdmin ? () => setDeleteId(item.id) : undefined}
            />
          ))}
        </div>
      )}
    </main>
  );
}
