"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Shield, User, GraduationCap, Layers, Loader2 } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Toast from "@/components/Toast";

// Types
import { Database } from "@/types/supabase";
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("dancer");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Check my role
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (myProfile?.role !== "admin") {
      router.push("/dashboard"); // Kick out non-admins
      return;
    }

    setCurrentUserRole("admin");
    fetchUsers();
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }); // Newest members first

    if (data) setUsers(data);
    setLoading(false);
  };

  const updateUserRole = async (
    userId: string,
    newRole: "dancer" | "teacher" | "admin"
  ) => {
    // Optimistic Update (Update UI instantly)
    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      setToast({ msg: "Failed to update role", type: "error" });
      fetchUsers(); // Revert on error
    } else {
      setToast({ msg: "User role updated", type: "success" });
    }
  };

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

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        Verifying Access...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Sidebar onUpload={() => {}} isAdmin={true} />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        {/* Header */}
        <div className="md:hidden flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Layers size={18} className="text-white" />
          </div>
          <Link href="/dashboard">
            <h1 className="text-xl font-bold text-white">Sarape</h1>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-indigo-500" /> Admin Dashboard
          </h1>
          <p className="text-zinc-400 mt-1">
            Manage troupe members and permissions.
          </p>
        </div>

        {/* Users Table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-500 uppercase font-bold text-xs tracking-wider">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-zinc-900/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                          <User size={14} className="text-zinc-500" />
                        </div>
                      )}
                      <span className="font-medium text-white">
                        {user.display_name || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400 font-mono text-xs">
                    {user.email}
                  </td>
                  <td className="p-4">
                    <div className="relative">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <MobileNav onUpload={() => {}} />
    </div>
  );
}
