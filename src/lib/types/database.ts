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
      analysis_jobs: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          status: string
          updated_at: string
          upload_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
          updated_at?: string
          upload_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          status?: string
          updated_at?: string
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_jobs_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: true
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_jobs_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: true
            referencedRelation: "uploads_with_status"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          avg_lap_time_ms: number | null
          best_lap_time_ms: number | null
          brake_efficiency: number | null
          computed_at: string
          corner_entry: number | null
          corner_exit: number | null
          id: string
          invalid_laps: number | null
          kpi_json: Json | null
          lap_consistency: number | null
          std_lap_time_ms: number | null
          throttle_smoothness: number | null
          upload_id: string
        }
        Insert: {
          avg_lap_time_ms?: number | null
          best_lap_time_ms?: number | null
          brake_efficiency?: number | null
          computed_at?: string
          corner_entry?: number | null
          corner_exit?: number | null
          id?: string
          invalid_laps?: number | null
          kpi_json?: Json | null
          lap_consistency?: number | null
          std_lap_time_ms?: number | null
          throttle_smoothness?: number | null
          upload_id: string
        }
        Update: {
          avg_lap_time_ms?: number | null
          best_lap_time_ms?: number | null
          brake_efficiency?: number | null
          computed_at?: string
          corner_entry?: number | null
          corner_exit?: number | null
          id?: string
          invalid_laps?: number | null
          kpi_json?: Json | null
          lap_consistency?: number | null
          std_lap_time_ms?: number | null
          throttle_smoothness?: number | null
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: true
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: true
            referencedRelation: "uploads_with_status"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          completion_tokens: number | null
          created_at: string
          id: string
          model: string | null
          prompt_tokens: number | null
          report: Json
          upload_id: string
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          report: Json
          upload_id: string
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          id?: string
          model?: string | null
          prompt_tokens?: number | null
          report?: Json
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: true
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: true
            referencedRelation: "uploads_with_status"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          car: string | null
          created_at: string
          error_message: string | null
          filename: string
          id: string
          lap_count: number | null
          session_date: string | null
          sim: Database["public"]["Enums"]["sim_title"]
          size_bytes: number
          status: Database["public"]["Enums"]["upload_status"]
          storage_path: string
          track: string | null
          user_id: string
        }
        Insert: {
          car?: string | null
          created_at?: string
          error_message?: string | null
          filename: string
          id?: string
          lap_count?: number | null
          session_date?: string | null
          sim?: Database["public"]["Enums"]["sim_title"]
          size_bytes: number
          status?: Database["public"]["Enums"]["upload_status"]
          storage_path: string
          track?: string | null
          user_id: string
        }
        Update: {
          car?: string | null
          created_at?: string
          error_message?: string | null
          filename?: string
          id?: string
          lap_count?: number | null
          session_date?: string | null
          sim?: Database["public"]["Enums"]["sim_title"]
          size_bytes?: number
          status?: Database["public"]["Enums"]["upload_status"]
          storage_path?: string
          track?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      uploads_with_status: {
        Row: {
          car: string | null
          created_at: string | null
          error_message: string | null
          filename: string | null
          has_metrics: boolean | null
          has_report: boolean | null
          id: string | null
          lap_count: number | null
          session_date: string | null
          sim: Database["public"]["Enums"]["sim_title"] | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["upload_status"] | null
          storage_path: string | null
          track: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _uploads_with_status_helper: {
        Args: never
        Returns: {
          car: string
          created_at: string
          error_message: string
          filename: string
          has_metrics: boolean
          has_report: boolean
          id: string
          lap_count: number
          session_date: string
          sim: Database["public"]["Enums"]["sim_title"]
          size_bytes: number
          status: Database["public"]["Enums"]["upload_status"]
          storage_path: string
          track: string
          user_id: string
        }[]
      }
      get_uploads_with_status: {
        Args: never
        Returns: {
          avg_lap_time_ms: number
          best_lap_time_ms: number
          brake_efficiency: number
          car: string
          computed_at: string
          corner_entry: number
          corner_exit: number
          created_at: string
          error_message: string
          filename: string
          id: string
          invalid_laps: number
          kpi_json: Json
          lap_consistency: number
          lap_count: number
          metric_id: string
          report_created_at: string
          report_id: string
          report_json: Json
          report_model: string
          session_date: string
          sim: Database["public"]["Enums"]["sim_title"]
          size_bytes: number
          status: Database["public"]["Enums"]["upload_status"]
          std_lap_time_ms: number
          storage_path: string
          throttle_smoothness: number
          track: string
          user_id: string
        }[]
      }
    }
    Enums: {
      sim_title: "iRacing" | "ACC" | "AC" | "rFactor2" | "AMS2" | "F1" | "Other"
      upload_status:
        | "uploaded"
        | "processing"
        | "metrics_ready"
        | "reported"
        | "error"
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
      sim_title: ["iRacing", "ACC", "AC", "rFactor2", "AMS2", "F1", "Other"],
      upload_status: [
        "uploaded",
        "processing",
        "metrics_ready",
        "reported",
        "error",
      ],
    },
  },
} as const
