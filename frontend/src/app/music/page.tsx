"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Music,
  PlusCircle,
  MapPin,
  Filter,
  Folder,
  ChevronLeft,
} from "lucide-react";

// --- IMPORTS ---
import { supabase } from "@/lib/supabaseClient";
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

function MusicContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const playId = searchParams.get("play");

  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Hooks
  const { data: regions = [] } = useRegions("audio");

  // We always fetch based on selection, but if "All" is selected, we get everything
  // which allows us to calculate counts for the folders.
  const { data: mediaItems = [], isLoading } = useMediaLibrary(
    "audio",
    selectedRegion
  );

  const { data: profile } = useProfile();
  const isAdmin = profile?.role === "admin" || profile?.role === "teacher";

  // Local State
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

  // --- Derived State for View Mode ---
  const isFolderView = selectedRegion === "All";

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

  // Calculate counts for folders when in "All" view
  const getRegionCount = (regionName: string) => {
    if (!isFolderView) return 0;
    return mediaItems.filter((item) => item.region === regionName).length;
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["media", "audio"] });
    queryClient.invalidateQueries({ queryKey: ["regions", "audio"] });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setToast({ msg: "You must be logged in to delete", type: "error" });
        return;
      }

      const response = await fetch(`${API_URL}/media/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to delete media");
      }

      refreshData();
      setToast({ msg: "Track deleted successfully", type: "success" });
    } catch (error: any) {
      console.error(error);
      setToast({ msg: error.message || "Error deleting item", type: "error" });
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

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
        <div>
          {/* Breadcrumb / Title Logic */}
          <div className="flex items-center gap-2 mb-1">
            {!isFolderView && (
              <button
                onClick={() => setSelectedRegion("All")}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Music className="text-indigo-400" />
              {isFolderView ? "Music Library" : selectedRegion}
            </h1>
          </div>
          <p className="text-zinc-400 pl-1">
            {isFolderView
              ? "Select a region folder to view tracks."
              : "Master tracks for practice."}
          </p>
        </div>

        <div className="flex flex-row gap-3 w-full md:w-auto items-center">
          {/* Region Dropdown - Acts as Quick Jump */}
          <div className="relative flex-1 sm:w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              {isFolderView ? <Folder size={16} /> : <MapPin size={16} />}
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

      {/* Main Content Area */}
      {isLoading ? (
        <div className="text-zinc-500 animate-pulse">Loading library...</div>
      ) : (
        <>
          {/* FOLDER VIEW: Show Grid of Regions */}
          {isFolderView ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {regions.map((region) => {
                const count = getRegionCount(region);
                return (
                  <div
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className="group relative bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col items-start gap-4 cursor-pointer hover:bg-zinc-800 hover:border-indigo-500/30 transition-all hover:shadow-lg hover:shadow-indigo-500/5"
                  >
                    <div className="p-3 bg-zinc-950 rounded-xl text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all">
                      <Folder
                        size={28}
                        fill="currentColor"
                        className="opacity-20 absolute"
                      />
                      <Folder size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-zinc-100 group-hover:text-white">
                        {region}
                      </h3>
                      <p className="text-sm text-zinc-500">
                        {count} {count === 1 ? "track" : "tracks"}
                      </p>
                    </div>
                  </div>
                );
              })}

              {regions.length === 0 && (
                <div className="col-span-full h-40 flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                  No regions found.
                </div>
              )}
            </div>
          ) : (
            /* FILE VIEW: Show Filter Bar & Media Cards */
            <>
              <div className="mb-6">
                <TagFilterBar
                  availableTags={availableTags}
                  selectedTag={filterTag}
                  onSelectTag={setFilterTag}
                />
              </div>

              {filteredItems.length === 0 ? (
                <div className="h-64 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 gap-4">
                  <Music size={48} className="opacity-20" />
                  <p>No audio tracks found in {selectedRegion}.</p>
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
                      onDelete={
                        isAdmin ? () => setDeleteId(item.id) : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function MusicPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-zinc-500">Loading Music...</div>}
    >
      <MusicContent />
    </Suspense>
  );
}
