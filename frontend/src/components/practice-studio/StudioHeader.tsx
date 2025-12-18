import { X } from "lucide-react";

export default function StudioHeader({
  title,
  region,
  onClose,
}: {
  title: string;
  region?: string | null;
  onClose: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-zinc-900 shrink-0 bg-zinc-950 relative z-50">
      <div className="text-center flex-1 px-4 overflow-hidden">
        <h2 className="font-bold text-white text-lg truncate">{title}</h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest">
          {region || "Unknown Region"}
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white absolute right-4 top-4"
      >
        <X size={24} />
      </button>
    </div>
  );
}
