"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

  const editWrapRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [vvBottom, setVvBottom] = useState(0);
  const [vvHeight, setVvHeight] = useState<number | null>(null);

  // Esc cancel for rename (backdrop handles click-outside)
  useEffect(() => {
    if (!editingTag || isRenaming) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setEditingTag(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [editingTag, isRenaming]);

  // Track mobile breakpoint for rename popover layout
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener?.("change", set);
    window.addEventListener("resize", set);
    return () => {
      mq.removeEventListener?.("change", set);
      window.removeEventListener("resize", set);
    };
  }, []);

  // Track visualViewport for keyboard overlap (mobile only, when rename popover is open)
  useEffect(() => {
    if (!isMobile || !editingTag) return;

    const update = () => {
      const vv = window.visualViewport;
      const height = vv?.height ?? window.innerHeight;
      const offsetTop = vv?.offsetTop ?? 0;
      const bottomObscured = Math.max(
        0,
        window.innerHeight - (height + offsetTop)
      );
      setVvBottom(bottomObscured);
      setVvHeight(height);
    };

    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isMobile, editingTag]);

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
    if (!editingTag) return;

    const nextName = editingTag.name.trim();
    if (!nextName) return;

    // no-op (don't fire request if unchanged)
    const original = tags.find((t: any) => t.id === editingTag.id)?.name ?? "";
    if (original.trim() === nextName) {
      setEditingTag(null);
      return;
    }

    setIsRenaming(true);
    try {
      await updateTag(editingTag.id, nextName);
      setEditingTag(null);
      setToast({ msg: "Tag renamed", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    } catch (error) {
      setToast({ msg: "Error updating tag", type: "error" });
    } finally {
      setIsRenaming(false);
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
    <>
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
                className={`bg-zinc-900 border p-2 rounded-xl flex items-center justify-between group transition-colors relative overflow-visible ${
                  editingTag?.id === tag.id
                    ? "border-indigo-500/50 shadow-[0_0_0_1px_rgba(99,102,241,0.25)]"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {editingTag?.id === tag.id ? (
                  <div className="flex items-center gap-2 text-zinc-300 min-w-0 flex-1">
                    <Tag size={14} className="text-indigo-500 shrink-0 ml-1" />
                    <span className="font-medium text-sm truncate min-w-0">
                      {tag.name}
                    </span>
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-indigo-300/80 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full shrink-0">
                      Renaming…
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-300 min-w-0 flex-1">
                    <Tag
                      size={14}
                      className="text-indigo-500/50 shrink-0 ml-1"
                    />
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

      {/* Rename Popover (Portal) */}
      {typeof document !== "undefined" && editingTag
        ? createPortal(
            <div
              className={`fixed inset-0 z-[9999] flex items-center justify-center p-3`}
              style={
                isMobile ? { paddingBottom: Math.max(vvBottom, 0) } : undefined
              }
              onPointerDown={(e) => {
                // tap/click outside cancels (works even when backdrop is the target)
                const t = e.target as Node;
                if (
                  !isRenaming &&
                  editWrapRef.current &&
                  !editWrapRef.current.contains(t)
                ) {
                  setEditingTag(null);
                }
              }}
            >
              {/* backdrop */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

              <div
                ref={editWrapRef}
                className={`relative w-full ${
                  isMobile
                    ? "max-w-none rounded-2xl rounded-b-none"
                    : "max-w-lg rounded-2xl"
                } bg-zinc-950/95 backdrop-blur-md border border-indigo-500/25 shadow-2xl p-3`}
                onMouseDown={(e) => e.stopPropagation()}
                style={
                  isMobile
                    ? {
                        maxHeight: Math.max(
                          240,
                          (vvHeight ?? window.innerHeight) - 48
                        ),
                        overflow: "auto",
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                    Rename tag
                  </div>
                  <div className="text-[10px] text-zinc-400">Esc to cancel</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <input
                      {...(!isMobile ? { autoFocus: true } : {})}
                      type="text"
                      value={editingTag.name}
                      onChange={(e) =>
                        setEditingTag({ ...editingTag, name: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleUpdateTag();
                        }
                      }}
                      onFocus={(e) => e.currentTarget.select()}
                      className="w-full bg-black/40 border border-zinc-700/70 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm outline-none text-white shadow-inner"
                      placeholder="Rename tag…"
                      disabled={isRenaming}
                    />
                    {isRenaming && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300">
                        <Loader2 className="animate-spin" size={14} />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleUpdateTag}
                    disabled={
                      isRenaming ||
                      !editingTag.name.trim() ||
                      (
                        tags.find((t: any) => t.id === editingTag.id)?.name ??
                        ""
                      ).trim() === editingTag.name.trim()
                    }
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 text-emerald-200"
                    title="Save"
                  >
                    <Save size={16} />
                  </button>
                </div>

                <div className="mt-2 text-[10px] text-zinc-400">
                  Enter to save • Tap outside to cancel
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
