// frontend/src/app/admin/page.tsx
"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  User,
  GraduationCap,
  Search,
  Trash2,
  Check,
  Loader2,
  Tag,
  Users,
  Edit2,
  Save,
  X,
  BarChart3,
  TrendingUp,
  Activity,
  AlertCircle,
  Link as LinkIcon, // Renamed to avoid conflict if next/link is used, though not used here anymore
} from "lucide-react";

// Hooks
import {
  useProfile,
  useAllProfiles,
  useTags,
  updateRole,
  deleteUser,
  createTag,
  deleteTag,
  updateTag,
} from "@/hooks/useTroupeData";
import { useAnalyticsStats } from "@/hooks/useAnalytics";

// Components
import Toast from "@/components/Toast";
import ConfirmationModal from "@/components/ConfirmationModal";
import KebabMenu from "@/components/ui/KebabMenu";

export default function AdminPage() {
  const queryClient = useQueryClient();

  // Data Hooks
  const { data: currentUser, isLoading: profileLoading } = useProfile();
  const { data: users = [], isLoading: usersLoading } = useAllProfiles();
  const { data: tags = [], isLoading: tagsLoading } = useTags();
  const { data: stats, isLoading: statsLoading } = useAnalyticsStats();

  // State
  const [activeTab, setActiveTab] = useState<"members" | "tags" | "analytics">(
    "members"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Tag Management State
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Modal / Toast State
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "user" | "tag";
    id: string | number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HANDLERS ---

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRole(userId, newRole);
      setToast({ msg: "User role updated", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["all_profiles"] });
    } catch (error) {
      setToast({ msg: "Failed to update role", type: "error" });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm || deleteConfirm.type !== "user") return;
    try {
      await deleteUser(deleteConfirm.id as string);
      setToast({ msg: "User removed", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["all_profiles"] });
    } catch (error) {
      setToast({ msg: "Failed to remove user", type: "error" });
    }
    setDeleteConfirm(null);
  };

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
    if (!deleteConfirm || deleteConfirm.type !== "tag") return;
    try {
      await deleteTag(deleteConfirm.id as number);
      setToast({ msg: "Tag deleted", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    } catch (error) {
      setToast({ msg: "Error deleting tag", type: "error" });
    }
    setDeleteConfirm(null);
  };

  // Generate and Copy Invite Link
  const handleInvite = () => {
    const link = `${window.location.origin}/join-troupe`;
    navigator.clipboard.writeText(link);
    setToast({ msg: "Join link copied to clipboard!", type: "success" });
  };

  // --- RENDER ---

  if (profileLoading)
    return <div className="p-8 text-zinc-500">Loading profile...</div>;

  if (currentUser?.role !== "admin" && currentUser?.role !== "teacher") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 h-[50vh]">
        <Shield size={48} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p>You do not have permission to view this area.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u: any) =>
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTags = tags.filter((t: any) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full pb-24 md:pb-8">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={
          deleteConfirm?.type === "user" ? handleDeleteUser : handleDeleteTag
        }
        title={deleteConfirm?.type === "user" ? "Remove User?" : "Delete Tag?"}
        message="This action cannot be undone."
        type="danger"
        confirmText="Yes, Delete"
      />

      {/* HEADER SECTION - Modified for Mobile Stacking and Copy Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-indigo-400" /> Admin Dashboard
          </h1>
          <p className="text-zinc-400">
            Manage troupe members, content tags, and view stats.
          </p>
        </div>

        {/* INVITE BUTTON - Copies Link, Matches Tabs Size */}
        <button
          onClick={handleInvite}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm shadow-sm md:w-auto w-full"
        >
          <LinkIcon size={16} />
          Invite User
        </button>
      </div>

      {/* TABS HEADER */}
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
        <button
          onClick={() => {
            setActiveTab("analytics");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "analytics"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <BarChart3 size={16} /> Analytics
        </button>
      </div>

      {activeTab !== "analytics" && (
        <div className="mb-6 relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={16}
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 outline-none"
          />
        </div>
      )}

      {/* === TAB CONTENT: MEMBERS === */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {usersLoading ? (
            <div className="text-zinc-500 animate-pulse">
              Loading members...
            </div>
          ) : (
            <>
              {/* --- DESKTOP VIEW (Table) --- */}
              <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-950 text-zinc-500 uppercase font-bold text-xs border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredUsers.map((user: any) => (
                      <tr
                        key={user.id}
                        className="hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">
                            {user.display_name || "Unnamed User"}
                          </div>
                          <div className="text-zinc-500 text-xs">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative inline-block group">
                            <select
                              value={user.role || "dancer"}
                              onChange={(e) =>
                                handleRoleChange(user.id, e.target.value)
                              }
                              disabled={user.id === currentUser?.id}
                              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-300 appearance-none pr-8 focus:border-indigo-500 outline-none cursor-pointer disabled:opacity-50"
                            >
                              <option value="dancer">Dancer</option>
                              <option value="teacher">Teacher</option>
                              <option value="admin">Admin</option>
                            </select>
                            {/* Role Icons */}
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                              {user.role === "admin" ? (
                                <Shield size={14} className="text-indigo-400" />
                              ) : user.role === "teacher" ? (
                                <GraduationCap
                                  size={14}
                                  className="text-green-400"
                                />
                              ) : (
                                <User size={14} className="text-zinc-500" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.id !== currentUser?.id && (
                            <div className="flex justify-end relative z-10">
                              <KebabMenu
                                items={[
                                  {
                                    label: "Remove Member",
                                    icon: <Trash2 size={16} />,
                                    onClick: () =>
                                      setDeleteConfirm({
                                        type: "user",
                                        id: user.id,
                                      }),
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

              {/* --- MOBILE VIEW (Cards) --- */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map((user: any) => (
                  <div
                    key={user.id}
                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={18} className="text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">
                            {user.display_name || "Unnamed User"}
                          </div>
                          <div className="text-zinc-500 text-xs break-all">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      {/* Kebab Menu */}
                      {user.id !== currentUser?.id && (
                        <div className="relative z-10">
                          <KebabMenu
                            items={[
                              {
                                label: "Remove Member",
                                icon: <Trash2 size={16} />,
                                onClick: () =>
                                  setDeleteConfirm({
                                    type: "user",
                                    id: user.id,
                                  }),
                                variant: "danger",
                              },
                            ]}
                          />
                        </div>
                      )}
                    </div>

                    {/* Role Selector (Full Width on Mobile) */}
                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500 uppercase ml-1">
                        Role
                      </span>
                      <div className="relative">
                        <select
                          value={user.role || "dancer"}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          disabled={user.id === currentUser?.id}
                          className="bg-transparent text-zinc-200 font-bold appearance-none pr-8 focus:outline-none text-right"
                        >
                          <option value="dancer">Dancer</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                          {user.role === "admin" ? (
                            <Shield size={14} className="text-indigo-400" />
                          ) : user.role === "teacher" ? (
                            <GraduationCap
                              size={14}
                              className="text-green-400"
                            />
                          ) : (
                            <User size={14} className="text-zinc-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-zinc-500">
                  No members found.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === TAB CONTENT: TAGS === */}
      {activeTab === "tags" && (
        <div className="space-y-6">
          {/* Create Tag Form (Stacked on mobile) */}
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
          {tagsLoading ? (
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
                    <div className="relative z-10 shrink-0">
                      <KebabMenu
                        width="w-32"
                        items={[
                          {
                            label: "Rename",
                            icon: <Edit2 size={14} />,
                            onClick: () => {
                              setEditingTag(tag);
                              setNewTagName(tag.name);
                            },
                          },
                          {
                            label: "Delete",
                            icon: <Trash2 size={14} />,
                            onClick: () =>
                              setDeleteConfirm({ type: "tag", id: tag.id }),
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
      )}

      {/* === TAB CONTENT: ANALYTICS === */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {statsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
              <Loader2 className="animate-spin" size={32} />
              <p>Crunching the numbers...</p>
            </div>
          ) : (
            <>
              {/* 1. KEY METRICS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                  <div className="flex items-center gap-3 text-zinc-500 mb-2">
                    <Activity size={20} className="text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      30-Day Activity
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {stats?.monthlyPlays || 0}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Total plays this month
                  </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                  <div className="flex items-center gap-3 text-zinc-500 mb-2">
                    <Users size={20} className="text-green-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Active Dancers
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {stats?.weeklyActiveUsers || 0}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Practiced in last 7 days
                  </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
                  <div className="flex items-center gap-3 text-zinc-500 mb-2">
                    <TrendingUp size={20} className="text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Top Track
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white truncate">
                    {stats?.topMedia[0]?.title || "No data yet"}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Most popular content
                  </p>
                </div>
              </div>

              {/* 2. TOP CONTENT LIST */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-500" /> Most
                    Practiced (All Time)
                  </h3>
                </div>
                <div className="divide-y divide-zinc-800">
                  {stats?.topMedia.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-zinc-600 font-bold text-lg w-6">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-bold text-zinc-200">
                            {item.title}
                          </div>
                          <div className="text-xs text-zinc-500 uppercase">
                            {item.region} • {item.media_type}
                          </div>
                        </div>
                      </div>
                      <div className="text-indigo-400 font-bold text-sm bg-indigo-500/10 px-3 py-1 rounded-full">
                        {item.play_count} plays
                      </div>
                    </div>
                  ))}
                  {(!stats?.topMedia || stats.topMedia.length === 0) && (
                    <div className="p-8 text-center text-zinc-500 italic">
                      No analytics data recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
