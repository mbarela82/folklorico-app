"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import API_URL from "@/lib/api";
import {
  X,
  Upload,
  AlertCircle,
  Music,
  Video,
  FileVideo,
  Plus,
} from "lucide-react";
import TagSelector from "@/components/TagSelector";
import { useFolders, useCreateFolder } from "@/hooks/useTroupeData";

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
  // Hooks for Folders
  const { data: folders = [] } = useFolders();
  const createFolder = useCreateFolder();

  const [activeTab, setActiveTab] = useState<"audio" | "video">(defaultType);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  // Replaced "region" string state with ID
  const [regionId, setRegionId] = useState<string>("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
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
      setRegionId("");
      setIsCreatingFolder(false);
      setNewFolderName("");
      setSelectedTags([]);
      setMessage(null);
      setIsUploading(false);
      setUploadProgress(0);
      setStatusText("");
    }
  }, [isOpen, defaultType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        const name = e.target.files[0].name.split(".")[0];
        setTitle(name.replace(/_/g, " "));
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const newFolder = await createFolder.mutateAsync(newFolderName.trim());
      setIsCreatingFolder(false);
      setRegionId(newFolder.id.toString());
      setNewFolderName("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !regionId) {
      setMessage({
        text: "Please fill in all fields (including folder)",
        type: "error",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setStatusText("Starting upload...");
    setMessage(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!token || !user) throw new Error("You must be logged in to upload.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("region_id", regionId); // Pass ID to backend

      // Pass Name for redundancy (optional, but good for Option 2 legacy support)
      const folderName =
        folders.find((f: any) => f.id.toString() === regionId)?.name ||
        "Unknown";
      formData.append("region", folderName);

      // XHR Upload
      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
            setUploadProgress(percentComplete);
            if (percentComplete < 100) {
              setStatusText(`Uploading: ${percentComplete}%`);
            } else {
              setStatusText("Processing on Server... (Do not close)");
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error("Invalid server response"));
            }
          } else {
            try {
              const errRes = JSON.parse(xhr.responseText);
              reject(new Error(errRes.detail || "Upload failed"));
            } catch {
              reject(new Error(xhr.statusText || "Upload failed"));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.open("POST", `${API_URL}/upload/convert`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      });

      // --- FIXED LOGIC STARTS HERE ---
      // We do NOT insert into supabase here anymore.
      // The backend did it for us and returned the `data` object.

      setStatusText("Saving tags...");

      const mediaData = result.data; // This comes from backend response

      if (!mediaData || !mediaData.id) {
        throw new Error("Upload succeeded but no data returned from server.");
      }

      // Save Tags (We still do this on frontend for now, using the ID from backend)
      if (selectedTags.length > 0) {
        for (const tagName of selectedTags) {
          let tagId: number | null = null;
          const { data: existingTag } = await supabase
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .single();
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            const { data: newTag } = await supabase
              .from("tags")
              .insert({ name: tagName })
              .select()
              .single();
            if (newTag) tagId = newTag.id;
          }

          if (tagId) {
            await supabase.from("media_tags").insert({
              media_id: mediaData.id,
              tag_id: tagId,
            });
          }
        }
      }

      setUploadProgress(100);
      setStatusText("Complete!");
      setMessage({ text: "Upload successful!", type: "success" });

      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error(error);
      setMessage({ text: error.message || "Upload failed", type: "error" });
      setStatusText("");
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
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center transition-all group ${
              isUploading
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:border-indigo-500 hover:bg-zinc-800/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept={activeTab === "audio" ? "audio/*" : "video/*"}
              disabled={isUploading}
            />
            {file ? (
              <div className="text-center">
                <div className="mx-auto mb-2 w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center">
                  {activeTab === "video" ? (
                    <FileVideo size={20} />
                  ) : (
                    <Music size={20} />
                  )}
                </div>
                <p className="text-sm font-medium text-white truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
                {!isUploading && (
                  <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-wide">
                    Click to change
                  </p>
                )}
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
                disabled={isUploading}
                placeholder="e.g. El Son de la Negra"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
              />
            </div>

            {/* FOLDER SELECTOR */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1 block mb-1">
                Region / Folder
              </label>
              {!isCreatingFolder ? (
                <div className="flex gap-2">
                  <select
                    value={regionId}
                    onChange={(e) => setRegionId(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none disabled:opacity-50"
                    disabled={isUploading}
                  >
                    <option value="" disabled>
                      Select a Folder...
                    </option>
                    {folders.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsCreatingFolder(true)}
                    disabled={isUploading}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus size={14} /> New
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New Folder Name..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateFolder}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg text-xs font-bold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsCreatingFolder(false)}
                    className="text-zinc-500 px-2 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
          </div>

          {message && message.type === "error" && (
            <div className="p-3 rounded-lg flex items-center gap-2 text-sm bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertCircle size={16} />
              {message.text}
            </div>
          )}

          {isUploading ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider animate-pulse">
                  {statusText}
                </span>
                <span className="text-xs font-mono text-indigo-400">
                  {uploadProgress}%
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {uploadProgress === 100 && (
                <p className="text-[10px] text-zinc-500 mt-2 text-center">
                  Converting media format... this may take a moment.
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={handleUpload}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Upload size={20} />
              Upload Media
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
