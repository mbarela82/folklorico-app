"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  //Layers,
  Loader2,
  Lock,
  Mail,
  ArrowLeft,
  CheckCircle,
} from "lucide-react"; // Added Icons
import Toast from "@/components/Toast";
import BrandLogo from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  // UI State
  const [view, setView] = useState<"login" | "forgot">("login"); // <--- Toggle Views
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setToast({ msg: error.message, type: "error" });
      setLoading(false);
    } else {
      // FIX: Force a hard refresh to ensure cookies/tokens are recognized
      // Also checks if there is a 'next' URL (like /update-password)
      window.location.href = next || "/dashboard";
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // FIX: Send them to the API route first, which will forward them to /update-password
    const redirectUrl = `${window.location.origin}/auth/callback?next=/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      setToast({ msg: error.message, type: "error" });
    } else {
      setToast({
        msg: "Check your email for the reset link!",
        type: "success",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex justify-center mb-8">
          <div>
            {/* <Layers size={28} className="text-white" /> */}
            <BrandLogo size={50} />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
          {/* VIEW 1: LOGIN */}
          {view === "login" && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="text-center mb-8">
                <h1 className="text-xl font-bold text-white">Member Login</h1>
                <p className="text-sm text-zinc-500 mt-2">
                  Enter your credentials to access the library.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 ml-1">
                    <label className="block text-xs font-bold text-zinc-500 uppercase">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Forgot?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Lock size={20} />
                  )}
                  Sign In
                </button>
              </form>
            </div>
          )}

          {/* VIEW 2: FORGOT PASSWORD */}
          {view === "forgot" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setView("login")}
                className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="text-center mb-8 pt-4">
                <h1 className="text-xl font-bold text-white">Reset Password</h1>
                <p className="text-sm text-zinc-500 mt-2">
                  We'll send you a link to reset it.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5 ml-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                    placeholder="name@example.com"
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
                    <Mail size={20} />
                  )}
                  Send Link
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Need access? Ask your director for the invite link.
        </p>
      </div>
    </div>
  );
}
