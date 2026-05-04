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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_no: string | null
          balance: number
          bank: string | null
          company_id: string
          created_at: string
          id: string
          ifsc: string | null
          name: string
        }
        Insert: {
          account_no?: string | null
          balance?: number
          bank?: string | null
          company_id: string
          created_at?: string
          id?: string
          ifsc?: string | null
          name: string
        }
        Update: {
          account_no?: string | null
          balance?: number
          bank?: string | null
          company_id?: string
          created_at?: string
          id?: string
          ifsc?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          brand_accent: string | null
          brand_primary: string | null
          created_at: string
          gst_number: string | null
          id: string
          logo_url: string | null
          name: string
          plan_expires_at: string | null
          plan_id: string
          slug: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          brand_accent?: string | null
          brand_primary?: string | null
          created_at?: string
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan_expires_at?: string | null
          plan_id: string
          slug: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          brand_accent?: string | null
          brand_primary?: string | null
          created_at?: string
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan_expires_at?: string | null
          plan_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invites: {
        Row: {
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invite_status"]
          token: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_counters: {
        Row: {
          company_id: string
          kind: string
          value: number
        }
        Insert: {
          company_id: string
          kind: string
          value?: number
        }
        Update: {
          company_id?: string
          kind?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "doc_counters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          expected_rate: number | null
          from_city: string | null
          id: string
          inquiry_no: string
          material: string | null
          notes: string | null
          party_id: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          to_city: string | null
          updated_at: string
          vehicle_type: string | null
          weight_tons: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          expected_rate?: number | null
          from_city?: string | null
          id?: string
          inquiry_no: string
          material?: string | null
          notes?: string | null
          party_id?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          to_city?: string | null
          updated_at?: string
          vehicle_type?: string | null
          weight_tons?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          expected_rate?: number | null
          from_city?: string | null
          id?: string
          inquiry_no?: string
          material?: string | null
          notes?: string | null
          party_id?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          to_city?: string | null
          updated_at?: string
          vehicle_type?: string | null
          weight_tons?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_quotes: {
        Row: {
          company_id: string
          counter_rate: number | null
          created_at: string
          created_by: string | null
          id: string
          inquiry_id: string
          note: string | null
          quoted_rate: number | null
        }
        Insert: {
          company_id: string
          counter_rate?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          inquiry_id: string
          note?: string | null
          quoted_rate?: number | null
        }
        Update: {
          company_id?: string
          counter_rate?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          inquiry_id?: string
          note?: string | null
          quoted_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_quotes_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          advance_amount: number
          bilty_no: string | null
          company_id: string
          created_at: string
          created_by: string | null
          delivered_at: string | null
          driver_name: string | null
          driver_phone: string | null
          freight_amount: number
          from_city: string | null
          id: string
          inquiry_id: string | null
          material: string | null
          notes: string | null
          order_no: string
          party_id: string | null
          pickup_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          to_city: string | null
          updated_at: string
          vehicle_id: string | null
          weight_tons: number | null
        }
        Insert: {
          advance_amount?: number
          bilty_no?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          freight_amount?: number
          from_city?: string | null
          id?: string
          inquiry_id?: string | null
          material?: string | null
          notes?: string | null
          order_no: string
          party_id?: string | null
          pickup_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          to_city?: string | null
          updated_at?: string
          vehicle_id?: string | null
          weight_tons?: number | null
        }
        Update: {
          advance_amount?: number
          bilty_no?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          freight_amount?: number
          from_city?: string | null
          id?: string
          inquiry_id?: string | null
          material?: string | null
          notes?: string | null
          order_no?: string
          party_id?: string | null
          pickup_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          to_city?: string | null
          updated_at?: string
          vehicle_id?: string | null
          weight_tons?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          address: string | null
          city: string | null
          company_id: string
          created_at: string
          email: string | null
          gst: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
          type: Database["public"]["Enums"]["party_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          gst?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["party_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          gst?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["party_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          created_by: string | null
          direction: Database["public"]["Enums"]["payment_direction"]
          id: string
          mode: Database["public"]["Enums"]["payment_mode"]
          notes: string | null
          order_id: string | null
          paid_at: string
          party_id: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          created_by?: string | null
          direction: Database["public"]["Enums"]["payment_direction"]
          id?: string
          mode?: Database["public"]["Enums"]["payment_mode"]
          notes?: string | null
          order_id?: string | null
          paid_at?: string
          party_id?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          direction?: Database["public"]["Enums"]["payment_direction"]
          id?: string
          mode?: Database["public"]["Enums"]["payment_mode"]
          notes?: string | null
          order_id?: string | null
          paid_at?: string
          party_id?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          features: Json
          id: string
          is_active: boolean
          name: string
          price_inr: number
          storage_mb: number
          user_limit: number
        }
        Insert: {
          code: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price_inr?: number
          storage_mb?: number
          user_limit?: number
        }
        Update: {
          code?: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_inr?: number
          storage_mb?: number
          user_limit?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity_tons: number | null
          company_id: string
          created_at: string
          id: string
          number: string
          owner_name: string | null
          owner_phone: string | null
          type: string | null
        }
        Insert: {
          capacity_tons?: number | null
          company_id: string
          created_at?: string
          id?: string
          number: string
          owner_name?: string | null
          owner_phone?: string | null
          type?: string | null
        }
        Update: {
          capacity_tons?: number | null
          company_id?: string
          created_at?: string
          id?: string
          number?: string
          owner_name?: string | null
          owner_phone?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_company_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      next_doc_no: {
        Args: { _company_id: string; _kind: string; _prefix: string }
        Returns: string
      }
      report_party_outstanding: {
        Args: { _company_id: string }
        Returns: {
          billed: number
          outstanding: number
          party_id: string
          party_name: string
          received: number
        }[]
      }
      report_revenue_by_month: {
        Args: { _company_id: string }
        Returns: {
          month: string
          paid: number
          received: number
          revenue: number
        }[]
      }
      user_in_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "company_admin"
        | "agent"
        | "finance"
        | "transporter"
      inquiry_status: "new" | "quoted" | "negotiating" | "won" | "lost"
      invite_status: "pending" | "accepted" | "revoked" | "expired"
      order_status:
        | "created"
        | "loaded"
        | "in_transit"
        | "delivered"
        | "cancelled"
      party_type: "client" | "consignor" | "consignee" | "transporter"
      payment_direction: "receivable" | "payable"
      payment_mode: "cash" | "upi" | "bank" | "cheque"
      subscription_status: "trial" | "active" | "expired" | "suspended"
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
      app_role: [
        "super_admin",
        "company_admin",
        "agent",
        "finance",
        "transporter",
      ],
      inquiry_status: ["new", "quoted", "negotiating", "won", "lost"],
      invite_status: ["pending", "accepted", "revoked", "expired"],
      order_status: [
        "created",
        "loaded",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      party_type: ["client", "consignor", "consignee", "transporter"],
      payment_direction: ["receivable", "payable"],
      payment_mode: ["cash", "upi", "bank", "cheque"],
      subscription_status: ["trial", "active", "expired", "suspended"],
    },
  },
} as const
