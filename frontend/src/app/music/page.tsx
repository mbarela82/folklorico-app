"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Music,
  PlusCircle,
  MapPin,
  Filter,
  Folder,
  ChevronLeft,
  Edit2,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import API_URL from "@/lib/api";
import {
  useFolders,
  useMediaLibrary,
  useProfile,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
} from "@/hooks/useTroupeData";
import MediaCard from "@/components/MediaCard";
import PracticeStudio from "@/components/PracticeStudio";
import UploadModal from "@/components/UploadModal";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ConfirmationModal";
import EditMediaForm from "@/components/EditMediaForm";
import Toast from "@/components/Toast";
import TagFilterBar from "@/components/TagFilterBar";
import KebabMenu from "@/components/ui/KebabMenu";
import { Database } from "@/types/supabase";

type MediaItemWithTags = Database["public"]["Tables"]["media_items"]["Row"] & {
  tags?: string[];
};

function MusicContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const playId = searchParams.get("play");

  // State
  const [selectedRegionId, setSelectedRegionId] = useState<number | "All">(
    "All"
  );
  const [selectedRegionName, setSelectedRegionName] = useState("All Regions");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Data Hooks
  const { data: folders = [] } = useFolders();
  const { data: mediaItems = [], isLoading } = useMediaLibrary(
    "audio",
    selectedRegionId
  );
  const { data: profile } = useProfile();

  // Mutations
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();

  const isAdmin = profile?.role === "admin" || profile?.role === "teacher";
  const isFolderView = selectedRegionId === "All";

  // UI State
  const [currentMedia, setCurrentMedia] = useState<MediaItemWithTags | null>(
    null
  );
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItemWithTags | null>(
    null
  );

  // -- DELETION STATE --
  const [mediaToDeleteId, setMediaToDeleteId] = useState<string | null>(null);
  const [folderToDeleteId, setFolderToDeleteId] = useState<number | null>(null); // NEW: For folder modal

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isRenamingId, setIsRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Sync URL play ID
  useEffect(() => {
    if (playId && mediaItems.length > 0) {
      const targetItem = mediaItems.find((item: any) => item.id === playId);
      if (targetItem) setCurrentMedia(targetItem);
    }
  }, [playId, mediaItems]);

  // Derived Data
  const availableTags = useMemo(() => {
    const allTags = mediaItems.flatMap((item: any) => item.tags || []);
    return Array.from(new Set(allTags)).sort();
  }, [mediaItems]);

  const filteredItems = mediaItems.filter((item: any) => {
    if (!filterTag) return true;
    return item.tags && item.tags.includes(filterTag);
  });

  const getFolderCount = (id: number) => {
    if (!isFolderView) return 0;
    return mediaItems.filter((item: any) => item.region_id === id).length;
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["media", "audio"] });
    queryClient.invalidateQueries({ queryKey: ["regions"] });
  };

  // Handlers
  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder.mutateAsync(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
      setToast({ msg: "Folder created", type: "success" });
    }
  };

  const handleRenameFolder = async (id: number) => {
    if (renameValue.trim()) {
      await updateFolder.mutateAsync({ id, name: renameValue });
      setToast({ msg: "Folder renamed", type: "success" });
    }
    setIsRenamingId(null);
  };

  // 1. New Handler for Folder Deletion (Triggers Modal)
  const executeDeleteFolder = async () => {
    if (folderToDeleteId) {
      try {
        await deleteFolder.mutateAsync(folderToDeleteId);
        setToast({ msg: "Folder deleted", type: "success" });
      } catch (error) {
        setToast({ msg: "Failed to delete folder", type: "error" });
      }
      setFolderToDeleteId(null);
    }
  };

  // 2. Existing Handler for Media Deletion
  const executeDeleteMedia = async () => {
    if (!mediaToDeleteId) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setToast({ msg: "You must be logged in to delete", type: "error" });
        return;
      }
      const response = await fetch(`${API_URL}/media/${mediaToDeleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete media");

      refreshData();
      setToast({ msg: "Track deleted", type: "success" });
    } catch (error: any) {
      console.error(error);
      setToast({ msg: error.message || "Error deleting item", type: "error" });
    }
    setMediaToDeleteId(null);
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto h-full pb-24 md:pb-8">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {currentMedia && (
        <PracticeStudio
          media={currentMedia as any}
          onClose={() => setCurrentMedia(null)}
        />
      )}

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          refreshData();
          setToast({ msg: "Upload Complete", type: "success" });
        }}
        defaultType="audio"
      />

      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Edit Track"
      >
        {editingItem && (
          <EditMediaForm
            mediaItem={editingItem}
            onSuccess={() => {
              setEditingItem(null);
              refreshData();
              setToast({ msg: "Track Updated", type: "success" });
            }}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </Modal>

      {/* CONFIRM DELETE MEDIA */}
      <ConfirmationModal
        isOpen={!!mediaToDeleteId}
        onClose={() => setMediaToDeleteId(null)}
        onConfirm={executeDeleteMedia}
        title="Delete Audio?"
        message="This will remove it from all playlists as well."
        type="danger"
        confirmText="Yes, Delete"
      />

      {/* CONFIRM DELETE FOLDER */}
      <ConfirmationModal
        isOpen={!!folderToDeleteId}
        onClose={() => setFolderToDeleteId(null)}
        onConfirm={executeDeleteFolder}
        title="Delete Folder?"
        message="Are you sure? Tracks inside this folder will remain but may lose their region assignment."
        type="danger"
        confirmText="Delete Folder"
      />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {!isFolderView && (
              <button
                onClick={() => {
                  setSelectedRegionId("All");
                  setSelectedRegionName("All Regions");
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Music className="text-indigo-400" />
              {isFolderView ? "Music Library" : selectedRegionName}
            </h1>
          </div>
          <p className="text-zinc-400 pl-1">
            {isFolderView
              ? "Select a region folder."
              : "Master tracks for practice."}
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-row gap-3 w-full md:w-auto items-center">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              {isFolderView ? <Folder size={16} /> : <MapPin size={16} />}
            </div>
            <select
              value={selectedRegionId}
              onChange={(e) => {
                const val =
                  e.target.value === "All" ? "All" : parseInt(e.target.value);
                setSelectedRegionId(val);
                if (val === "All") setSelectedRegionName("All Regions");
                else {
                  const f = folders.find((fol: any) => fol.id === val);
                  if (f) setSelectedRegionName(f.name);
                }
              }}
              className="w-full appearance-none bg-zinc-900 border border-zinc-700 text-white pl-10 pr-8 py-3 rounded-xl text-sm font-medium focus:border-indigo-500 outline-none cursor-pointer hover:bg-zinc-800 transition-colors"
            >
              <option value="All">All Regions</option>
              {folders.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all shrink-0"
            >
              <PlusCircle size={20} />
              <span className="hidden sm:inline">Upload</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-zinc-500 animate-pulse">Loading library...</div>
      ) : (
        <>
          {/* === VIEW: FOLDERS === */}
          {isFolderView ? (
            <>
              {isAdmin && !isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="mb-4 flex items-center gap-2 text-indigo-400 font-bold text-sm hover:text-indigo-300 transition-colors"
                >
                  <PlusCircle size={18} /> Create New Folder
                </button>
              )}

              {isCreating && (
                <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex gap-2 max-w-md animate-in fade-in slide-in-from-top-2">
                  <input
                    autoFocus
                    className="bg-transparent border-b border-zinc-700 text-white outline-none flex-1 pb-1"
                    placeholder="Folder Name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  />
                  <button
                    onClick={handleCreateFolder}
                    className="text-indigo-400 font-bold text-sm"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-zinc-500 text-sm hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* FOLDERS GRID: 2-col on Mobile, 4 on Desktop */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {folders.map((folder: any) => {
                  const count = getFolderCount(folder.id);
                  const isRenaming = isRenamingId === folder.id;

                  return (
                    <div
                      key={folder.id}
                      className="group relative bg-zinc-900/50 border border-zinc-800 p-4 md:p-6 rounded-2xl flex flex-col items-start gap-4 hover:bg-zinc-800 transition-all"
                    >
                      <div
                        className="cursor-pointer w-full"
                        onClick={() => {
                          if (isRenaming) return;
                          setSelectedRegionId(folder.id);
                          setSelectedRegionName(folder.name);
                        }}
                      >
                        <div className="p-3 bg-zinc-950 rounded-xl text-indigo-500 mb-4 w-fit group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all">
                          <Folder size={24} className="md:w-7 md:h-7" />
                        </div>

                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRenameFolder(folder.id)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleRenameFolder(folder.id)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="bg-black border border-indigo-500 rounded px-2 py-1 text-white w-full outline-none text-sm"
                          />
                        ) : (
                          <div>
                            <h3 className="font-bold text-base md:text-lg text-zinc-100 group-hover:text-white truncate">
                              {folder.name}
                            </h3>
                            <p className="text-xs md:text-sm text-zinc-500">
                              {count} {count === 1 ? "track" : "tracks"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Admin Menu for Folders */}
                      {isAdmin && !isRenaming && (
                        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
                          <KebabMenu
                            items={[
                              {
                                label: "Rename",
                                icon: <Edit2 size={16} />,
                                onClick: () => {
                                  setIsRenamingId(folder.id);
                                  setRenameValue(folder.name);
                                },
                              },
                              {
                                label: "Delete",
                                icon: <Trash2 size={16} />,
                                onClick: () => setFolderToDeleteId(folder.id), // Trigger Modal
                                variant: "danger",
                              },
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {folders.length === 0 && !isCreating && (
                  <div className="col-span-full h-40 flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                    No folders found.
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* === VIEW: TRACKS === */}
              <div className="mb-6">
                <TagFilterBar
                  availableTags={availableTags}
                  selectedTag={filterTag}
                  onSelectTag={setFilterTag}
                />
              </div>

              {filteredItems.length === 0 ? (
                <div className="h-64 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 gap-4">
                  <Music size={48} className="opacity-20" />
                  <p>No audio tracks found in {selectedRegionName}.</p>
                </div>
              ) : (
                /* TRACKS GRID: 
                   1-col (List) on Mobile
                   2-col on Tablet
                   3-col on Laptop (lg) -> FIXED: Was 4, now 3 for width
                   4-col on XL screens
                */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map((item: any) => (
                    <div key={item.id} className="relative group">
                      <MediaCard
                        title={item.title}
                        region={item.region || ""}
                        type="audio"
                        thumbnailUrl={item.thumbnail_url}
                        tags={item.tags}
                        onClick={() => setCurrentMedia(item)}
                        // Passing undefined so we can use the explicit overlay
                        onEdit={undefined}
                        onDelete={undefined}
                      />

                      {/* Kebab Overlay */}
                      {isAdmin && (
                        <div className="absolute top-3 right-3 z-20">
                          <KebabMenu
                            items={[
                              {
                                label: "Edit",
                                icon: <Edit2 size={16} />,
                                onClick: () => setEditingItem(item),
                              },
                              {
                                label: "Delete",
                                icon: <Trash2 size={16} />,
                                onClick: () => setMediaToDeleteId(item.id),
                                variant: "danger",
                              },
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function MusicPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-zinc-500">Loading Music...</div>}
    >
      <MusicContent />
    </Suspense>
  );
}
