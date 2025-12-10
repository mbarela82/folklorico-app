"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Music, ArrowRight } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // User is already logged in, go to dashboard
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) return null; // Or a loading spinner

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
      <div className="max-w-md text-center space-y-6">
        {/* Logo / Icon */}
        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30 animate-in zoom-in duration-500">
          <Music size={40} className="text-white" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight">Troupe App</h1>
        <p className="text-zinc-400 text-lg">
          The all-in-one platform for your dance troupe. Practice, organize
          playlists, and perform.
        </p>

        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-transform hover:scale-105"
          >
            Enter Studio <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
