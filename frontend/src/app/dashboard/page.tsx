"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Required for navigation
import { supabase } from "@/lib/supabaseClient";
import {
  LogOut,
  Music,
  Video,
  PlusCircle,
  Home,
  ListMusic, // Import the Playlist Icon
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import UploadModal from "@/components/UploadModal";
import MediaCard from "@/components/MediaCard";
import PracticeStudio from "@/components/PracticeStudio";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [currentMedia, setCurrentMedia] = useState<any>(null);

  useEffect(() => {
    const initData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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
      <PracticeStudio
        media={currentMedia}
        onClose={() => setCurrentMedia(null)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* --- SIDEBAR (Desktop) --- */}
      <Sidebar onUpload={() => setIsUploadOpen(true)} />

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="md:hidden flex justify-between items-center mb-6">
          <h1 className="text-lg font-bold text-indigo-400">Troupe App</h1>
          <button onClick={handleLogout} className="text-zinc-400">
            <LogOut size={20} />
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold">Welcome back!</h2>
          <p className="text-zinc-400">Here is your troupe's collection.</p>
        </div>

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
                region={item.region}
                type={item.media_type}
                onClick={() => setCurrentMedia(item)}
              />
            ))}
          </div>
        )}
      </main>

      {/* --- BOTTOM NAV (Mobile) --- */}
      <MobileNav onUpload={() => setIsUploadOpen(true)} />
    </div>
  );
}

// Helpers
function NavItem({
  icon,
  label,
  active,
}: {
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? "bg-indigo-600/10 text-indigo-400"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  );
}

function MobileNavItem({
  icon,
  label,
  active,
}: {
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 ${
        active ? "text-indigo-400" : "text-zinc-500"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}
