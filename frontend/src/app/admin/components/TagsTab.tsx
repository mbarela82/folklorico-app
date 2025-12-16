"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, Tag, Save, Edit2, Trash2 } from "lucide-react";
import {
  useTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/hooks/useTroupeData";
import KebabMenu from "@/components/ui/KebabMenu";
import ConfirmationModal from "@/components/ConfirmationModal";
import Toast from "@/components/Toast";

export default function TagsTab({ searchQuery }: { searchQuery: string }) {
  const queryClient = useQueryClient();
  const { data: tags = [], isLoading } = useTags();

  // Local State
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Filter based on search prop from parent
  const filteredTags = tags.filter((t: any) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Handlers ---
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setIsSubmitting(true);
    try {
      await createTag(newTagName);
      setNewTagName("");
      setToast({ msg: "Tag created", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    } catch (error) {
      setToast({ msg: "Error creating tag", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !editingTag.name.trim()) return;
    try {
      await updateTag(editingTag.id, editingTag.name);
      setEditingTag(null);
      setToast({ msg: "Tag renamed", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    } catch (error) {
      setToast({ msg: "Error updating tag", type: "error" });
    }
  };

  const handleDeleteTag = async () => {
    if (!deleteId) return;
    try {
      await deleteTag(deleteId);
      setToast({ msg: "Tag deleted", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    } catch (error) {
      setToast({ msg: "Error deleting tag", type: "error" });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
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
        onConfirm={handleDeleteTag}
        title="Delete Tag?"
        message="This will remove the tag from all associated media."
        type="danger"
        confirmText="Yes, Delete"
      />

      {/* Create Tag Form */}
      <form
        onSubmit={handleCreateTag}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          placeholder="Create new tag (e.g., 'Veracruz')"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newTagName.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Check size={20} />
          )}
          Create
        </button>
      </form>

      {/* Tag List */}
      {isLoading ? (
        <div className="text-zinc-500 animate-pulse">Loading tags...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredTags.map((tag: any) => (
            <div
              key={tag.id}
              className="bg-zinc-900 border border-zinc-800 p-2 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-colors"
            >
              {editingTag?.id === tag.id ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <input
                    autoFocus
                    type="text"
                    value={editingTag.name}
                    onChange={(e) =>
                      setEditingTag({ ...editingTag, name: e.target.value })
                    }
                    className="bg-zinc-950 border border-indigo-500 rounded px-1.5 py-1 text-xs w-full outline-none text-white"
                  />
                  <button
                    onClick={handleUpdateTag}
                    className="text-green-500 p-1 shrink-0"
                  >
                    <Save size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-300 min-w-0 flex-1">
                  <Tag size={14} className="text-indigo-500/50 shrink-0 ml-1" />
                  <span className="font-medium text-sm truncate min-w-0">
                    {tag.name}
                  </span>
                </div>
              )}

              {!editingTag && (
                <div className="relative shrink-0">
                  <KebabMenu
                    width="w-32"
                    items={[
                      {
                        label: "Rename",
                        icon: <Edit2 size={14} />,
                        onClick: () => {
                          setEditingTag(tag);
                          setNewTagName(tag.name); // Optional: clear create input
                        },
                      },
                      {
                        label: "Delete",
                        icon: <Trash2 size={14} />,
                        onClick: () => setDeleteId(tag.id),
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
    </div>
  );
}
