export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      collab_column: {
        Row: {
          collab_id: string
          column_id: number
          created_at: string
          index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          collab_id?: string
          column_id?: number
          created_at?: string
          index?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          collab_id?: string
          column_id?: number
          created_at?: string
          index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collab_column_collab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["collab_id"]
          },
        ]
      }
      collab_item: {
        Row: {
          body: string | null
          collab_id: string
          column_id: number
          icon: string
          index: number
          item_id: number
          prio: number
          title: string
          value: number
        }
        Insert: {
          body?: string | null
          collab_id: string
          column_id: number
          icon?: string
          index: number
          item_id?: number
          prio?: number
          title: string
          value?: number
        }
        Update: {
          body?: string | null
          collab_id?: string
          column_id?: number
          icon?: string
          index?: number
          item_id?: number
          prio?: number
          title?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "collab_item_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "collab_column"
            referencedColumns: ["column_id"]
          },
          {
            foreignKeyName: "fk_item"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["collab_id"]
          },
        ]
      }
      collab_users: {
        Row: {
          collab_id: string
          connection_status:
            | Database["public"]["Enums"]["connection_status"]
            | null
          role: string | null
          user_id: string
          username: string
        }
        Insert: {
          collab_id: string
          connection_status?:
            | Database["public"]["Enums"]["connection_status"]
            | null
          role?: string | null
          user_id: string
          username: string
        }
        Update: {
          collab_id?: string
          connection_status?:
            | Database["public"]["Enums"]["connection_status"]
            | null
          role?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "colab_users_colab_id_fkey"
            columns: ["collab_id"]
            isOneToOne: false
            referencedRelation: "collabs"
            referencedColumns: ["collab_id"]
          },
          {
            foreignKeyName: "collab_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collabs: {
        Row: {
          collab_id: string
          created_at: string | null
          owner: string
          title: string
          updated_at: string | null
        }
        Insert: {
          collab_id?: string
          created_at?: string | null
          owner: string
          title: string
          updated_at?: string | null
        }
        Update: {
          collab_id?: string
          created_at?: string | null
          owner?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collabs_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      collab_roles: "read" | "write" | "owner"
      connection_status: "connected" | "disconnected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
