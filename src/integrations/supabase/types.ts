export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      artist_posts: {
        Row: {
          artist_id: string
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_posts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          artist_id: string
          created_at: string | null
          end_time: string
          event_date: string
          event_title: string
          id: string
          notes: string | null
          start_time: string
          status: string
          updated_at: string | null
          venue_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          end_time: string
          event_date: string
          event_title: string
          id?: string
          notes?: string | null
          start_time: string
          status?: string
          updated_at?: string | null
          venue_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          end_time?: string
          event_date?: string
          event_title?: string
          id?: string
          notes?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: Database["public"]["Enums"]["connection_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hive_rsvps: {
        Row: {
          created_at: string | null
          hive_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hive_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          hive_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hive_rsvps_hive_id_fkey"
            columns: ["hive_id"]
            isOneToOne: false
            referencedRelation: "hives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hive_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hives: {
        Row: {
          category: Database["public"]["Enums"]["hive_category"]
          cover_image_url: string | null
          created_at: string | null
          description: string
          event_date: string
          event_time: string
          host_id: string
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          max_attendees: number | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["hive_category"]
          cover_image_url?: string | null
          created_at?: string | null
          description: string
          event_date: string
          event_time: string
          host_id: string
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          max_attendees?: number | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["hive_category"]
          cover_image_url?: string | null
          created_at?: string | null
          description?: string
          event_date?: string
          event_time?: string
          host_id?: string
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          max_attendees?: number | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hives_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_event_reminder: boolean | null
          email_new_event: boolean | null
          email_new_follower: boolean | null
          email_new_post: boolean | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_event_reminder?: boolean | null
          email_new_event?: boolean | null
          email_new_follower?: boolean | null
          email_new_post?: boolean | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_event_reminder?: boolean | null
          email_new_event?: boolean | null
          email_new_follower?: boolean | null
          email_new_post?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "artist_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          amenities: string[] | null
          artist_bio: string | null
          avatar_url: string | null
          bio: string | null
          business_hours: Json | null
          business_name: string | null
          capacity: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          genres: string[] | null
          id: string
          interests: string[] | null
          is_business: boolean | null
          level: Database["public"]["Enums"]["user_level"] | null
          location: string | null
          name: string
          social_links: Json | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          venue_type: string | null
          xp: number | null
        }
        Insert: {
          amenities?: string[] | null
          artist_bio?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_hours?: Json | null
          business_name?: string | null
          capacity?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          genres?: string[] | null
          id: string
          interests?: string[] | null
          is_business?: boolean | null
          level?: Database["public"]["Enums"]["user_level"] | null
          location?: string | null
          name: string
          social_links?: Json | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          venue_type?: string | null
          xp?: number | null
        }
        Update: {
          amenities?: string[] | null
          artist_bio?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_hours?: Json | null
          business_name?: string | null
          capacity?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          genres?: string[] | null
          id?: string
          interests?: string[] | null
          is_business?: boolean | null
          level?: Database["public"]["Enums"]["user_level"] | null
          location?: string | null
          name?: string
          social_links?: Json | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          venue_type?: string | null
          xp?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_public_profiles: {
        Args: never
        Returns: {
          amenities: string[]
          artist_bio: string
          avatar_url: string
          bio: string
          business_hours: Json
          business_name: string
          capacity: number
          created_at: string
          genres: string[]
          id: string
          interests: string[]
          is_business: boolean
          level: Database["public"]["Enums"]["user_level"]
          location: string
          name: string
          social_links: Json
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          venue_type: string
          xp: number
        }[]
      }
      get_connection_suggestions: {
        Args: { for_user_id: string; limit_count?: number }
        Returns: {
          avatar_url: string
          bio: string
          id: string
          interests: string[]
          is_connected: boolean
          level: Database["public"]["Enums"]["user_level"]
          location: string
          name: string
          shared_interests_count: number
          xp: number
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          amenities: string[]
          artist_bio: string
          avatar_url: string
          bio: string
          business_hours: Json
          business_name: string
          capacity: number
          created_at: string
          genres: string[]
          id: string
          interests: string[]
          is_business: boolean
          level: Database["public"]["Enums"]["user_level"]
          location: string
          name: string
          social_links: Json
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          venue_type: string
          xp: number
        }[]
      }
      get_trending_hives: {
        Args: { limit_count?: number }
        Returns: {
          category: Database["public"]["Enums"]["hive_category"]
          cover_image_url: string
          created_at: string
          description: string
          event_date: string
          event_time: string
          host_id: string
          id: string
          latitude: number
          location: string
          longitude: number
          max_attendees: number
          rsvp_count: number
          title: string
          trending_score: number
        }[]
      }
      update_user_xp: {
        Args: { user_id: string; xp_amount: number }
        Returns: undefined
      }
    }
    Enums: {
      connection_status: "pending" | "accepted" | "rejected"
      hive_category:
        | "social"
        | "sports"
        | "arts"
        | "food"
        | "music"
        | "gaming"
        | "study"
        | "outdoors"
        | "other"
      user_level: "newbie" | "explorer" | "connector" | "influencer" | "legend"
      user_type: "fan" | "artist" | "venue"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      connection_status: ["pending", "accepted", "rejected"],
      hive_category: [
        "social",
        "sports",
        "arts",
        "food",
        "music",
        "gaming",
        "study",
        "outdoors",
        "other",
      ],
      user_level: ["newbie", "explorer", "connector", "influencer", "legend"],
      user_type: ["fan", "artist", "venue"],
    },
  },
} as const
