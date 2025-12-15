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
  const isLoginPage = pathname === "/login";

  return (
    <QueryClientProvider client={queryClient}>
      {/* NUCLEAR FIX: fixed inset-0 
         This pins the app to the 4 corners of the viewport.
         It stops the browser from messing with the height calculation. 
      */}
      <div className="fixed inset-0 flex w-full bg-zinc-950 text-white overflow-hidden">
        {/* Desktop Sidebar (Hidden on mobile via CSS inside the component) */}
        {!isLoginPage && <Sidebar />}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full relative w-full isolate">
          {/* SCROLL AREA */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0 overscroll-none scroll-smooth">
            {children}
          </main>

          {/* MOBILE NAVBAR */}
          {!isLoginPage && (
            // Absolute positioning with high Z-index to float over the scroll area
            <div className="md:hidden absolute bottom-0 left-0 w-full z-50">
              <MobileNav onUpload={() => {}} />
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}
