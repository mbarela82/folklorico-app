"use client";

import { useState, useEffect, Suspense } from "react"; // <--- Added Suspense
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit2,
  Globe,
  Layers,
  Trash2,
  ListMusic,
  Lock,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePlaylists, useProfile } from "@/hooks/useTroupeData";

// Types
import { Database } from "@/types/supabase";
type PlaylistWithData = Database["public"]["Tables"]["playlists"]["Row"] & {
  playlist_items: { count: number }[];
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

// Components
import Modal from "@/components/ui/Modal";
import CreatePlaylistForm from "@/components/CreatePlaylistForm";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import PlaylistPlayer from "@/components/PlaylistPlayer";
import UploadModal from "@/components/UploadModal";
import KebabMenu from "@/components/ui/KebabMenu";

// 1. ISOLATE CONTENT
function PlaylistsContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // 1. GET DATA FROM CACHE (Instant)
  const { data: rawPlaylists = [], isLoading: listsLoading } = usePlaylists();
  const { data: profile, isLoading: profileLoading } = useProfile();

  // 2. Derive User ID from cached profile
  const currentUserId = profile?.id || null;

  // UI State
  const [activeTab, setActiveTab] = useState<"mine" | "shared">("mine");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] =
    useState<PlaylistWithData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Player State
  const [playerPlaylist, setPlayerPlaylist] = useState<any[]>([]);
  const [currentMedia, setCurrentMedia] = useState<any>(null);

  // Combined Loading State
  const isLoading = listsLoading || profileLoading;

  // Filter Logic
  const playlists = rawPlaylists as unknown as PlaylistWithData[];
  const myPlaylists = playlists.filter(
    (p) => p.user_id === currentUserId && !p.is_public
  );
  const sharedPlaylists = playlists.filter((p) => p.is_public);

  // --- AUTO-SWITCH TAB LOGIC ---
  useEffect(() => {
    if (tabParam === "shared") {
      setActiveTab("shared");
    }
  }, [tabParam]);

  const activeList = activeTab === "mine" ? myPlaylists : sharedPlaylists;

  // Handlers
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["playlists"] });
  };

  const handlePlayPlaylist = async (playlistId: string) => {
    const { data } = await supabase
      .from("playlist_items")
      .select("*, media_items(*)")
      .eq("playlist_id", playlistId)
      .order("order_index");

    if (data && data.length > 0) {
      const tracks = data.map((item: any) => item.media_items);
      setPlayerPlaylist(tracks);
      setCurrentMedia(tracks[0]);
    } else {
      setToast({ msg: "This playlist is empty!", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", deleteId);

    if (!error) {
      refreshData();
      setToast({ msg: "Playlist deleted", type: "success" });
    }
    setDeleteId(null);
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto h-full">
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() =>
          setToast({ msg: "Upload Successful!", type: "success" })
        }
        defaultType="audio"
      />

      {currentMedia && playerPlaylist.length > 0 && (
        <PlaylistPlayer
          playlist={playerPlaylist}
          initialIndex={0}
          onClose={() => {
            setCurrentMedia(null);
            setPlayerPlaylist([]);
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Playlist?"
        message="Are you sure?"
        type="danger"
        confirmText="Yes, Delete"
      />

      <Modal
        isOpen={isCreateOpen || !!editingPlaylist}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingPlaylist(null);
        }}
        title={editingPlaylist ? "Edit Playlist" : "New Playlist"}
        className="max-w-4xl"
      >
        <CreatePlaylistForm
          initialData={editingPlaylist}
          onSuccess={() => {
            setIsCreateOpen(false);
            setEditingPlaylist(null);
            refreshData();
            setToast({ msg: "Playlist Saved", type: "success" });
          }}
          onCancel={() => {
            setIsCreateOpen(false);
            setEditingPlaylist(null);
          }}
        />
      </Modal>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListMusic className="text-indigo-400" /> Playlists
          </h1>
          <p className="text-zinc-400 hidden sm:block">Manage your setlists.</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all shrink-0"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add Playlist</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-zinc-800 mb-8">
        <button
          onClick={() => setActiveTab("mine")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "mine"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Lock size={16} /> Private
          <span className="bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full text-[10px] ml-1 border border-zinc-800">
            {myPlaylists.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("shared")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "shared"
              ? "border-green-500 text-green-500"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Globe size={16} /> Public
          <span className="bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full text-[10px] ml-1 border border-zinc-800">
            {sharedPlaylists.length}
          </span>
        </button>
      </div>

      {/* GRID CONTENT */}
      {isLoading ? (
        <div className="text-zinc-500 animate-pulse">Loading lists...</div>
      ) : activeList.length === 0 ? (
        <div className="h-48 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-600 gap-2">
          <Layers size={32} className="opacity-20" />
          <p className="text-sm">
            {activeTab === "mine"
              ? "No private playlists."
              : "No public playlists available."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeList.map((playlist) => {
            const isOwner = playlist.user_id === currentUserId;
            const creatorName = playlist.profiles?.display_name || "Unknown";
            const creatorAvatar = playlist.profiles?.avatar_url;

            return (
              <div
                key={playlist.id}
                onClick={() => handlePlayPlaylist(playlist.id)}
                className={`group relative p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[160px] ${
                  playlist.is_public
                    ? "bg-zinc-900/30 border-zinc-800 hover:border-green-500/30 hover:bg-zinc-900"
                    : "bg-zinc-900/50 border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900"
                }`}
              >
                {/* Top Row */}
                <div className="flex justify-between items-start">
                  <div
                    className={`p-3 rounded-lg transition-colors shadow-inner ${
                      playlist.is_public
                        ? "bg-green-900/20 text-green-500"
                        : "bg-zinc-950 text-indigo-400"
                    }`}
                  >
                    {playlist.is_public ? (
                      <Globe size={24} />
                    ) : (
                      <Lock size={24} />
                    )}
                  </div>

                  {isOwner && (
                    <div
                      className="relative z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <KebabMenu
                        items={[
                          {
                            label: "Edit",
                            icon: <Edit2 size={16} />,
                            onClick: () => setEditingPlaylist(playlist),
                          },
                          {
                            label: "Delete",
                            icon: <Trash2 size={16} />,
                            onClick: () => setDeleteId(playlist.id),
                            variant: "danger",
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="mt-4">
                  <h3 className="font-bold text-lg leading-tight truncate text-zinc-200 group-hover:text-white">
                    {playlist.title}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono mt-1">
                    {playlist.playlist_items[0]?.count || 0} tracks
                  </p>
                </div>

                {/* Bottom Row: Creator Profile (Only for Shared) */}
                {activeTab === "shared" && (
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800/50">
                    {creatorAvatar ? (
                      <img
                        src={creatorAvatar}
                        alt={creatorName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                        <UserIcon size={12} className="text-zinc-500" />
                      </div>
                    )}
                    <span
                      className={`text-xs ${
                        isOwner ? "text-green-500 font-bold" : "text-zinc-500"
                      }`}
                    >
                      {isOwner ? "You" : creatorName}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 2. EXPORT WRAPPER
export default function PlaylistsPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-zinc-500">Loading Playlists...</div>}
    >
      <PlaylistsContent />
    </Suspense>
  );
}
