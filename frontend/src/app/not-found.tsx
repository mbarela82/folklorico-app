"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    // z-[100] ensures this covers the sidebar and mobile nav
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 animate-in zoom-in-50 duration-300">
        <AlertCircle size={40} className="text-zinc-500" />
      </div>

      {/* Text */}
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-zinc-400 text-lg mb-8 max-w-md">
        We looked everywhere, but we couldn't find that page.
      </p>

      {/* Action */}
      <Link
        href="/dashboard"
        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105"
      >
        <ArrowLeft size={20} />
        Return Home
      </Link>
    </div>
  );
}
