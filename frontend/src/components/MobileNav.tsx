"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, Video, ListMusic, User, Shield } from "lucide-react";
import { useProfile } from "@/hooks/useTroupeData";

interface MobileNavProps {
  onUpload: () => void;
}

export default function MobileNav({ onUpload }: MobileNavProps) {
  const pathname = usePathname();

  // 1. Check Role from Cache
  const { data: profile } = useProfile();
  const isAdmin = profile?.role === "admin";

  // 2. Streamlined Navigation (No Home, No Upload)
  const navItems = [
    { href: "/music", label: "Music", icon: <Music size={20} /> },
    { href: "/videos", label: "Videos", icon: <Video size={20} /> },
    { href: "/playlists", label: "Lists", icon: <ListMusic size={20} /> },
  ];

  // 3. Add Admin Link if authorized
  if (isAdmin) {
    navItems.push({
      href: "/admin",
      label: "Admin",
      icon: <Shield size={20} />,
    });
  }

  // 4. Profile is always last
  navItems.push({
    href: "/profile",
    label: "Profile",
    icon: <User size={20} />,
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800 pb-safe z-50">
      <div className="flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isActive
                  ? "text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
