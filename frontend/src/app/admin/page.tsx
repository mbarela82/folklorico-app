"use client";

import { useState } from "react";
import { Users, Tag, BarChart3, Search, Shield } from "lucide-react";
import { useProfile } from "@/hooks/useTroupeData";

// Components
import AdminHeader from "./components/AdminHeader";
import MembersTab from "./components/MembersTab";
import TagsTab from "./components/TagsTab";
import AnalyticsTab from "./components/AnalyticsTab";

export default function AdminPage() {
  const { data: currentUser, isLoading } = useProfile();
  const [activeTab, setActiveTab] = useState<"members" | "tags" | "analytics">(
    "members"
  );
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading)
    return <div className="p-8 text-zinc-500">Loading profile...</div>;

  // Security Check (Frontend)
  if (currentUser?.role !== "admin" && currentUser?.role !== "teacher") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 h-[50vh]">
        <Shield size={48} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p>You do not have permission to view this area.</p>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full pb-24 md:pb-8">
      {/* 1. Header & Invite Logic */}
      <AdminHeader />

      {/* 2. Tabs Navigation */}
      <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl mb-6 w-fit border border-zinc-800">
        <button
          onClick={() => {
            setActiveTab("members");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "members"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Users size={16} /> Members
        </button>
        <button
          onClick={() => {
            setActiveTab("tags");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "tags"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Tag size={16} /> Tags
        </button>
        <button
          onClick={() => {
            setActiveTab("analytics");
            setSearchQuery("");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "analytics"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <BarChart3 size={16} /> Analytics
        </button>
      </div>

      {/* 3. Search Bar (Hidden on Analytics tab) */}
      {activeTab !== "analytics" && (
        <div className="mb-6 relative max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={16}
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 outline-none"
          />
        </div>
      )}

      {/* 4. Tab Content */}
      {activeTab === "members" && <MembersTab searchQuery={searchQuery} />}
      {activeTab === "tags" && <TagsTab searchQuery={searchQuery} />}
      {activeTab === "analytics" && <AnalyticsTab />}
    </main>
  );
}
