"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { User, Camera, Save, Loader2, LogOut, Layers } from "lucide-react";
import Toast from "@/components/Toast";
import { useProfile } from "@/hooks/useTroupeData"; // <--- Import Hook

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Data State (Cached)
  const { data: profile, isLoading } = useProfile();

  // Form State
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Sync Cached Data to Local State for Editing
  useEffect(() => {
    const initUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      setEmail(user.email || "");
    };
    initUser();

    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile, router]);

  const refreshProfile = () => {
    // This updates the sidebar and dashboard instantly
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      if (!userId) return;

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}-avatar.${fileExt}`;

      setSaving(true);
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

      const { error: dbError } = await supabase.from("profiles").upsert({
        id: userId,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      setAvatarUrl(publicUrl);
      refreshProfile(); // <--- Refresh Cache
      setToast({ msg: "Photo updated!", type: "success" });
    } catch (error: any) {
      console.error(error);
      setToast({
        msg: error.message || "Error uploading image",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: displayName,
      avatar_url: avatarUrl,
      email: email,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setToast({ msg: "Error saving profile", type: "error" });
    } else {
      refreshProfile(); // <--- Refresh Cache
      setToast({ msg: "Profile updated successfully!", type: "success" });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.clear(); // Clear cache on logout
    router.push("/login");
  };

  return (
    <main className="flex-1 p-6 md:p-12 flex flex-col h-full overflow-y-auto">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* PAGE HEADER */}
      <div className="w-full max-w-lg mx-auto mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="text-indigo-500" /> My Profile
        </h1>
        <button
          onClick={handleLogout}
          className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse text-zinc-500 text-center">
          Loading profile...
        </div>
      ) : (
        <div className="w-full max-w-lg mx-auto bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-xl">
          {/* AVATAR */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 group-hover:border-indigo-500 transition-colors bg-zinc-950">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <User size={48} />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              className="hidden"
              accept="image/*"
            />
            <p className="text-xs text-zinc-500 mt-3">Tap to change photo</p>
          </div>

          {/* FIELDS */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Maria Gonzalez"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Email
              </label>
              <input
                type="text"
                value={email}
                disabled
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-zinc-500 cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {saving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              Save Profile
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
