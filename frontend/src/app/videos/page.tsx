"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Video, PlusCircle, MapPin, Filter } from "lucide-react";

// --- IMPORTS ---
import { supabase } from "@/lib/supabaseClient"; // Clean, top-level import
import API_URL from "@/lib/api";
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

function VideoContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const playId = searchParams.get("play");

  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const { data: regions = [] } = useRegions("video");
  const { data: mediaItems = [], isLoading } = useMediaLibrary(
    "video",
    selectedRegion
  );
  const { data: profile } = useProfile();
  const isAdmin = profile?.role === "admin" || profile?.role === "teacher";

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

  useEffect(() => {
    if (playId && mediaItems.length > 0) {
      const targetItem = mediaItems.find((item) => item.id === playId);
      if (targetItem) setCurrentMedia(targetItem);
    }
  }, [playId, mediaItems]);

  const availableTags = useMemo(() => {
    const allTags = mediaItems.flatMap((item) => item.tags || []);
    return Array.from(new Set(allTags)).sort();
  }, [mediaItems]);

  const filteredItems = mediaItems.filter((item) => {
    if (!filterTag) return true;
    return item.tags && item.tags.includes(filterTag);
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["media", "video"] });
    queryClient.invalidateQueries({ queryKey: ["regions", "video"] });
  };

  // --- FIXED DELETE FUNCTION ---
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      // 1. Get Session Token Cleanly
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setToast({ msg: "You must be logged in to delete", type: "error" });
        return;
      }

      // 2. Call Backend with Token
      const response = await fetch(`${API_URL}/media/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to delete video");
      }

      refreshData();
      setToast({ msg: "Video deleted successfully", type: "success" });
    } catch (error: any) {
      console.error(error);
      setToast({ msg: error.message || "Error deleting video", type: "error" });
    }
    setDeleteId(null);
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto h-full pb-24 md:pb-8">
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
          onClose={() => setCurrentMedia(null)}
        />
      )}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          refreshData();
          setToast({ msg: "Upload Complete", type: "success" });
        }}
        defaultType="video"
      />

      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Edit Video"
      >
        {editingItem && (
          <EditMediaForm
            mediaItem={editingItem}
            onSuccess={() => {
              setEditingItem(null);
              refreshData();
              setToast({ msg: "Video Updated", type: "success" });
            }}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </Modal>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Video?"
        message="This will remove the file permanently. It cannot be undone."
        type="danger"
        confirmText="Yes, Delete"
      />

      {/* Header and Grid */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="text-indigo-400" /> Video Library
          </h1>
          <p className="text-zinc-400">Choreography and rehearsal footage.</p>
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

      <div className="mb-6">
        <TagFilterBar
          availableTags={availableTags}
          selectedTag={filterTag}
          onSelectTag={setFilterTag}
        />
      </div>

      {isLoading ? (
        <div className="text-zinc-500 animate-pulse">Loading library...</div>
      ) : filteredItems.length === 0 ? (
        <div className="h-64 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 gap-4">
          <Video size={48} className="opacity-20" />
          <p>No videos found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <MediaCard
              key={item.id}
              title={item.title}
              region={item.region || ""}
              type="video"
              thumbnailUrl={item.thumbnail_url}
              tags={item.tags}
              onClick={() => setCurrentMedia(item)}
              onEdit={isAdmin ? () => setEditingItem(item) : undefined}
              onDelete={isAdmin ? () => setDeleteId(item.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VideoPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-zinc-500">Loading Videos...</div>}
    >
      <VideoContent />
    </Suspense>
  );
}
