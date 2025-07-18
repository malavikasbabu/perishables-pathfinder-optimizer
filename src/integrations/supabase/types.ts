export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cold_storage: {
        Row: {
          active: boolean | null
          capacity_kg: number
          city: string
          contact_person: string | null
          cost_per_hour: number
          created_at: string | null
          id: string
          location_lat: number
          location_lng: number
          name: string
          phone: string | null
          refrigeration_type: string | null
          state: string
          temperature_range: string | null
        }
        Insert: {
          active?: boolean | null
          capacity_kg: number
          city: string
          contact_person?: string | null
          cost_per_hour: number
          created_at?: string | null
          id?: string
          location_lat: number
          location_lng: number
          name: string
          phone?: string | null
          refrigeration_type?: string | null
          state: string
          temperature_range?: string | null
        }
        Update: {
          active?: boolean | null
          capacity_kg?: number
          city?: string
          contact_person?: string | null
          cost_per_hour?: number
          created_at?: string | null
          id?: string
          location_lat?: number
          location_lng?: number
          name?: string
          phone?: string | null
          refrigeration_type?: string | null
          state?: string
          temperature_range?: string | null
        }
        Relationships: []
      }
      daily_catches: {
        Row: {
          catch_date: string
          created_at: string | null
          estimated_price_per_kg: number | null
          fish_type: Database["public"]["Enums"]["fish_type"]
          id: string
          port_id: string
          quality_grade: string | null
          user_id: string
          volume_kg: number
          weather_conditions: string | null
        }
        Insert: {
          catch_date: string
          created_at?: string | null
          estimated_price_per_kg?: number | null
          fish_type: Database["public"]["Enums"]["fish_type"]
          id?: string
          port_id: string
          quality_grade?: string | null
          user_id: string
          volume_kg: number
          weather_conditions?: string | null
        }
        Update: {
          catch_date?: string
          created_at?: string | null
          estimated_price_per_kg?: number | null
          fish_type?: Database["public"]["Enums"]["fish_type"]
          id?: string
          port_id?: string
          quality_grade?: string | null
          user_id?: string
          volume_kg?: number
          weather_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_catches_port_id_fkey"
            columns: ["port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
        ]
      }
      forecasts: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          factors: Json | null
          fish_type: Database["public"]["Enums"]["fish_type"] | null
          forecast_type: string
          id: string
          market_id: string | null
          predicted_value: number
          target_date: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          factors?: Json | null
          fish_type?: Database["public"]["Enums"]["fish_type"] | null
          forecast_type: string
          id?: string
          market_id?: string | null
          predicted_value: number
          target_date: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          factors?: Json | null
          fish_type?: Database["public"]["Enums"]["fish_type"] | null
          forecast_type?: string
          id?: string
          market_id?: string | null
          predicted_value?: number
          target_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecasts_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_demand: {
        Row: {
          created_at: string | null
          demand_date: string
          fish_type: Database["public"]["Enums"]["fish_type"]
          id: string
          market_id: string
          price_per_kg: number
          quantity_kg: number
          seasonal_factor: number | null
        }
        Insert: {
          created_at?: string | null
          demand_date: string
          fish_type: Database["public"]["Enums"]["fish_type"]
          id?: string
          market_id: string
          price_per_kg: number
          quantity_kg: number
          seasonal_factor?: number | null
        }
        Update: {
          created_at?: string | null
          demand_date?: string
          fish_type?: Database["public"]["Enums"]["fish_type"]
          id?: string
          market_id?: string
          price_per_kg?: number
          quantity_kg?: number
          seasonal_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_demand_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          active: boolean | null
          city: string
          created_at: string | null
          id: string
          location_lat: number
          location_lng: number
          market_type: string | null
          name: string
          population_served: number | null
          state: string
        }
        Insert: {
          active?: boolean | null
          city: string
          created_at?: string | null
          id?: string
          location_lat: number
          location_lng: number
          market_type?: string | null
          name: string
          population_served?: number | null
          state: string
        }
        Update: {
          active?: boolean | null
          city?: string
          created_at?: string | null
          id?: string
          location_lat?: number
          location_lng?: number
          market_type?: string | null
          name?: string
          population_served?: number | null
          state?: string
        }
        Relationships: []
      }
      optimization_results: {
        Row: {
          cold_storage_id: string | null
          created_at: string | null
          distance_km: number
          fish_type: Database["public"]["Enums"]["fish_type"]
          id: string
          market_id: string
          net_profit: number
          optimization_date: string | null
          port_id: string
          revenue: number
          route_data: Json | null
          spoilage_percentage: number
          total_cost: number
          travel_time_hours: number
          truck_id: string
          user_id: string
          volume_kg: number
        }
        Insert: {
          cold_storage_id?: string | null
          created_at?: string | null
          distance_km: number
          fish_type: Database["public"]["Enums"]["fish_type"]
          id?: string
          market_id: string
          net_profit: number
          optimization_date?: string | null
          port_id: string
          revenue: number
          route_data?: Json | null
          spoilage_percentage: number
          total_cost: number
          travel_time_hours: number
          truck_id: string
          user_id: string
          volume_kg: number
        }
        Update: {
          cold_storage_id?: string | null
          created_at?: string | null
          distance_km?: number
          fish_type?: Database["public"]["Enums"]["fish_type"]
          id?: string
          market_id?: string
          net_profit?: number
          optimization_date?: string | null
          port_id?: string
          revenue?: number
          route_data?: Json | null
          spoilage_percentage?: number
          total_cost?: number
          travel_time_hours?: number
          truck_id?: string
          user_id?: string
          volume_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "optimization_results_cold_storage_id_fkey"
            columns: ["cold_storage_id"]
            isOneToOne: false
            referencedRelation: "cold_storage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_results_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_results_port_id_fkey"
            columns: ["port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optimization_results_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      ports: {
        Row: {
          active: boolean | null
          code: string
          contact_person: string | null
          created_at: string | null
          id: string
          location_lat: number
          location_lng: number
          name: string
          phone: string | null
          region: string
          state: string
        }
        Insert: {
          active?: boolean | null
          code: string
          contact_person?: string | null
          created_at?: string | null
          id?: string
          location_lat: number
          location_lng: number
          name: string
          phone?: string | null
          region: string
          state: string
        }
        Update: {
          active?: boolean | null
          code?: string
          contact_person?: string | null
          created_at?: string | null
          id?: string
          location_lat?: number
          location_lng?: number
          name?: string
          phone?: string | null
          region?: string
          state?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          organization: string | null
          phone: string | null
          region: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          organization?: string | null
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          organization?: string | null
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spoilage_profiles: {
        Row: {
          created_at: string | null
          fish_type: Database["public"]["Enums"]["fish_type"]
          id: string
          refrigerated_hours: number
          spoilage_rate_per_hour: number
          temperature_threshold_celsius: number | null
          unrefrigerated_hours: number
        }
        Insert: {
          created_at?: string | null
          fish_type: Database["public"]["Enums"]["fish_type"]
          id?: string
          refrigerated_hours: number
          spoilage_rate_per_hour: number
          temperature_threshold_celsius?: number | null
          unrefrigerated_hours: number
        }
        Update: {
          created_at?: string | null
          fish_type?: Database["public"]["Enums"]["fish_type"]
          id?: string
          refrigerated_hours?: number
          spoilage_rate_per_hour?: number
          temperature_threshold_celsius?: number | null
          unrefrigerated_hours?: number
        }
        Relationships: []
      }
      trucks: {
        Row: {
          available: boolean | null
          capacity_kg: number
          cost_per_km: number
          created_at: string | null
          fuel_efficiency_kmpl: number | null
          home_port_id: string | null
          id: string
          license_plate: string
          max_distance_km: number
          owner_name: string | null
          phone: string | null
          truck_type: Database["public"]["Enums"]["truck_type"]
        }
        Insert: {
          available?: boolean | null
          capacity_kg: number
          cost_per_km: number
          created_at?: string | null
          fuel_efficiency_kmpl?: number | null
          home_port_id?: string | null
          id?: string
          license_plate: string
          max_distance_km: number
          owner_name?: string | null
          phone?: string | null
          truck_type: Database["public"]["Enums"]["truck_type"]
        }
        Update: {
          available?: boolean | null
          capacity_kg?: number
          cost_per_km?: number
          created_at?: string | null
          fuel_efficiency_kmpl?: number | null
          home_port_id?: string | null
          id?: string
          license_plate?: string
          max_distance_km?: number
          owner_name?: string | null
          phone?: string | null
          truck_type?: Database["public"]["Enums"]["truck_type"]
        }
        Relationships: [
          {
            foreignKeyName: "trucks_home_port_id_fkey"
            columns: ["home_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "planner"
      fish_type: "tilapia" | "pomfret" | "mackerel" | "sardine" | "tuna"
      truck_type: "refrigerated" | "regular"
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
      app_role: ["admin", "operator", "planner"],
      fish_type: ["tilapia", "pomfret", "mackerel", "sardine", "tuna"],
      truck_type: ["refrigerated", "regular"],
    },
  },
} as const
