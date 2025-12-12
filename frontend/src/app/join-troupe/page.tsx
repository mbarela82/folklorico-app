"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Layers, Loader2, UserPlus, ArrowRight } from "lucide-react";
import Toast from "@/components/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState(""); // We capture this to pass to meta_data
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // We pass full_name here so the SQL Trigger can grab it
        // and put it into the 'display_name' column
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setToast({ msg: error.message, type: "error" });
      setLoading(false);
    } else {
      // Login immediately after signup
      await supabase.auth.signInWithPassword({ email, password });
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-sm relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-2xl">
            <Layers size={32} className="text-indigo-500" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Join the Troupe</h1>
          <p className="text-zinc-400 mt-2">
            Create your account to access the choreography library.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-white focus:border-indigo-500 outline-none transition-colors"
              placeholder="e.g. Maria Gonzalez"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-white focus:border-indigo-500 outline-none transition-colors"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-white focus:border-indigo-500 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <UserPlus size={20} />
            )}
            Create Account
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-zinc-900 text-center">
          <a
            href="/login"
            className="text-sm text-zinc-500 hover:text-white flex items-center justify-center gap-2 transition-colors"
          >
            Already have an account? Login <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
