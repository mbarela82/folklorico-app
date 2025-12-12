"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // <--- Added Link
import { supabase } from "@/lib/supabaseClient";
import { User, Camera, Save, Loader2, LogOut, Layers } from "lucide-react"; // <--- Added Layers
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Toast from "@/components/Toast";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUserId(user.id);
    setEmail(user.email || "");

    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || "");
      setAvatarUrl(data.avatar_url);
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      if (!userId) return;

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();

      // FIX 1: Use a FIXED filename per user.
      // This ensures we overwrite the old file instead of creating a new one.
      const filePath = `${userId}-avatar.${fileExt}`;

      setSaving(true);

      // FIX 2: Use 'upsert: true' to force overwrite
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // FIX 3: Add a timestamp to the URL to force the browser to ignore its cache
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

      // 4. Save to Database
      const { error: dbError } = await supabase.from("profiles").upsert({
        id: userId,
        avatar_url: publicUrl,
        // We don't need to manually update updated_at if we rely on the trigger,
        // but doing it here is safe.
        updated_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      setAvatarUrl(publicUrl);
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
      setToast({ msg: "Profile updated successfully!", type: "success" });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row pb-20 md:pb-0">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Sidebar onUpload={() => {}} />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 flex flex-col">
        {/* --- STANDARD MOBILE HEADER --- */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Layers size={18} className="text-white" />
          </div>
          <Link href="/dashboard">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Sarape
            </h1>
          </Link>
        </div>

        {/* Page Header (Centered on Desktop, aligned with content) */}
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

        {loading ? (
          <div className="animate-pulse text-zinc-500 text-center">
            Loading profile...
          </div>
        ) : (
          <div className="w-full max-w-lg mx-auto bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-xl">
            {/* AVATAR SECTION */}
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

                {/* Hover Overlay */}
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

            {/* FORM FIELDS */}
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

      <MobileNav onUpload={() => {}} />
    </div>
  );
}
