// Hand-written to match supabase/migrations/0001_init.sql.
// Once a real Supabase project is linked, regenerate with:
//   supabase gen types typescript --project-id <ref> --schema public > src/integrations/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      reps: {
        Row: {
          id: string;
          name: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          name: string;
          ico: string | null;
          dic: string | null;
          address: string | null;
          city: string | null;
          zip: string | null;
          legal_form: string | null;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          niche: string | null;
          source: Database["public"]["Enums"]["lead_source"];
          stage: Database["public"]["Enums"]["lead_stage"];
          owner_rep_id: string | null;
          sourced_by_rep_id: string | null;
          closed_by_rep_id: string | null;
          value_czk: number | null;
          customer_value_czk: number | null;
          lost_reason: string | null;
          notes: string | null;
          ai_summary: string | null;
          next_follow_up: string | null;
          follow_up_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          ico?: string | null;
          dic?: string | null;
          address?: string | null;
          city?: string | null;
          zip?: string | null;
          legal_form?: string | null;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          niche?: string | null;
          source?: Database["public"]["Enums"]["lead_source"];
          stage?: Database["public"]["Enums"]["lead_stage"];
          owner_rep_id?: string | null;
          sourced_by_rep_id?: string | null;
          closed_by_rep_id?: string | null;
          value_czk?: number | null;
          customer_value_czk?: number | null;
          lost_reason?: string | null;
          notes?: string | null;
          ai_summary?: string | null;
          next_follow_up?: string | null;
          follow_up_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          ico?: string | null;
          dic?: string | null;
          address?: string | null;
          city?: string | null;
          zip?: string | null;
          legal_form?: string | null;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          niche?: string | null;
          source?: Database["public"]["Enums"]["lead_source"];
          stage?: Database["public"]["Enums"]["lead_stage"];
          owner_rep_id?: string | null;
          sourced_by_rep_id?: string | null;
          closed_by_rep_id?: string | null;
          value_czk?: number | null;
          customer_value_czk?: number | null;
          lost_reason?: string | null;
          notes?: string | null;
          ai_summary?: string | null;
          next_follow_up?: string | null;
          follow_up_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_owner_rep_id_fkey";
            columns: ["owner_rep_id"];
            isOneToOne: false;
            referencedRelation: "reps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_sourced_by_rep_id_fkey";
            columns: ["sourced_by_rep_id"];
            isOneToOne: false;
            referencedRelation: "reps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_closed_by_rep_id_fkey";
            columns: ["closed_by_rep_id"];
            isOneToOne: false;
            referencedRelation: "reps";
            referencedColumns: ["id"];
          },
        ];
      };
      activities: {
        Row: {
          id: string;
          lead_id: string;
          user_id: string;
          kind: Database["public"]["Enums"]["activity_kind"];
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          user_id: string;
          kind?: Database["public"]["Enums"]["activity_kind"];
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          user_id?: string;
          kind?: Database["public"]["Enums"]["activity_kind"];
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: Database["public"]["Enums"]["app_role"] };
        Returns: boolean;
      };
    };
    Enums: {
      lead_stage:
        | "new_lead"
        | "contacted"
        | "qualified"
        | "kickoff"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost";
      lead_source: "cold" | "warm" | "referral";
      activity_kind: "note" | "call" | "email" | "meeting" | "stage_change";
      app_role: "admin" | "sales";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;
