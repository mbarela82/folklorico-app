"use client";

import { useState } from "react";
import { Upload, X, Loader2, Music, Video } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import API_URL from "@/lib/api"; // <--- IMPORT THIS
import Modal from "@/components/ui/Modal";

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
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Not authenticated");

      // 1. Prepare FormData
      const formData = new FormData();
      formData.append("file", file);

      // 2. Send to Backend (Uses API_URL)
      const response = await fetch(`${API_URL}/upload/convert`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Upload failed");
      }

      const result = await response.json();

      // 3. Save Metadata to Supabase Database
      // The backend returns { public_url, thumbnail_url }
      // We need to create the row in media_items table
      const { error: dbError } = await supabase.from("media_items").insert({
        title: file.name.split(".")[0], // Default title is filename
        media_type: defaultType,
        file_path: result.public_url, // URL from R2/Supabase
        thumbnail_url: result.thumbnail_url,
        uploader_id: session.user.id,
        region: "Uncategorized", // Default region
      });

      if (dbError) throw dbError;

      onUploadSuccess();
      onClose();
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong uploading.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upload ${defaultType === "audio" ? "Music" : "Video"}`}
    >
      <div className="space-y-6">
        {/* Drop Zone */}
        <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
          {defaultType === "audio" ? (
            <Music size={48} className="text-zinc-500 mb-4" />
          ) : (
            <Video size={48} className="text-zinc-500 mb-4" />
          )}

          <input
            type="file"
            accept={defaultType === "audio" ? "audio/*" : "video/*"}
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />

          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
          >
            Select File
          </label>

          {file && (
            <p className="mt-4 text-sm text-indigo-300 font-medium break-all">
              Selected: {file.name}
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-zinc-400 hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all flex items-center gap-2"
          >
            {isUploading && <Loader2 className="animate-spin" size={16} />}
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
