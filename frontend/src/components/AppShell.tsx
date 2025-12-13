"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import UploadModal from "@/components/UploadModal";
import { supabase } from "@/lib/supabaseClient";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Define pages that should NOT have the sidebar
  const publicPages = ["/", "/login", "/join-troupe"];
  const isPublic = publicPages.includes(pathname);

  const handleUploadSuccess = async () => {
    // Optional: You can trigger a global refresh event here if needed,
    // but for now, the pages fetch their own data on mount.
    setIsUploadOpen(false);
  };

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-100">
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Sidebar stays persistent here! No reloading. */}
      <Sidebar onUpload={() => setIsUploadOpen(true)} />

      {/* The main content area where pages will be injected */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {children}
      </div>

      <MobileNav onUpload={() => setIsUploadOpen(true)} />
    </div>
  );
}
