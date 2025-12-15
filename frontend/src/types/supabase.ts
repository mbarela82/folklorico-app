export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      media_items: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          region: string | null;
          media_type: "audio" | "video";
          file_path: string;
          thumbnail_url: string | null;
          uploader_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          region?: string | null;
          media_type: "audio" | "video";
          file_path: string;
          thumbnail_url?: string | null;
          uploader_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          region?: string | null;
          media_type?: "audio" | "video";
          file_path?: string;
          thumbnail_url?: string | null;
          uploader_id?: string;
        };
      };
      playlists: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          user_id: string;
          is_public: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          user_id: string;
          is_public?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          user_id?: string;
          is_public?: boolean;
        };
      };
      tags: {
        Row: {
          id: number;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          created_at?: string;
        };
      };
      media_tags: {
        Row: {
          media_id: string;
          tag_id: number;
        };
        Insert: {
          media_id: string;
          tag_id: number;
        };
      };
      playlist_items: {
        Row: {
          id: string;
          playlist_id: string;
          media_id: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          media_id: string;
          order_index: number;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          media_id?: string;
          order_index?: number;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          media_id: string;
          user_id: string;
          start_time: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          media_id: string;
          user_id: string;
          start_time: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          media_id?: string;
          user_id?: string;
          start_time?: number;
          note?: string | null;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string | null;
          location: string | null;
          created_by: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time?: string | null;
          location?: string | null;
          created_by: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string | null;
          location?: string | null;
          created_by?: string;
        };
      };
    };
  };
}
