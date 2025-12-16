import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import MobileHeader from "@/components/MobileHeader";
import Providers from "@/app/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sarape - Folklorico Companion",
  description: "Practice and management for the troupe.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen bg-zinc-950 text-zinc-200 overflow-hidden">
            {/* 1. Desktop Sidebar (Left) */}
            <Sidebar />

            {/* 2. Main Content Wrapper */}
            <div className="flex-1 flex flex-col h-full relative">
              {/* Mobile Top Header */}
              <MobileHeader />

              {/* Scrollable Page Content */}
              {/* Added pb-24 so content doesn't get cut off by the bottom nav */}
              <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                {children}
              </main>
            </div>

            {/* 3. Mobile Bottom Nav (Floating Above Everything) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
              <MobileNav />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
