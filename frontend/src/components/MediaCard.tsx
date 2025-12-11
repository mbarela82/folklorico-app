"use client";

import { Music, Video, Edit2, Trash2 } from "lucide-react";
import KebabMenu, { MenuItem } from "@/components/ui/KebabMenu";

interface MediaCardProps {
  title: string;
  region: string;
  type: "audio" | "video";
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function MediaCard({
  title,
  region,
  type,
  onClick,
  onEdit,
  onDelete,
}: MediaCardProps) {
  const menuItems: MenuItem[] = [];

  if (onEdit) {
    menuItems.push({
      label: "Edit Details",
      icon: <Edit2 size={16} />,
      onClick: onEdit,
    });
  }

  if (onDelete) {
    menuItems.push({
      label: "Delete",
      icon: <Trash2 size={16} />,
      onClick: onDelete,
      variant: "danger",
    });
  }

  return (
    <div
      onClick={onClick}
      className="group relative bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl hover:bg-zinc-900 hover:border-indigo-500/50 transition-all cursor-pointer flex items-center gap-4"
    >
      <div
        className={`p-4 rounded-full flex-shrink-0 transition-colors ${
          type === "video"
            ? "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white"
            : "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white"
        }`}
      >
        {type === "video" ? <Video size={24} /> : <Music size={24} />}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-0.5">
          {region}
        </p>
      </div>

      {/* ACTION MENU: Always Visible now */}
      {menuItems.length > 0 && (
        <div className="relative z-10">
          <KebabMenu items={menuItems} />
        </div>
      )}
    </div>
  );
}
