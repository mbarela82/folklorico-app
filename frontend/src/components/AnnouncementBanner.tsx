"use client";

import { useState } from "react";
import {
  useAnnouncement,
  postAnnouncement,
  useProfile,
} from "@/hooks/useTroupeData";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, Edit2, Save, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns"; // Optional: npm install date-fns

export default function AnnouncementBanner() {
  const queryClient = useQueryClient();
  const { data: announcement, isLoading } = useAnnouncement();
  const { data: profile } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = profile?.role === "admin" || profile?.role === "teacher";

  const handleSave = async () => {
    if (!newMessage.trim() || !profile) return;
    setIsSaving(true);
    try {
      await postAnnouncement(newMessage, profile.id);
      queryClient.invalidateQueries({ queryKey: ["announcement"] }); // Refresh instantly
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const startEditing = () => {
    setNewMessage(announcement?.message || "");
    setIsEditing(true);
  };

  if (isLoading)
    return <div className="h-24 bg-zinc-900/50 rounded-xl animate-pulse" />;

  return (
    <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden group shadow-lg">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Megaphone size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Megaphone size={14} />
            Bulletin Board
          </h3>

          {/* Edit Button (Admins Only) */}
          {isAdmin && !isEditing && (
            <button
              onClick={startEditing}
              className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors opacity-100 group-hover:opacity-100"
              title="Update Announcement"
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="What's the news?"
              className="w-full bg-zinc-950/80 border border-indigo-500/50 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium"
              rows={2}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
              >
                {isSaving ? "Posting..." : "Post Update"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-white text-xl md:text-2xl font-bold leading-tight">
              {announcement?.message ||
                "Welcome to the troupe! No new announcements right now."}
            </p>
            {announcement && (
              <p className="text-zinc-500 text-xs mt-3 font-mono">
                Posted by {announcement.profiles?.display_name} •{" "}
                {new Date(announcement.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
