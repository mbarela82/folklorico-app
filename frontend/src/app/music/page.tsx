"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Music, PlusCircle, MapPin, Filter } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import MediaCard from "@/components/MediaCard";
import PracticeStudio from "@/components/PracticeStudio";
import UploadModal from "@/components/UploadModal";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";
import EditMediaForm from "@/components/EditMediaForm";
import Toast from "@/components/Toast";

export default function MusicPage() {
  const router = useRouter();
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [currentMedia, setCurrentMedia] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [regions, setRegions] = useState<string[]>([]);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    fetchRegions();
    fetchMusic();
  }, [selectedRegion]);

  const fetchRegions = async () => {
    const { data } = await supabase
      .from("media_items")
      .select("region")
      .eq("media_type", "audio")
      .order("region");

    if (data) {
      const unique = Array.from(
        new Set(data.map((item) => item.region).filter(Boolean))
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
      .select("*")
      .eq("media_type", "audio")
      .order("title");

    if (selectedRegion !== "All") {
      query = query.eq("region", selectedRegion);
    }

    const { data, error } = await query;
    if (error) console.error("Error fetching music:", error);
    else setMediaItems(data || []);

    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("media_items")
      .delete()
      .eq("id", deleteId);
    if (error) {
      setToast({ msg: "Error deleting item", type: "error" });
    } else {
      setMediaItems(mediaItems.filter((item) => item.id !== deleteId));
      fetchRegions();
      setToast({ msg: "Track deleted", type: "success" });
    }
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row pb-20 md:pb-0">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <PracticeStudio
        media={currentMedia}
        onClose={() => setCurrentMedia(null)}
      />

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
        {/* HEADER: Stacked on Mobile, Row on Desktop */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Music className="text-indigo-400" /> Music Library
            </h1>
            <p className="text-zinc-400">Master tracks for practice.</p>
          </div>

          {/* CONTROLS CONTAINER */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* 1. REGION FILTER (Full width on mobile) */}
            <div className="relative w-full sm:w-64">
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

            {/* 2. UPLOAD BUTTON (Full width on mobile) */}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="hidden sm:flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
            >
              <PlusCircle size={20} /> <span>Upload</span>
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-zinc-500 animate-pulse">Loading library...</div>
        ) : mediaItems.length === 0 ? (
          <div className="h-64 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 gap-4">
            <Music size={48} className="opacity-20" />
            <p>
              {selectedRegion !== "All"
                ? `No music found in "${selectedRegion}"`
                : "No audio tracks found."}
            </p>
            {selectedRegion !== "All" && (
              <button
                onClick={() => setSelectedRegion("All")}
                className="text-indigo-400 hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaItems.map((item) => (
              <MediaCard
                key={item.id}
                title={item.title}
                region={item.region}
                type="audio"
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
