"use client";

import Link from "next/link";
import { Layers, User, Music, Video, ArrowRight, Upload } from "lucide-react";
import { useState } from "react";

// Hooks
import { useProfile, useRecentMedia } from "@/hooks/useTroupeData";

// Components
import AnnouncementBanner from "@/components/AnnouncementBanner";
import MediaCard from "@/components/MediaCard";
import PracticeStudio from "@/components/PracticeStudio";
import UploadModal from "@/components/UploadModal";

// Types
import { Database } from "@/types/supabase";
type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];

export default function Dashboard() {
  const { data: profile } = useProfile();
  const { data: recentMedia = [] } = useRecentMedia();

  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const isAdmin = profile?.role === "admin" || profile?.role === "teacher";

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full pb-24 md:pb-8">
      {currentMedia && (
        <PracticeStudio
          media={currentMedia as any}
          onClose={() => setCurrentMedia(null)}
        />
      )}

      {/* Upload Modal (Triggered by Quick Action) */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {}} // React Query handles the refresh
      />

      {/* --- MOBILE BRAND HEADER --- */}
      <div className="md:hidden flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Layers size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Sarape
          </h1>
        </div>
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

      {/* 1. WELCOME & ANNOUNCEMENT */}
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white px-1">
            Hola,{" "}
            <span className="text-indigo-400">
              {profile?.display_name || "Dancer"}
            </span>
          </h2>
          <AnnouncementBanner />
        </div>

        {/* 2. QUICK ACTIONS */}
        <div>
          <h3 className="text-zinc-500 text-xs font-bold uppercase mb-3 px-1">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/music"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Music size={20} />
              </div>
              <span className="font-bold text-sm">Practice Music</span>
            </Link>

            <Link
              href="/videos"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video size={20} />
              </div>
              <span className="font-bold text-sm">Watch Videos</span>
            </Link>

            {isAdmin ? (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload size={20} />
                </div>
                <span className="font-bold text-sm">Upload New</span>
              </button>
            ) : (
              <Link
                href="/playlists"
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers size={20} />
                </div>
                <span className="font-bold text-sm">My Lists</span>
              </Link>
            )}

            <Link
              href="/profile"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User size={20} />
              </div>
              <span className="font-bold text-sm">Profile</span>
            </Link>
          </div>
        </div>

        {/* 3. JUST IN (Compact List) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-zinc-500 text-xs font-bold uppercase">
              Just In
            </h3>
            {/* Optional 'View All' link could go here */}
          </div>

          {recentMedia.length === 0 ? (
            <div className="text-zinc-600 text-sm italic px-1">
              No recent uploads.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentMedia.slice(0, 3).map((item) => (
                // Using the existing MediaCard but constrained in a smaller grid
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

          {recentMedia.length > 0 && (
            <div className="mt-4 flex justify-center md:justify-start">
              <Link
                href="/music"
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                View all library <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
