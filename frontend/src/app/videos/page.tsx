"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Video, PlusCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import MediaCard from "@/components/MediaCard";
import PracticeStudio from "@/components/PracticeStudio";
import UploadModal from "@/components/UploadModal";

export default function VideoPage() {
  const router = useRouter();
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [currentMedia, setCurrentMedia] = useState<any>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("media_items")
      .select("*")
      .eq("media_type", "video") // <--- FILTER FOR VIDEO
      .order("title");

    if (data) setMediaItems(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row pb-20 md:pb-0">
      <PracticeStudio
        media={currentMedia}
        onClose={() => setCurrentMedia(null)}
      />
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchVideos}
        defaultType="video"
      />

      <Sidebar onUpload={() => setIsUploadOpen(true)} />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="text-indigo-400" /> Video Library
            </h1>
            <p className="text-zinc-400">Choreography and rehearsal footage.</p>
          </div>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <PlusCircle size={20} />{" "}
            <span className="hidden sm:inline">Upload Video</span>
          </button>
        </div>

        {loading ? (
          <div className="text-zinc-500 animate-pulse">Loading library...</div>
        ) : mediaItems.length === 0 ? (
          <div className="h-64 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 gap-4">
            <Video size={48} className="opacity-20" />
            <p>No videos found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaItems.map((item) => (
              <MediaCard
                key={item.id}
                title={item.title}
                region={item.region}
                type="video"
                onClick={() => setCurrentMedia(item)}
              />
            ))}
          </div>
        )}
      </main>

      <MobileNav onUpload={() => setIsUploadOpen(true)} />
    </div>
  );
}
