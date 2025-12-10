"use client";

import { useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({
  message,
  type = "success",
  onClose,
}: ToastProps) {
  useEffect(() => {
    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
          type === "success"
            ? "bg-zinc-900 border-green-500/50 text-green-400"
            : "bg-zinc-900 border-red-500/50 text-red-400"
        }`}
      >
        {type === "success" ? (
          <CheckCircle size={20} />
        ) : (
          <AlertCircle size={20} />
        )}
        <span className="text-sm font-medium text-white">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 hover:text-white text-zinc-500"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
