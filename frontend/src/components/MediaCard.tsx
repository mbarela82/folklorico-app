"use client";

import { Music, Video, Edit2, Trash2, Play } from "lucide-react";
import KebabMenu, { MenuItem } from "@/components/ui/KebabMenu";

interface MediaCardProps {
  title: string;
  region: string;
  type: "audio" | "video";
  thumbnailUrl?: string | null;
  tags?: string[];
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function MediaCard({
  title,
  region,
  type,
  thumbnailUrl,
  tags = [],
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
      className="group relative h-full flex flex-col bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl hover:bg-zinc-900 hover:border-indigo-500/50 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-4 flex-1">
        {/* THUMBNAIL AREA */}
        <div className="relative shrink-0 mt-1 self-start">
          {thumbnailUrl ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden relative shadow-lg bg-zinc-950">
              <img
                src={thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                <div className="bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                  {type === "video" ? (
                    <Play size={12} className="text-white fill-white" />
                  ) : (
                    <Music size={12} className="text-white" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`w-20 h-20 rounded-lg flex items-center justify-center transition-colors ${
                type === "video"
                  ? "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white"
                  : "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white"
              }`}
            >
              {type === "video" ? <Video size={32} /> : <Music size={32} />}
            </div>
          )}
        </div>

        {/* TEXT INFO */}
        <div className="flex-1 min-w-0 py-1 flex flex-col h-full">
          <h3 className="font-bold text-zinc-200 truncate group-hover:text-white transition-colors text-lg">
            {title}
          </h3>
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-0.5 mb-2">
            {region}
          </p>

          {/* Tags - Pushed to bottom with mt-auto */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                >
                  #{tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 text-zinc-600 font-medium">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ACTION MENU - Absolute positioned to not mess with flex flow */}
      {menuItems.length > 0 && (
        <div className="absolute top-2 right-1 z-10">
          <KebabMenu items={menuItems} />
        </div>
      )}
    </div>
  );
}
