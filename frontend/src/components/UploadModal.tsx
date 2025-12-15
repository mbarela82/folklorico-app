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
import TagSelector from "@/components/TagSelector";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  defaultType?: "audio" | "video";
}

export default function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  defaultType = "audio",
}: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<"audio" | "video">(defaultType);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");

  // New: Tag State
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultType);
      setFile(null);
      setTitle("");
      setRegion("");
      setSelectedTags([]); // Reset tags
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
      // 1. GET THE SESSION TOKEN
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("You must be logged in to upload.");

      const formData = new FormData();
      formData.append("file", file);

      // 2. SEND TOKEN IN HEADERS
      const response = await fetch("http://127.0.0.1:8000/upload/convert", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // <--- THIS IS NEW
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Conversion failed");
      }

      const result = await response.json();

      const finalUrl =
        typeof result.public_url === "string"
          ? result.public_url
          : result.public_url?.data?.publicUrl;

      const thumbUrl =
        typeof result.thumbnail_url === "string"
          ? result.thumbnail_url
          : result.thumbnail_url?.data?.publicUrl;

      if (!finalUrl) throw new Error("Failed to retrieve public URL");

      // 3. Save Metadata (And get the new ID)
      const { data: mediaData, error: dbError } = await supabase
        .from("media_items")
        .insert({
          uploader_id: user.id,
          title,
          region,
          media_type: activeTab,
          file_path: finalUrl,
          thumbnail_url: thumbUrl || null,
        })
        .select()
        .single(); // <--- Important: Get the new row back

      if (dbError || !mediaData) throw dbError;

      // 4. Save Tags (if any)
      if (selectedTags.length > 0) {
        for (const tagName of selectedTags) {
          // A. Find or Create Tag
          let tagId: number | null = null;

          // Check if exists
          const { data: existingTag } = await supabase
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .single();

          if (existingTag) {
            tagId = existingTag.id;
          } else {
            // Create new
            const { data: newTag } = await supabase
              .from("tags")
              .insert({ name: tagName })
              .select()
              .single();
            if (newTag) tagId = newTag.id;
          }

          // B. Link Tag to Media
          if (tagId) {
            await supabase.from("media_tags").insert({
              media_id: mediaData.id,
              tag_id: tagId,
            });
          }
        }
      }

      setMessage({ text: "Upload & Conversion successful!", type: "success" });

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
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-lg font-bold text-white">Upload Media</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-zinc-800 shrink-0">
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

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* File Picker */}
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

          {/* Form Fields */}
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
                Region
              </label>
              <input
                type="text"
                placeholder="e.g. Jalisco"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            {/* Tag Selector */}
            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
          </div>

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
            {isUploading ? "Optimizing & Uploading..." : "Upload Media"}
          </button>
        </div>
      </div>
    </div>
  );
}
