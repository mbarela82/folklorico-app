"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Home,
  ListMusic,
  Music,
  Video,
  PlusCircle,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  onUpload?: () => void;
}

export default function Sidebar({ onUpload }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 p-6 bg-zinc-900/50 sticky top-0 h-screen text-zinc-100">
      <h1 className="text-xl font-bold mb-8 text-indigo-400 flex items-center gap-2">
        <Music size={24} /> Troupe App
      </h1>

      <nav className="flex-1 space-y-2">
        <Link href="/dashboard" className="block">
          <NavItem
            icon={<Home size={20} />}
            label="Home"
            active={pathname === "/dashboard"}
          />
        </Link>

        <Link href="/playlists" className="block">
          <NavItem
            icon={<ListMusic size={20} />}
            label="Playlists"
            active={pathname.startsWith("/playlists")}
          />
        </Link>

        <div className="pt-4 pb-2 text-xs font-bold text-zinc-600 uppercase tracking-wider">
          Library
        </div>

        {/* NEW LINKS */}
        <Link href="/music" className="block">
          <NavItem
            icon={<Music size={20} />}
            label="Music"
            active={pathname === "/music"}
          />
        </Link>

        <Link href="/videos" className="block">
          <NavItem
            icon={<Video size={20} />}
            label="Videos"
            active={pathname === "/videos"}
          />
        </Link>

        {onUpload && (
          <button onClick={onUpload} className="w-full mt-4">
            <NavItem icon={<PlusCircle size={20} />} label="Upload Media" />
          </button>
        )}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors mt-auto p-2 hover:bg-zinc-800 rounded-lg"
      >
        <LogOut size={20} /> <span>Sign Out</span>
      </button>
    </aside>
  );
}

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
          ? "bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-500/20"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
