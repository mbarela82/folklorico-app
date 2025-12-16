"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  User,
  Shield,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  useAllProfiles,
  updateRole,
  deleteUser,
  useProfile,
} from "@/hooks/useTroupeData";
import KebabMenu from "@/components/ui/KebabMenu";
import ConfirmationModal from "@/components/ConfirmationModal";
import Toast from "@/components/Toast";

export default function MembersTab({ searchQuery }: { searchQuery: string }) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useProfile();
  const { data: users = [], isLoading } = useAllProfiles();

  // --- State ---
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- Filter & Pagination Logic ---
  const filteredUsers = users.filter(
    (u: any) =>
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to page 1 if search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // --- Handlers ---
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
    if (!deleteId) return;
    try {
      await deleteUser(deleteId);
      setToast({ msg: "User removed", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["all_profiles"] });
    } catch (error) {
      setToast({ msg: "Failed to remove user", type: "error" });
    }
    setDeleteId(null);
  };

  if (isLoading)
    return (
      <div className="text-zinc-500 animate-pulse">Loading members...</div>
    );

  return (
    <div className="space-y-4 pb-20">
      {" "}
      {/* Added pb-20 for scrolling space */}
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
        onConfirm={handleDeleteUser}
        title="Remove User?"
        message="This action cannot be undone."
        type="danger"
        confirmText="Yes, Remove"
      />
      {/* --- UNIFIED CARD LIST --- */}
      <div className="flex flex-col gap-3">
        {currentItems.map((user: any) => (
          <div
            key={user.id}
            // REMOVED 'overflow-hidden' so kebab menu can pop out
            // ADDED 'relative' and 'z-0' (we will lift z-index on hover if needed)
            className="group relative bg-zinc-900 border border-zinc-800 rounded-xl transition-all hover:border-zinc-700 hover:z-10"
          >
            <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              {/* 1. Identity Section */}
              <div className="flex items-center gap-4 md:flex-1">
                {/* Avatar */}
                <div className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 shrink-0 shadow-sm">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-zinc-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white text-base md:text-sm truncate">
                    {user.display_name || "Unnamed User"}
                  </div>
                  <div className="text-zinc-500 text-xs truncate">
                    {user.email}
                  </div>
                </div>

                {/* Mobile Kebab (Top Right Absolute) */}
                {user.id !== currentUser?.id && (
                  <div className="md:hidden">
                    <KebabMenu
                      items={[
                        {
                          label: "Remove Member",
                          icon: <Trash2 size={16} />,
                          onClick: () => setDeleteId(user.id),
                          variant: "danger",
                        },
                      ]}
                    />
                  </div>
                )}
              </div>

              {/* 2. Divider for Mobile Only */}
              <div className="h-px w-full bg-zinc-800/50 md:hidden" />

              {/* 3. Controls Section */}
              <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                {/* Role Selector */}
                <div className="relative w-full md:w-auto">
                  {/* The visual "Badge" */}
                  <div className="flex items-center justify-between md:justify-start w-full md:w-auto bg-zinc-950 md:bg-transparent border border-zinc-800 md:border-zinc-800 md:rounded-lg px-3 py-2 md:py-1.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      {user.role === "admin" ? (
                        <Shield
                          size={14}
                          className="text-indigo-400 shrink-0"
                        />
                      ) : user.role === "teacher" ? (
                        <GraduationCap
                          size={14}
                          className="text-green-400 shrink-0"
                        />
                      ) : (
                        <User size={14} className="text-zinc-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-zinc-300 capitalize">
                        {user.role || "dancer"}
                      </span>
                    </div>
                    <ChevronDown size={14} className="text-zinc-600 ml-2" />
                  </div>

                  {/* The Invisible Select (Overlay) */}
                  <select
                    value={user.role || "dancer"}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={user.id === currentUser?.id}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                  >
                    {/* STYLE THE OPTIONS DARK */}
                    <option className="bg-zinc-900 text-white" value="dancer">
                      Dancer
                    </option>
                    <option className="bg-zinc-900 text-white" value="teacher">
                      Teacher
                    </option>
                    <option className="bg-zinc-900 text-white" value="admin">
                      Admin
                    </option>
                  </select>
                </div>

                {/* Desktop Kebab */}
                {user.id !== currentUser?.id ? (
                  <div className="hidden md:block relative z-30">
                    <KebabMenu
                      items={[
                        {
                          label: "Remove Member",
                          icon: <Trash2 size={16} />,
                          onClick: () => setDeleteId(user.id),
                          variant: "danger",
                        },
                      ]}
                    />
                  </div>
                ) : (
                  <div className="hidden md:block w-8" />
                )}
              </div>
            </div>
          </div>
        ))}

        {currentItems.length === 0 && (
          <div className="p-12 text-center">
            <div className="bg-zinc-900/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-zinc-800">
              <User size={24} className="text-zinc-600" />
            </div>
            <h3 className="text-zinc-400 font-medium">No members found</h3>
          </div>
        )}
      </div>
      {/* --- PAGINATION --- */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
          <span className="text-xs text-zinc-500 pl-2">
            Page <span className="text-zinc-300 font-bold">{currentPage}</span>{" "}
            of {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-zinc-800 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
