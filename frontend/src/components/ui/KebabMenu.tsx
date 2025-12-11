"use client";

import { useState, useEffect, useRef } from "react";
import { MoreVertical } from "lucide-react";

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface KebabMenuProps {
  items: MenuItem[];
}

export default function KebabMenu({ items }: KebabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div
      className="relative"
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-colors ${
          isOpen
            ? "bg-zinc-800 text-white"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        }`}
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          <div className="py-1">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  item.onClick();
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 transition-colors ${
                  item.variant === "danger"
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
