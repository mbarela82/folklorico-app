import { Database } from "@/types/supabase";

export type MediaItem = Database["public"]["Tables"]["media_items"]["Row"];
export type BookmarkItem = Database["public"]["Tables"]["bookmarks"]["Row"];
