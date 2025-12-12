"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, Video, ListMusic, User } from "lucide-react";

interface MobileNavProps {
  onUpload: () => void; // We keep the prop type to avoid breaking parents, but ignore it here
}

export default function MobileNav({ onUpload }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/music", label: "Music", icon: <Music size={24} /> },
    { href: "/videos", label: "Video", icon: <Video size={24} /> },
    { href: "/playlists", label: "Lists", icon: <ListMusic size={24} /> },
    { href: "/profile", label: "Me", icon: <User size={24} /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-900 pb-safe z-50">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                isActive
                  ? "text-indigo-500"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <div
                className={`transition-transform duration-200 ${
                  isActive ? "scale-110" : "scale-100"
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] font-bold tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
