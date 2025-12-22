"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  Music,
  Video,
  ListMusic,
  User,
  //Layers,
  Shield,
} from "lucide-react";
import { useProfile } from "@/hooks/useTroupeData";
import NotificationBell from "@/components/NotificationBell";
import BrandLogo from "@/components/BrandLogo";

// Made prop optional (?) to prevent TypeScript errors in layout.tsx
interface SidebarProps {
  onUpload?: () => void;
}

export default function Sidebar({ onUpload }: SidebarProps) {
  const pathname = usePathname();
  const { data: profile } = useProfile();

  // 1. HIDE ON PUBLIC PAGES
  // Add any other public routes here (e.g. /forgot-password)
  if (["/login", "/join-troupe", "/", "/update-password"].includes(pathname)) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Home", icon: <Home size={20} /> },
    { href: "/calendar", label: "Calendar", icon: <CalendarDays size={20} /> },
    { href: "/music", label: "Music", icon: <Music size={20} /> },
    { href: "/videos", label: "Videos", icon: <Video size={20} /> },
    { href: "/playlists", label: "Playlists", icon: <ListMusic size={20} /> },
    { href: "/profile", label: "Profile", icon: <User size={20} /> },
  ];

  if (profile?.role === "admin") {
    navItems.push({
      href: "/admin",
      label: "Admin",
      icon: <Shield size={20} />,
    });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 h-screen sticky top-0 shrink-0 z-50">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            {/* <Layers size={18} className="text-white" /> */}
            <BrandLogo size={35} />
          </div>
          <Link href="/dashboard">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Sarape
            </h1>
          </Link>
        </div>

        <NotificationBell align="left" />
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
