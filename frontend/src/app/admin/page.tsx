"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  User,
  GraduationCap,
  Layers,
  Search,
  Trash2,
  UserPlus,
  Check,
  Loader2,
  Tag,
  Users,
  Edit2,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import Modal from "@/components/ui/Modal";
// Import your reusable KebabMenu
import KebabMenu from "@/components/ui/KebabMenu";
import { useAdminUsers, useProfile, useAllTags } from "@/hooks/useTroupeData";

// Types
import { Database } from "@/types/supabase";
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type TagItem = Database["public"]["Tables"]["tags"]["Row"];

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. DATA HOOKS
  const { data: myProfile, isLoading: profileLoading } = useProfile();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: tags = [], isLoading: tagsLoading } = useAllTags();

  // 2. UI STATE
  const [activeTab, setActiveTab] = useState<"members" | "tags">("members");
  const [searchQuery, setSearchQuery] = useState("");

  // Delete State
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleteType, setDeleteType] = useState<"user" | "tag" | null>(null);

  // Edit Tag State
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [inviteCopied, setInviteCopied] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Security Check
  if (!profileLoading && myProfile?.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  // --- ACTIONS ---

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    queryClient.invalidateQueries({ queryKey: ["all_tags"] });
  };

  // 1. USER ACTIONS
  const updateUserRole = async (
    userId: string,
    newRole: "dancer" | "teacher" | "admin"
  ) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) {
      setToast({ msg: "Failed to update role", type: "error" });
    } else {
      refreshData();
      setToast({ msg: "User role updated", type: "success" });
    }
  };

  // 2. TAG ACTIONS
  const openEditTag = (tag: TagItem) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !newTagName.trim()) return;

    setIsSaving(true);
    const { error } = await supabase
      .from("tags")
      .update({ name: newTagName.trim() })
      .eq("id", editingTag.id);

    if (error) {
      setToast({ msg: "Error updating tag", type: "error" });
    } else {
      setToast({ msg: "Tag renamed", type: "success" });
      setEditingTag(null);
      refreshData();
    }
    setIsSaving(false);
  };

  // 3. DELETE ACTIONS
  const handleDelete = async () => {
    if (!deleteId) return;

    if (deleteType === "user") {
      if (deleteId === myProfile?.id) {
        setToast({ msg: "You cannot delete yourself.", type: "error" });
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", deleteId);
      if (error) setToast({ msg: "Error deleting user", type: "error" });
      else setToast({ msg: "User removed", type: "success" });
    } else if (deleteType === "tag") {
      const { error } = await supabase.from("tags").delete().eq("id", deleteId);
      if (error) setToast({ msg: "Error deleting tag", type: "error" });
      else setToast({ msg: "Tag deleted", type: "success" });
    }

    refreshData();
    setDeleteId(null);
    setDeleteType(null);
  };

  const confirmDelete = (id: string | number, type: "user" | "tag") => {
    setDeleteId(id);
    setDeleteType(type);
  };

  const handleCopyInvite = () => {
    const url = `${window.location.origin}/join-troupe`;
    navigator.clipboard.writeText(url);
    setInviteCopied(true);
    setToast({ msg: "Link copied!", type: "success" });
    setTimeout(() => setInviteCopied(false), 2000);
  };

  // --- FILTERING ---
  const filteredUsers = users.filter(
    (u: Profile) =>
      (u.display_name?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      ) || (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const filteredTags = tags.filter((t: TagItem) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield size={16} className="text-red-400" />;
      case "teacher":
        return <GraduationCap size={16} className="text-amber-400" />;
      default:
        return <User size={16} className="text-zinc-400" />;
    }
  };

  const isLoading = usersLoading || tagsLoading;

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full">
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
        title={deleteType === "user" ? "Remove Member?" : "Delete Tag?"}
        message={
          deleteType === "user"
            ? "This removes them from the roster."
            : "This removes the tag from all media items."
        }
        type="danger"
        confirmText="Yes, Delete"
      />

      {/* RENAME TAG MODAL */}
      <Modal
        isOpen={!!editingTag}
        onClose={() => setEditingTag(null)}
        title="Rename Tag"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">
              Tag Name
            </label>
            <input
              autoFocus
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setEditingTag(null)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateTag}
              disabled={isSaving || !newTagName.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* HEADER */}
      <div className="md:hidden flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Layers size={18} className="text-white" />
        </div>
        <Link href="/dashboard">
          <h1 className="text-xl font-bold text-white">Sarape</h1>
        </Link>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-indigo-500" /> Admin Dashboard
          </h1>
          <p className="text-zinc-400 mt-1">Manage your troupe resources.</p>
        </div>

        {activeTab === "members" && (
          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl transition-all font-medium text-sm"
          >
            {inviteCopied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <UserPlus size={16} />
            )}
            {inviteCopied ? "Link Copied" : "Invite Dancers"}
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl mb-6 w-fit border border-zinc-800">
        <button
          onClick={() => {
            setActiveTab("members");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "members"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Users size={16} /> Members
        </button>
        <button
          onClick={() => {
            setActiveTab("tags");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "tags"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Tag size={16} /> Tags
        </button>
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-3">
          <Loader2 className="animate-spin" size={32} />
          <p>Loading...</p>
        </div>
      ) : (
        <>
          {/* SEARCH */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={16}
              />
              <input
                type="text"
                placeholder={
                  activeTab === "members"
                    ? "Search members..."
                    : "Search tags..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-3 text-sm focus:border-indigo-500 outline-none transition-colors text-white"
              />
            </div>
          </div>

          {/* === TAB CONTENT: MEMBERS === */}
          {activeTab === "members" && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-500 uppercase font-bold text-xs tracking-wider">
                  <tr>
                    <th className="p-4">Member</th>
                    <th className="p-4 hidden sm:table-cell">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredUsers.map((user: Profile) => (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-900/50 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              className="w-8 h-8 rounded-full object-cover bg-zinc-800"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                              <User size={14} className="text-zinc-500" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-white block">
                              {user.display_name || "Unknown"}
                            </span>
                            <span className="sm:hidden text-xs text-zinc-500 font-mono">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-400 font-mono text-xs hidden sm:table-cell">
                        {user.email}
                      </td>
                      <td className="p-4">
                        <div className="relative inline-block">
                          <select
                            value={user.role || "dancer"}
                            onChange={(e) =>
                              updateUserRole(user.id, e.target.value as any)
                            }
                            className={`appearance-none bg-zinc-950 border border-zinc-700 text-white pl-9 pr-8 py-2 rounded-lg text-xs font-bold uppercase tracking-wide focus:border-indigo-500 outline-none cursor-pointer hover:bg-zinc-800 transition-colors ${
                              user.role === "admin"
                                ? "text-red-300 border-red-900/50"
                                : user.role === "teacher"
                                ? "text-amber-300 border-amber-900/50"
                                : "text-zinc-300"
                            }`}
                          >
                            <option value="dancer">Dancer</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            {getRoleIcon(user.role || "dancer")}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {user.id !== myProfile?.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative z-10 inline-block"
                          >
                            <KebabMenu
                              items={[
                                {
                                  label: "Remove Member",
                                  icon: <Trash2 size={16} />,
                                  onClick: () => confirmDelete(user.id, "user"),
                                  variant: "danger",
                                },
                              ]}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* === TAB CONTENT: TAGS === */}
          {activeTab === "tags" && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredTags.map((tag: TagItem) => (
                <div
                  key={tag.id}
                  className="relative flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 rounded-lg group hover:border-zinc-700 transition-all"
                >
                  {/* Tag Name */}
                  <div className="flex items-center gap-2 min-w-0 pl-2">
                    <Tag size={14} className="text-indigo-500 shrink-0" />
                    <span className="text-sm font-medium text-zinc-300 truncate">
                      #{tag.name}
                    </span>
                  </div>

                  {/* Menu: Compact Mode */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative z-10 shrink-0"
                  >
                    <KebabMenu
                      width="w-28" // <--- The Fix: Slim width fits everywhere
                      align="right"
                      items={[
                        {
                          label: "Rename",
                          icon: <Edit2 size={14} />,
                          onClick: () => openEditTag(tag),
                        },
                        {
                          label: "Delete",
                          icon: <Trash2 size={14} />,
                          onClick: () => confirmDelete(tag.id, "tag"),
                          variant: "danger",
                        },
                      ]}
                    />
                  </div>
                </div>
              ))}
              {filteredTags.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
                  No tags found.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
