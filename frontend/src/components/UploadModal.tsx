"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  Music,
  Video,
  Loader2,
} from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  defaultType?: "audio" | "video"; // <--- NEW PROP
}

export default function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  defaultType = "audio", // Default to audio if not specified
}: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<"audio" | "video">(defaultType);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // RESET STATE WHEN MODAL OPENS
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultType); // <--- Sync tab with current page context
      setFile(null);
      setTitle("");
      setRegion("");
      setMessage(null);
      setIsUploading(false);
    }
  }, [isOpen, defaultType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !region) {
      setMessage({ text: "Please fill in all fields", type: "error" });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // 1. Upload File to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const bucket = activeTab === "video" ? "videos" : "audio"; // Ensure these buckets exist!

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // 3. Save Metadata to DB
      const { error: dbError } = await supabase.from("media_items").insert({
        user_id: user.id,
        title,
        region,
        media_type: activeTab,
        file_path: publicUrlData.publicUrl,
      });

      if (dbError) throw dbError;

      setMessage({ text: "Upload successful!", type: "success" });
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setMessage({ text: error.message || "Upload failed", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Upload Media</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("audio")}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === "audio"
                ? "bg-zinc-800 text-indigo-400 border-b-2 border-indigo-500"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            <Music size={16} /> Audio
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === "video"
                ? "bg-zinc-800 text-indigo-400 border-b-2 border-indigo-500"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            <Video size={16} /> Video
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* File Input */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-zinc-800/50 transition-all group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept={activeTab === "audio" ? "audio/*" : "video/*"}
            />
            {file ? (
              <div className="text-center">
                <CheckCircle
                  className="mx-auto mb-2 text-green-500"
                  size={32}
                />
                <p className="text-sm font-medium text-white truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Click to change</p>
              </div>
            ) : (
              <div className="text-center text-zinc-500 group-hover:text-zinc-300">
                <Upload className="mx-auto mb-2" size={32} />
                <p className="text-sm font-medium">
                  Click to select {activeTab}
                </p>
                <p className="text-xs mt-1 opacity-50">MP3, WAV, MP4, MOV</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                Title
              </label>
              <input
                type="text"
                placeholder="e.g. El Son de la Negra"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                Region / Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Jalisco"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {message.text}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Upload size={20} />
            )}
            {isUploading ? "Uploading..." : "Upload Media"}
          </button>
        </div>
      </div>
    </div>
  );
}
