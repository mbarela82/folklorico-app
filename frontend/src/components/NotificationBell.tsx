"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  Calendar,
  Megaphone,
  Info,
  Trash2,
  ListMusic,
  Bookmark,
  Video,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";

interface NotificationBellProps {
  align?: "left" | "right";
}

export default function NotificationBell({
  align = "right",
}: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (n: any) => {
    if (!n.is_read) markAsRead.mutate(n.id);
    setIsOpen(false);
  };

  // --- HELPER: Get Icon & Color based on content ---
  const getNotificationStyle = (n: any) => {
    const title = n.title?.toLowerCase() || "";

    // 1. PLAYLISTS
    if (title.includes("playlist")) {
      return {
        icon: <ListMusic size={14} />,
        className: "bg-emerald-500/20 text-emerald-400",
      };
    }
    // 2. TEACHER NOTES / BOOKMARKS
    if (title.includes("note") || title.includes("bookmark")) {
      return {
        icon: <Bookmark size={14} />,
        className: "bg-cyan-500/20 text-cyan-400",
      };
    }
    // 3. EVENTS
    if (n.type === "event") {
      return {
        icon: <Calendar size={14} />,
        className: "bg-indigo-500/20 text-indigo-400",
      };
    }
    // 4. VIDEO / CONTENT UPLOADS
    if (title.includes("content") || title.includes("video")) {
      return {
        icon: <Video size={14} />,
        className: "bg-pink-500/20 text-pink-400",
      };
    }
    // 5. ANNOUNCEMENTS (Default)
    if (n.type === "announcement") {
      return {
        icon: <Megaphone size={14} />,
        className: "bg-amber-500/20 text-amber-400",
      };
    }

    // Fallback
    return {
      icon: <Info size={14} />,
      className: "bg-zinc-700 text-zinc-400",
    };
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-950 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 ${
            align === "left"
              ? "left-0 origin-top-left"
              : "right-0 origin-top-right"
          }`}
        >
          {/* Header */}
          <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Notifications
            </span>
            <div className="flex gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Check size={12} /> Read All
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearAll.mutate()}
                  className="text-[10px] font-bold text-zinc-500 hover:text-red-400 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm italic">
                No new notifications.
              </div>
            ) : (
              notifications.map((n: any) => {
                const style = getNotificationStyle(n);

                return (
                  <Link
                    key={n.id}
                    href={n.link || "#"}
                    onClick={() => handleItemClick(n)}
                    className={`block p-4 border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors ${
                      !n.is_read ? "bg-indigo-900/10" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Dynamic Icon */}
                      <div
                        className={`mt-1 p-1.5 rounded-full h-fit shrink-0 ${style.className}`}
                      >
                        {style.icon}
                      </div>

                      <div className="min-w-0">
                        <div
                          className={`text-sm mb-0.5 ${
                            !n.is_read
                              ? "font-bold text-white"
                              : "font-medium text-zinc-300"
                          }`}
                        >
                          {n.title}
                        </div>
                        <div className="text-xs text-zinc-500 line-clamp-2 break-words">
                          {n.message}
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-2 font-mono">
                          {new Date(n.created_at).toLocaleDateString()} •{" "}
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
