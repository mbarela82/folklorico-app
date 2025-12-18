import { X } from "lucide-react";

export default function MobileSideDrawer({
  isOpen,
  onClose,
  title = "Bookmarks",
  children,
  topRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  topRef?: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className={`fixed inset-0 z-[60] ${isOpen ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/35 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-black/55 backdrop-blur-md border-l border-white/10
        transition-transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            {title}
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-zinc-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
          <div ref={topRef} />
          {children}
        </div>
      </div>
    </div>
  );
}
