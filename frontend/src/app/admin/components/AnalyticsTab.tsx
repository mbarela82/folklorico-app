"use client";

import { Loader2, Activity, Users, TrendingUp } from "lucide-react";
import { useAnalyticsStats } from "@/hooks/useAnalytics";

export default function AnalyticsTab() {
  const { data: stats, isLoading } = useAnalyticsStats();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
        <Loader2 className="animate-spin" size={32} />
        <p>Crunching the numbers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* 1. KEY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Activity */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="flex items-center gap-3 text-zinc-500 mb-2">
            <Activity size={20} className="text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider">
              30-Day Activity
            </span>
          </div>
          <div className="text-3xl font-bold text-white">
            {stats?.monthlyPlays || 0}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Total plays this month</p>
        </div>

        {/* Card 2: Active Dancers */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="flex items-center gap-3 text-zinc-500 mb-2">
            <Users size={20} className="text-green-500" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Active Dancers
            </span>
          </div>
          <div className="text-3xl font-bold text-white">
            {stats?.weeklyActiveUsers || 0}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Practiced in last 7 days</p>
        </div>

        {/* Card 3: Top Track */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
          <div className="flex items-center gap-3 text-zinc-500 mb-2">
            <TrendingUp size={20} className="text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Top Track
            </span>
          </div>
          <div className="text-lg font-bold text-white truncate">
            {stats?.topMedia?.[0]?.title || "No data yet"}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Most popular content</p>
        </div>
      </div>

      {/* 2. TOP CONTENT LIST */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <h3 className="font-bold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" /> Most Practiced
            (All Time)
          </h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {stats?.topMedia?.map((item: any, i: number) => (
            <div
              key={i}
              className="p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-zinc-600 font-bold text-lg w-6">
                  {i + 1}
                </span>
                <div>
                  <div className="font-bold text-zinc-200">{item.title}</div>
                  <div className="text-xs text-zinc-500 uppercase">
                    {item.region} • {item.media_type}
                  </div>
                </div>
              </div>
              <div className="text-indigo-400 font-bold text-sm bg-indigo-500/10 px-3 py-1 rounded-full">
                {item.play_count} plays
              </div>
            </div>
          ))}
          {(!stats?.topMedia || stats.topMedia.length === 0) && (
            <div className="p-8 text-center text-zinc-500 italic">
              No analytics data recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
