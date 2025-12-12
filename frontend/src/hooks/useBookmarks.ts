import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Database } from "@/types/supabase";

type BookmarkItem = Database["public"]["Tables"]["bookmarks"]["Row"];

export function useBookmarks(mediaId: string | undefined) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    if (!mediaId) return;

    // Fetch MY private bookmarks + ALL public bookmarks
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("media_id", mediaId)
      .order("start_time", { ascending: true });

    if (data) setBookmarks(data);
    setLoading(false);
  }, [mediaId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const saveBookmark = async (
    time: number,
    note: string,
    isPublic: boolean = false
  ) => {
    if (!mediaId) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("bookmarks").insert({
      media_id: mediaId,
      user_id: user.id,
      start_time: time,
      note: note,
      is_public: isPublic,
    });

    if (!error) {
      fetchBookmarks();
      return true;
    }
    return false;
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    fetchBookmarks();
  };

  // NEW: Toggle Public Status (For Teachers/Admins)
  const togglePublic = async (bookmark: BookmarkItem) => {
    await supabase
      .from("bookmarks")
      .update({ is_public: !bookmark.is_public })
      .eq("id", bookmark.id);
    fetchBookmarks();
  };

  return {
    bookmarks,
    loading,
    saveBookmark,
    deleteBookmark,
    togglePublic, // Export new function
    refreshBookmarks: fetchBookmarks,
  };
}
