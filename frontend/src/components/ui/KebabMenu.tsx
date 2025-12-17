"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface KebabMenuProps {
  items: MenuItem[];
  align?: "left" | "right";
  width?: string; // tailwind width class, e.g. "w-48"
}

export default function KebabMenu({
  items,
  align = "right",
  width = "w-48",
}: KebabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Render gate so we don't animate from (0,0)
  const [isPositioned, setIsPositioned] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const menuId = useMemo(
    () => `kebab-${Math.random().toString(36).slice(2)}`,
    []
  );

  const close = () => {
    setIsOpen(false);
    setIsPositioned(false);
  };

  const computePosition = (opts?: {
    assumeHeight?: number;
    assumeWidth?: number;
  }) => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();

    // Default placement: below the button
    let top = rect.bottom + 8;

    // Use measured menu size if available, else reasonable assumptions
    const menuEl = menuRef.current;
    const menuWidth = menuEl?.offsetWidth ?? opts?.assumeWidth ?? 192; // ~w-48
    const menuHeight = menuEl?.offsetHeight ?? opts?.assumeHeight ?? 240;

    let left = align === "left" ? rect.left : rect.right - menuWidth;

    // Clamp into viewport
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // If it would go off the bottom, place above
    if (top + menuHeight > vh - margin) {
      top = Math.max(margin, rect.top - menuHeight - 8);
    }

    left = Math.min(Math.max(left, margin), vw - menuWidth - margin);

    setPos({ top, left });
  };

  const open = () => {
    // 1) Pre-position BEFORE opening so it doesn't animate from (0,0)
    computePosition({ assumeHeight: 240, assumeWidth: 192 });
    setIsPositioned(true);
    setIsOpen(true);
  };

  // Close on outside click + Escape
  useEffect(() => {
    if (!isOpen) return;

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      close();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  // After it mounts, re-measure for perfect placement (still no jump, because we keep same top/left unless it needs clamping)
  useLayoutEffect(() => {
    if (!isOpen) return;

    // Recompute with actual size
    computePosition();

    const onReposition = () => computePosition();

    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    window.visualViewport?.addEventListener("resize", onReposition);
    window.visualViewport?.addEventListener("scroll", onReposition);

    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
      window.visualViewport?.removeEventListener("resize", onReposition);
      window.visualViewport?.removeEventListener("scroll", onReposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, align]);

  const originClass = align === "left" ? "origin-top-left" : "origin-top-right";

  const menu =
    isOpen && isPositioned ? (
      <div
        ref={menuRef}
        id={menuId}
        className={`fixed ${width} ${originClass} bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[9999] overflow-hidden`}
        style={{ top: pos.top, left: pos.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animation wrapper: animates scale/opacity only, not position */}
        <div className="animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                  item.onClick();
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-3 transition-colors ${
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
      </div>
    ) : null;

  return (
    <div
      className="relative"
      ref={rootRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        onClick={() => (isOpen ? close() : open())}
        className={`p-2 rounded-full transition-colors ${
          isOpen
            ? "bg-zinc-800 text-white"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        }`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        <MoreVertical size={20} />
      </button>

      {typeof document !== "undefined"
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
