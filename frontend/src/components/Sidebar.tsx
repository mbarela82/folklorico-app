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
  Layers, // Logo Icon
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
    <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 p-6 bg-zinc-950 sticky top-0 h-screen text-zinc-100">
      {/* BRAND HEADER */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Layers size={18} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Sarape</h1>
      </div>

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

        <div className="pt-6 pb-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest pl-2">
          Library
        </div>

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
          <button onClick={onUpload} className="w-full mt-6">
            <NavItem icon={<PlusCircle size={20} />} label="Upload Media" />
          </button>
        )}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 text-zinc-500 hover:text-red-400 transition-colors mt-auto p-3 hover:bg-zinc-900 rounded-xl text-sm font-medium"
      >
        <LogOut size={18} /> <span>Sign Out</span>
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
        active
          ? "bg-zinc-900 border-zinc-800 text-white font-medium shadow-sm"
          : "border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </div>
  );
}
