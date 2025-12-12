"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Music, PlusCircle, MapPin, Filter, Layers } from "lucide-react";

// Types
import { Database } from "@/types/supabase";
type MediaItemWithTags = Database["public"]["Tables"]["media_items"]["Row"] & {
  tags?: string[];
};

import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import MediaCard from "@/components/MediaCard";
import PracticeStudio from "@/components/PracticeStudio";
import UploadModal from "@/components/UploadModal";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";
import EditMediaForm from "@/components/EditMediaForm";
import Toast from "@/components/Toast";
import TagFilterBar from "@/components/TagFilterBar";

export default function MusicPage() {
  const router = useRouter();

  // Data State
  const [mediaItems, setMediaItems] = useState<MediaItemWithTags[]>([]);
  const [currentMedia, setCurrentMedia] = useState<MediaItemWithTags | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [regions, setRegions] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // UI State
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
    fetchRegions();
    fetchMusic();
  }, [selectedRegion]);

  // Calculate unique tags from the currently loaded media
  const availableTags = useMemo(() => {
    const allTags = mediaItems.flatMap((item) => item.tags || []);
    return Array.from(new Set(allTags)).sort();
  }, [mediaItems]);

  const fetchRegions = async () => {
    const { data } = await supabase
      .from("media_items")
      .select("region")
      .eq("media_type", "audio")
      .order("region");

    if (data) {
      const unique = Array.from(
        new Set(data.map((item) => item.region).filter(Boolean) as string[])
      );
      setRegions(unique);
    }
  };

  const fetchMusic = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);

    let query = supabase
      .from("media_items")
      .select(
        `
        *,
        media_tags (
          tags (name)
        )
      `
      )
      .eq("media_type", "audio")
      .order("title");

    if (selectedRegion !== "All") query = query.eq("region", selectedRegion);

    const { data, error } = await query;

    if (!error && data) {
      const formatted = data.map((item: any) => ({
        ...item,
        tags: item.media_tags.map((mt: any) => mt.tags.name),
      }));
      setMediaItems(formatted);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/media/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete media");

      setMediaItems(mediaItems.filter((item) => item.id !== deleteId));
      fetchRegions();
      setToast({ msg: "Track deleted successfully", type: "success" });
    } catch (error) {
      console.error(error);
      setToast({ msg: "Error deleting item", type: "error" });
    }
    setDeleteId(null);
  };

  const filteredItems = mediaItems.filter((item) => {
    if (!filterTag) return true;
    return item.tags && item.tags.includes(filterTag);
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row pb-20 md:pb-0">
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
          fetchMusic();
          fetchRegions();
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
              fetchMusic();
              fetchRegions();
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

      <Sidebar onUpload={() => setIsUploadOpen(true)} />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        {/* MOBILE BRAND HEADER */}
        <div className="md:hidden flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Layers size={18} className="text-white" />
          </div>
          <Link href="/dashboard">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Sarape
            </h1>
          </Link>
        </div>

        {/* HEADER & CONTROLS */}
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
                className="w-full appearance-none bg-zinc-900 border border-zinc-700 text-white pl-10 pr-8 py-3 rounded-xl text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-zinc-800 transition-colors"
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

            {/* UPLOAD BUTTON (Visible on Mobile) */}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all shrink-0"
              title="Upload Music"
            >
              <PlusCircle size={20} />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>
        </div>

        {/* TAG FILTER BAR */}
        <div className="mb-6">
          <TagFilterBar
            availableTags={availableTags}
            selectedTag={filterTag}
            onSelectTag={setFilterTag}
          />
        </div>

        {/* LIST */}
        {loading ? (
          <div className="text-zinc-500 animate-pulse">Loading...</div>
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
                onEdit={() => setEditingItem(item)}
                onDelete={() => setDeleteId(item.id)}
              />
            ))}
          </div>
        )}
      </main>

      <MobileNav onUpload={() => setIsUploadOpen(true)} />
    </div>
  );
}
