"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  LogOut,
  Music,
  Video,
  PlusCircle,
  Home,
  ListMusic,
  Trash2,
  Calendar,
  FolderOpen,
  Plus,
  Play,
  Edit2,
} from "lucide-react";

// Components
import Modal from "@/components/ui/Modal";
import CreatePlaylistForm from "@/components/CreatePlaylistForm";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import PlaylistPlayer from "@/components/PlaylistPlayer";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import UploadModal from "@/components/UploadModal"; // <--- 1. Import UploadModal

export default function PlaylistsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<any[]>([]);

  // State for Actions
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false); // <--- 2. Add Upload State
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // State for Player
  const [playerPlaylist, setPlayerPlaylist] = useState<any[]>([]);
  const [currentMedia, setCurrentMedia] = useState<any>(null);

  // 1. Fetch Data
  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("playlists")
      .select("*, playlist_items(count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setPlaylists(data);
    setLoading(false);
  };

  // --- ACTIONS ---

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

    const { error, data } = await supabase
      .from("playlists")
      .delete()
      .eq("id", deleteId)
      .select();

    if (!error && data && data.length > 0) {
      setPlaylists(playlists.filter((p) => p.id !== deleteId));
      setToast({ msg: "Playlist deleted", type: "success" });
    } else {
      setToast({ msg: "Could not delete. Check permissions.", type: "error" });
    }
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* 3. Render Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() =>
          setToast({ msg: "Upload Successful!", type: "success" })
        }
      />

      {/* Player */}
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

      {/* Toasts & Modals */}
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
        message="Are you sure? This cannot be undone."
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
      >
        <CreatePlaylistForm
          initialData={editingPlaylist}
          onSuccess={() => {
            setIsCreateOpen(false);
            setEditingPlaylist(null);
            fetchPlaylists();
            setToast({
              msg: editingPlaylist ? "Playlist Updated" : "Playlist Created",
              type: "success",
            });
          }}
          onCancel={() => {
            setIsCreateOpen(false);
            setEditingPlaylist(null);
          }}
        />
      </Modal>

      {/* --- SIDEBAR --- */}
      {/* 4. Pass onUpload to Sidebar to reveal the button */}
      <Sidebar onUpload={() => setIsUploadOpen(true)} />

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <h1 className="text-lg font-bold text-indigo-400">Troupe App</h1>
          {/* We remove logout here since it's in the sidebar/profile area usually, or add it back if needed */}
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Playlists</h2>
            <p className="text-zinc-400">Manage your setlists.</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Playlist</span>
          </button>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="text-zinc-500 animate-pulse">Loading...</div>
        ) : playlists.length === 0 ? (
          <div className="h-64 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 gap-4">
            <ListMusic size={48} className="opacity-20" />
            <p>No playlists yet.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="text-indigo-400 hover:underline"
            >
              Create One
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 md:pb-0">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => handlePlayPlaylist(playlist.id)}
                className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl hover:border-indigo-500/50 hover:bg-zinc-900 transition-all group relative cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-zinc-950 rounded-lg text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-inner">
                    <Play size={24} className="ml-1" />
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPlaylist(playlist);
                      }}
                      className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(playlist.id);
                      }}
                      className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-1 truncate">
                  {playlist.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono mt-4 pt-4 border-t border-zinc-800/50 group-hover:border-indigo-500/20">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(playlist.created_at).toLocaleDateString()}
                  </div>
                  <div>{playlist.playlist_items[0]?.count || 0} tracks</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- MOBILE NAV --- */}
      {/* 5. Pass onUpload to MobileNav as well */}
      <MobileNav onUpload={() => setIsUploadOpen(true)} />
    </div>
  );
}
