"use client";

import Link from "next/link";
import {
  Layers,
  User,
  Music,
  Video,
  ArrowRight,
  Upload,
  Calendar as CalIcon,
  MapPin,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { format, parseISO } from "date-fns"; // <--- Import date-fns

// Hooks
import { useProfile, useRecentMedia, useEvents } from "@/hooks/useTroupeData"; // <--- Added useEvents

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
  const { data: allEvents = [] } = useEvents(); // <--- Fetch Events

  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const isAdmin = profile?.role === "admin" || profile?.role === "teacher";

  // FILTER: Only show future events, limited to next 3
  const upcomingEvents = allEvents
    .filter((event: any) => new Date(event.start_time) >= new Date())
    .slice(0, 3);

  return (
    <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
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
        onUploadSuccess={() => {}}
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

      <div className="max-w-5xl mx-auto space-y-8">
        {/* 1. WELCOME & ANNOUNCEMENT */}
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

        {/* 3. UPCOMING EVENTS (NEW SECTION) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-zinc-500 text-xs font-bold uppercase">
              Upcoming Events
            </h3>
            <Link
              href="/calendar"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View Calendar <ArrowRight size={12} />
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-zinc-600 text-sm italic px-1 p-4 border border-zinc-900 rounded-xl bg-zinc-900/30">
              No upcoming events scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {upcomingEvents.map((event: any) => {
                const startDate = parseISO(event.start_time);
                return (
                  <Link
                    key={event.id}
                    href="/calendar"
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-3 rounded-xl flex items-start gap-3 transition-colors group"
                  >
                    {/* Date Box */}
                    <div className="flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 rounded-lg w-12 h-12 shrink-0 group-hover:border-indigo-500/50 transition-colors">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase leading-none">
                        {format(startDate, "MMM")}
                      </span>
                      <span className="text-lg font-bold text-white leading-none mt-0.5">
                        {format(startDate, "d")}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-zinc-200 truncate group-hover:text-white">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {format(startDate, "h:mm a")}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 truncate max-w-[80px]">
                            <MapPin size={12} /> {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. JUST IN (Compact List) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-zinc-500 text-xs font-bold uppercase">
              Just In
            </h3>
          </div>

          {recentMedia.length === 0 ? (
            <div className="text-zinc-600 text-sm italic px-1">
              No recent uploads.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentMedia.slice(0, 3).map((item) => (
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
