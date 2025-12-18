"use client";

import { X } from "lucide-react";

interface MobileSideDrawerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  drawerTopRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

export default function MobileSideDrawer({
  isDrawerOpen,
  setIsDrawerOpen,
  drawerTopRef,
  children,
}: MobileSideDrawerProps) {
  return (
    <div
      className={`fixed inset-0 z-[60] ${
        isDrawerOpen ? "" : "pointer-events-none"
      }`}
    >
      {/* Background Overlay */}
      <div
        className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Slide-in Drawer Container */}
      <div
        className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-black/55 backdrop-blur-md border-l border-white/10
        transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-end p-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full text-zinc-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
          <div ref={drawerTopRef} />
          {children}
        </div>
      </div>
    </div>
  );
}
