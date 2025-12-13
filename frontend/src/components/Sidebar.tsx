"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Home,
  Music,
  Video,
  ListMusic,
  User,
  Layers,
  Shield,
} from "lucide-react";

interface SidebarProps {
  onUpload: () => void;
  isAdmin?: boolean;
}

export default function Sidebar({ onUpload }: SidebarProps) {
  const pathname = usePathname();

  // FIX: Revert to standard state to prevent Hydration Error
  const [role, setRole] = useState<string>("dancer");

  useEffect(() => {
    // 1. FAST CHECK: specific to the client browser
    // This runs immediately after the component mounts
    const cached = localStorage.getItem("sarape_user_role");
    if (cached) {
      setRole(cached);
    }

    // 2. SECURITY CHECK: Verify with database in background
    const getRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (data) {
          // Update state and cache if it changed
          if (data.role !== cached) {
            setRole(data.role);
            localStorage.setItem("sarape_user_role", data.role);
          }
        }
      }
    };
    getRole();
  }, []);

  const navItems = [
    { href: "/dashboard", label: "Home", icon: <Home size={20} /> },
    { href: "/music", label: "Music", icon: <Music size={20} /> },
    { href: "/videos", label: "Videos", icon: <Video size={20} /> },
    { href: "/playlists", label: "Playlists", icon: <ListMusic size={20} /> },
    { href: "/profile", label: "Profile", icon: <User size={20} /> },
  ];

  // Dynamically add Admin Link
  if (role === "admin") {
    navItems.push({
      href: "/admin",
      label: "Admin",
      icon: <Shield size={20} />,
    });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 h-screen sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Layers size={18} className="text-white" />
        </div>
        <Link href="/dashboard">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Sarape
          </h1>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
