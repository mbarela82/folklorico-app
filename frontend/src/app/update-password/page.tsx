"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // <- uses your existing named export

export default function UpdatePasswordPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ── Guard: must have a valid session (arrive from /auth/callback recovery)
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (!data.session) router.replace("/login");
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  // Basic strength checks (adjust to your policy)
  const checks = useMemo(() => {
    const c = {
      length: password.length >= 8,
      mixed: /[A-Z]/.test(password) && /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      match: password.length > 0 && password === confirm,
    };
    const all = Object.values(c).every(Boolean);
    return { ...c, all };
  }, [password, confirm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!checks.all) {
      setErr("Please meet all password requirements.");
      return;
    }
    setLoading(true);
    try {
      // Re-confirm we still have a session (recovery link may have expired)
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setErr("Your recovery link expired. Please request a new one.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErr(error.message || "Failed to update password.");
        setLoading(false);
        return;
      }

      // Success: optional toast; fall back to alert
      try {
        // If you have a toast system, call it here
        // toast("Password updated");
      } catch {
        /* ignore */
      }
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-alert
        alert("Password updated");
      }

      const next = search.get("next");
      const dest = next && next.startsWith("/") ? next : "/dashboard";
      router.replace(dest);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <p className="text-sm text-gray-400">
          You arrived here from a secure recovery link.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">New password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              className="w-full rounded-2xl border border-gray-700 bg-black/20 p-3 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs underline"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Confirm new password</label>
          <input
            type={show ? "text" : "password"}
            className="w-full rounded-2xl border border-gray-700 bg-black/20 p-3 outline-none"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>

        {/* Requirements */}
        <ul className="mt-1 space-y-1 text-sm">
          <Req ok={checks.length}>At least 8 characters</Req>
          <Req ok={checks.mixed}>Upper &amp; lower case letters</Req>
          <Req ok={checks.digit}>At least one number</Req>
          <Req ok={checks.special}>At least one symbol</Req>
          <Req ok={checks.match}>Passwords match</Req>
        </ul>

        {err && (
          <p className="rounded-2xl border border-red-600 bg-red-950/30 p-3 text-sm text-red-300">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !checks.all}
          className="mt-2 rounded-2xl bg-white/90 px-4 py-3 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500">
        If this page doesn’t load from a recovery link,{" "}
        <button className="underline" onClick={() => router.replace("/login")}>
          go to login
        </button>
        .
      </p>
    </main>
  );
}

function Req({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          ok ? "bg-green-500" : "bg-gray-600"
        }`}
        aria-hidden
      />
      <span className={ok ? "text-green-300" : "text-gray-300"}>
        {children}
      </span>
    </li>
  );
}
