"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Layers, User } from "lucide-react";

// Types
import { Database } from "@/types/supabase";
type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];

import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import UploadModal from "@/components/UploadModal";
import MediaCard from "@/components/MediaCard";
import PracticeStudio from "@/components/PracticeStudio";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data State
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);

  // Profile State
  const [profile, setProfile] = useState<{
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      // 2. Fetch Media
      await fetchMedia();
      setLoading(false);
    };
    initData();
  }, [router]);

  const fetchMedia = async () => {
    const { data, error } = await supabase
      .from("media_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setMediaItems(data || []);
    }
  };

  const handleUploadSuccess = () => {
    fetchMedia();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {currentMedia && (
        <PracticeStudio
          media={currentMedia as any}
          onClose={() => setCurrentMedia(null)}
        />
      )}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <Sidebar onUpload={() => setIsUploadOpen(true)} />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        {/* --- MOBILE HEADER --- */}
        <div className="md:hidden flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Layers size={18} className="text-white" />
            </div>
            <Link href="/dashboard">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Sarape
              </h1>
            </Link>
          </div>

          {/* Mobile Profile Avatar (Small) */}
          <Link href="/profile">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                <User size={14} className="text-zinc-500" />
              </div>
            )}
          </Link>
        </div>

        {/* --- WELCOME SECTION --- */}
        <div className="mb-8 flex items-center gap-4">
          {/* Desktop/Tablet Avatar */}
          <div className="hidden md:block w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-800 shadow-xl bg-zinc-900">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <User size={32} />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Welcome back,{" "}
              <span className="text-indigo-400">
                {profile?.display_name || "Dancer"}
              </span>
              !
            </h2>
            <p className="text-zinc-400 mt-1">
              Here is the latest from your troupe.
            </p>
          </div>
        </div>

        {/* --- CONTENT --- */}
        {mediaItems.length === 0 ? (
          <div className="h-40 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
            No media uploaded yet. Click Upload to start!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 md:pb-0">
            {mediaItems.map((item) => (
              <MediaCard
                key={item.id}
                title={item.title}
                region={item.region || ""}
                type={item.media_type}
                thumbnailUrl={item.thumbnail_url}
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
