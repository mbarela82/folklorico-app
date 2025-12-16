"use client";

import { Shield, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import Toast from "@/components/Toast";

export default function AdminHeader() {
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const handleInvite = async () => {
    const link = `${window.location.origin}/join-troupe`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
        setToast({ msg: "Link copied to clipboard!", type: "success" });
      } else {
        throw new Error("Secure context required");
      }
    } catch (err) {
      // Fallback for Mobile/HTTP
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setToast({ msg: "Link copied to clipboard!", type: "success" });
      } catch (e) {
        setToast({ msg: "Manual copy required", type: "error" });
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-indigo-400" /> Admin Dashboard
          </h1>
          <p className="text-zinc-400">
            Manage troupe members, content tags, and view stats.
          </p>
        </div>

        <button
          onClick={handleInvite}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all shrink-0 md:w-auto w-full"
        >
          <LinkIcon size={20} />
          <span className="hidden sm:inline">Invite User</span>
          <span className="sm:hidden">Invite</span>
        </button>
      </div>
    </>
  );
}
