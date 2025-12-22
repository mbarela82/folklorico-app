"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
//import { Layers } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function RootPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState("Loading Studio...");

  useEffect(() => {
    const handleNavigation = async () => {
      // 1. Initial artificial delay (for smooth visuals)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStatusText("Verifying Session...");

      // 2. Check Session
      const { data } = await supabase.auth.getSession();

      // 3. Navigate
      if (data.session) {
        setStatusText("Opening Dashboard...");
        setTimeout(() => router.replace("/dashboard"), 500);
      } else {
        router.replace("/login");
      }
    };

    handleNavigation();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center relative overflow-hidden font-sans text-white">
      {/* 1. CENTER CONTENT (Logo + Brand) */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-sm animate-in zoom-in-95 duration-700 fade-in">
        {/* Icon Box */}
        <div>
          {/* <Layers size={48} className="text-white fill-white/20" /> */}
          <BrandLogo size={65} />
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl font-black tracking-widest uppercase">
          Sarape
        </h1>

        {/* Loading Indicator (The 3 Dots) */}
        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wide animate-pulse">
            {statusText}
          </p>
        </div>
      </div>

      {/* 2. FOOTER (Bottom Text) */}
      <div className="pb-12 text-center opacity-0 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-500 fill-mode-forwards">
        <p className="text-zinc-600 text-xs font-medium">
          Folklorico Practice Companion
        </p>
        <p className="text-zinc-800 text-[10px] mt-1 font-mono">
          v1.0.0 • Secure Environment
        </p>
      </div>
    </div>
  );
}
