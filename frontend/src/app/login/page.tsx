"use client"; // This tells Next.js this page has interactivity (buttons/forms)

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // These variables store what the user types
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This function runs when they click "Sign In"
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the page from refreshing
    setLoading(true);
    setError(null);

    // Ask Supabase to log us in
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // If successful, go to the dashboard (we will build this next)
      router.push("/dashboard");
    }
  };

  // This function runs when they click "Sign Up"
  const handleSignUp = async () => {
    setLoading(true);
    setError(null);

    // Ask Supabase to create a new user
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: "New Dancer", // Default name
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setError("Check your email for the confirmation link!");
    }
    setLoading(false);
  };

  return (
    // The main container: Full screen height, dark background
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-4">
      {/* The Login Card */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Troupe Login
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Enter your email to practice
          </p>
        </div>

        {/* The Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="dancer@troupe.com"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Error Message Area */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-900 rounded-lg text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Buttons */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Sign In"}
          </button>

          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors text-sm"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
