"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  // Define pages that should be "Fullscreen" (No Sidebar/Nav)
  const publicPages = ["/", "/login", "/join-troupe", "/update-password"];
  const isPublicPage = publicPages.includes(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="fixed inset-0 flex w-full bg-zinc-950 text-white overflow-hidden">
        {/* Desktop Sidebar (Hidden on public pages) */}
        {!isPublicPage && <Sidebar onUpload={() => {}} />}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full relative w-full isolate">
          {/* SCROLL AREA */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0 overscroll-none scroll-smooth">
            {children}
          </main>

          {/* MOBILE NAVBAR (Hidden on public pages) */}
          {!isPublicPage && (
            <div className="md:hidden absolute bottom-0 left-0 w-full z-50">
              <MobileNav onUpload={() => {}} />
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}
