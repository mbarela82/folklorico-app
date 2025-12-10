"use client";

import { CheckCircle, AlertTriangle, Info } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "success" | "danger" | "info";
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const isSuccess = type === "success";
  const isDanger = type === "danger";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div
            className={`p-3 rounded-full ${
              isSuccess
                ? "bg-green-500/10 text-green-500"
                : isDanger
                ? "bg-red-500/10 text-red-500"
                : "bg-indigo-500/10 text-indigo-500"
            }`}
          >
            {isSuccess ? (
              <CheckCircle size={32} />
            ) : isDanger ? (
              <AlertTriangle size={32} />
            ) : (
              <Info size={32} />
            )}
          </div>

          {/* Text */}
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-zinc-400">{message}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full mt-2">
            {onConfirm && (
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-colors ${
                  isDanger
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {confirmText}
              </button>
            )}
            <button
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 ${
                !onConfirm ? "w-full" : ""
              }`}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
