import type { Metadata, Viewport } from "next"; // Import Viewport
import { Inter } from "next/font/google";
import "./globals.css";

import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import MobileHeader from "@/components/MobileHeader";
import Providers from "@/app/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sarape",
  description: "Practice and management for the troupe.",
  // REMOVE the "manifest" line here.
  // Next.js automatically detects your manifest.ts file.
};

// ADD THIS SECTION
export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // This makes it feel like a real app (prevents pinch-zoom)
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
          <div className="flex min-h-dvh bg-zinc-950 text-zinc-200">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full relative">
              <MobileHeader />
              <main className="flex-1 overflow-y-auto md:pb-0">{children}</main>
            </div>
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950">
              <MobileNav />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
