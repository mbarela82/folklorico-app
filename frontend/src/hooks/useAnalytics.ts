import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";

export function useAnalytics() {
  // Action: Log an event (Fire and forget)
  const logEvent = async (
    mediaId: string,
    eventType: "play" | "complete" = "play"
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("analytics").insert({
      user_id: user.id,
      media_id: mediaId,
      event_type: eventType,
    });
  };

  return { logEvent };
}

// Hook: Fetch the stats for the Admin Dashboard
export function useAnalyticsStats() {
  return useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      // 1. Get Top Media from our SQL View
      const { data: topMedia } = await supabase
        .from("top_media_stats") // This matches the VIEW we created
        .select("*")
        .limit(5);

      // 2. Get Total Plays (Last 30 Days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: monthlyPlays } = await supabase
        .from("analytics")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // 3. Get Active Users (Unique users in last 7 days)
      // Note: Supabase doesn't support "distinct count" easily via JS client,
      // so we fetch the IDs and count locally (fine for small troupes).
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: activeUsers } = await supabase
        .from("analytics")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      const uniqueActive = new Set(activeUsers?.map((u) => u.user_id)).size;

      return {
        topMedia: topMedia || [],
        monthlyPlays: monthlyPlays || 0,
        weeklyActiveUsers: uniqueActive || 0,
      };
    },
  });
}
