"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListMusic, Music, PlusCircle, Video } from "lucide-react";

interface MobileNavProps {
  onUpload?: () => void;
}

export default function MobileNav({ onUpload }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex justify-around p-4 z-50 safe-area-bottom">
      <Link href="/dashboard" className="flex-1">
        <MobileNavItem
          icon={<Home size={24} />}
          label="Home"
          active={pathname === "/dashboard"}
        />
      </Link>

      <Link href="/playlists" className="flex-1">
        <MobileNavItem
          icon={<ListMusic size={24} />}
          label="Playlists"
          active={pathname.startsWith("/playlists")}
        />
      </Link>

      <Link href="/music" className="flex-1">
        <MobileNavItem
          icon={<Music size={24} />}
          label="Music"
          active={pathname === "/music"}
        />
      </Link>

      {/* Added Video Link for Mobile */}
      <Link href="/videos" className="flex-1">
        <MobileNavItem
          icon={<Video size={24} />}
          label="Video"
          active={pathname === "/videos"}
        />
      </Link>

      {onUpload && (
        <button onClick={onUpload} className="flex-1">
          <MobileNavItem icon={<PlusCircle size={24} />} label="Upload" />
        </button>
      )}
    </nav>
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
      className={`flex flex-col items-center gap-1 transition-colors ${
        active ? "text-indigo-400" : "text-zinc-500"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}
