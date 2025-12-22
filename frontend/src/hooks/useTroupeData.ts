import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import API_URL from "@/lib/api";

// ==========================================
// 1. CORE DATA HOOKS
// ==========================================

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, role, email")
        .eq("id", user.id)
        .single();

      return data;
    },
  });
}

export function useRecentMedia() {
  return useQuery({
    queryKey: ["media", "recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("media_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
  });
}

export function useRegions(mediaType: "audio" | "video") {
  return useQuery({
    queryKey: ["regions", mediaType],
    queryFn: async () => {
      const { data } = await supabase
        .from("media_items")
        .select("region")
        .eq("media_type", mediaType)
        .order("region");
      if (!data) return [];

      // Return unique regions
      return Array.from(
        new Set(data.map((i) => i.region).filter(Boolean) as string[])
      );
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
}

export function useMediaLibrary(mediaType: "audio" | "video", region: string) {
  return useQuery({
    queryKey: ["media", mediaType, region],
    queryFn: async () => {
      let query = supabase
        .from("media_items")
        .select(`*, media_tags ( tags (name) )`)
        .eq("media_type", mediaType)
        .order("title");

      if (region !== "All") query = query.eq("region", region);

      const { data, error } = await query;
      if (error) throw error;

      // Flatten tags for easier consumption in UI
      return data.map((item: any) => ({
        ...item,
        tags: item.media_tags.map((mt: any) => mt.tags.name),
      }));
    },
  });
}

export function usePlaylists() {
  return useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playlists")
        .select(
          `
          *, 
          playlist_items(count),
          profiles ( display_name, avatar_url )
          `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAnnouncement() {
  return useQuery({
    queryKey: ["announcement"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, profiles(display_name)")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching announcement:", error);
      }
      return data;
    },
  });
}

export async function postAnnouncement(message: string, userId: string) {
  const { error } = await supabase
    .from("announcements")
    .insert({ message, author_id: userId });
  if (error) throw error;
}

// ==========================================
// 2. EVENT & CALENDAR HOOKS
// ==========================================

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export async function createEvent(eventData: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("events").insert({
    ...eventData,
    created_by: user.id,
  });
  if (error) throw error;
}

export async function updateEvent(eventId: string, updates: any) {
  const { error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", eventId);
  if (error) throw error;
}

export async function deleteEvent(eventId: string) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}

// ==========================================
// 3. ADMIN: USER MANAGEMENT
// ==========================================

export function useAllProfiles() {
  return useQuery({
    queryKey: ["all_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export async function updateRole(userId: string, newRole: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);
  if (error) throw error;
}

// --- UPDATED: Uses Backend API for complete deletion ---
export async function deleteUser(userId: string) {
  // 1. Get current session to authorize the request
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("No active session");

  // 2. Call the Python Backend
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to delete user");
  }
}

// ==========================================
// 4. ADMIN: TAG MANAGEMENT
// ==========================================

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });
}

export async function createTag(name: string) {
  const { data, error } = await supabase
    .from("tags")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTag(id: number, name: string) {
  const { data, error } = await supabase
    .from("tags")
    .update({ name })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTag(id: number) {
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw error;
}
