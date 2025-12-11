"use client";

import { useEffect, useState } from "react";
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
  Globe,
  User,
  Layers,
} from "lucide-react"; // Added Layers icon for Logo

// Components
import Modal from "@/components/ui/Modal";
import CreatePlaylistForm from "@/components/CreatePlaylistForm";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import PlaylistPlayer from "@/components/PlaylistPlayer";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import UploadModal from "@/components/UploadModal";
import KebabMenu from "@/components/ui/KebabMenu";

export default function PlaylistsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // DATA
  const [myPlaylists, setMyPlaylists] = useState<any[]>([]);
  const [sharedPlaylists, setSharedPlaylists] = useState<any[]>([]);

  // ACTIONS
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // PLAYER
  const [playerPlaylist, setPlayerPlaylist] = useState<any[]>([]);
  const [currentMedia, setCurrentMedia] = useState<any>(null);

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
      .order("created_at", { ascending: false });

    if (data) {
      const mine = data.filter((p) => p.user_id === user.id);
      const shared = data.filter((p) => p.user_id !== user.id && p.is_public);
      setMyPlaylists(mine);
      setSharedPlaylists(shared);
    }
    setLoading(false);
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
      setMyPlaylists(myPlaylists.filter((p) => p.id !== deleteId));
      setToast({ msg: "Playlist deleted", type: "success" });
    }
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row pb-20 md:pb-0">
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
      >
        <CreatePlaylistForm
          initialData={editingPlaylist}
          onSuccess={() => {
            setIsCreateOpen(false);
            setEditingPlaylist(null);
            fetchPlaylists();
            setToast({ msg: "Playlist Saved", type: "success" });
          }}
          onCancel={() => {
            setIsCreateOpen(false);
            setEditingPlaylist(null);
          }}
        />
      </Modal>

      <Sidebar onUpload={() => setIsUploadOpen(true)} />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        {/* MOBILE BRAND HEADER (RESTORED) */}
        <div className="md:hidden flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Layers size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Sarape
          </h1>
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
            <Plus size={20} />{" "}
            <span className="hidden sm:inline">Add Playlist</span>
          </button>
        </div>

        {/* MY PLAYLISTS */}
        <div className="mb-10">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <User size={14} /> My Playlists
          </h3>
          {myPlaylists.length === 0 ? (
            <div className="h-32 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 text-sm">
              You haven't created any playlists yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => handlePlayPlaylist(playlist.id)}
                  className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl hover:border-indigo-500/50 hover:bg-zinc-900 transition-all group relative cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
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
                        <Play size={24} className="ml-1" />
                      )}
                    </div>
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
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate">
                    {playlist.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono mt-4 pt-4 border-t border-zinc-800/50">
                    <span>{playlist.playlist_items[0]?.count || 0} tracks</span>
                    {playlist.is_public && (
                      <span className="text-green-500 flex items-center gap-1">
                        <Globe size={10} /> Public
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SHARED PLAYLISTS */}
        <div>
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Globe size={14} /> Troupe Setlists
          </h3>
          {sharedPlaylists.length === 0 ? (
            <div className="text-zinc-600 text-sm italic">
              No shared playlists available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => handlePlayPlaylist(playlist.id)}
                  className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-xl hover:bg-zinc-900 transition-all cursor-pointer hover:border-green-500/30"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-zinc-950 rounded-lg text-green-500 shadow-inner">
                      <Globe size={24} />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate text-zinc-300 group-hover:text-white">
                    {playlist.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono mt-4 pt-4 border-t border-zinc-800/50">
                    <span>{playlist.playlist_items[0]?.count || 0} tracks</span>
                    <span className="text-zinc-600">Shared by Author</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <MobileNav onUpload={() => setIsUploadOpen(true)} />
    </div>
  );
}
