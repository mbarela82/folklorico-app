"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react"; // Swapped icon to Layers (weaving concept)

export default function RootPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-lg text-center space-y-8 relative z-10">
        {/* Logo Icon */}
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20 rotate-3 transition-transform hover:rotate-6">
          <Layers size={48} className="text-white" />
        </div>

        <div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            Sarape
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Weave your music, video, and choreography into one seamless
            performance. The essential tool for your dance troupe.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-white text-zinc-950 px-8 py-4 rounded-xl font-bold text-lg hover:bg-zinc-200 transition-all hover:scale-105 shadow-xl"
          >
            Open Studio <ArrowRight size={20} />
          </Link>
        </div>

        <div className="pt-12 text-xs text-zinc-600 font-mono uppercase tracking-widest">
          sarape.app
        </div>
      </div>
    </div>
  );
}
