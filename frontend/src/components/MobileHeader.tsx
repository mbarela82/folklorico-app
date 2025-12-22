"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // <--- Import this
//import { Layers } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { useProfile } from "@/hooks/useTroupeData";
import BrandLogo from "@/components/BrandLogo";

export default function MobileHeader() {
  const pathname = usePathname();
  const { data: user } = useProfile();

  // 1. HIDE ON PUBLIC PAGES
  if (["/login", "/join-troupe", "/", "/update-password"].includes(pathname)) {
    return null;
  }

  return (
    <header className="md:hidden sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div>
          {/* <Layers size={18} className="text-white" /> */}
          <BrandLogo size={30} />
        </div>
        <span className="font-bold text-xl text-white tracking-tight">
          Sarape
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <Link
          href="/profile"
          className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
              {user?.display_name?.[0] || "?"}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
