import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Client-side Supabase client (for use in client components)
export const createClient = () => createClientComponentClient()

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          prompt: string
          width: number
          height: number
          quantity: number
          status: string
          total_cost: number | null
          print_partner_order_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          prompt: string
          width: number
          height: number
          quantity: number
          status?: string
          total_cost?: number | null
          print_partner_order_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          prompt?: string
          width?: number
          height?: number
          quantity?: number
          status?: string
          total_cost?: number | null
          print_partner_order_id?: string | null
          updated_at?: string
        }
      }
      designs: {
        Row: {
          id: string
          order_id: string | null
          image_url: string
          openai_image_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          image_url: string
          openai_image_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          image_url?: string
          openai_image_id?: string | null
        }
      }
      uploaded_images: {
        Row: {
          id: string
          order_id: string | null
          file_path: string
          file_name: string
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          file_path: string
          file_name: string
          file_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          file_path?: string
          file_name?: string
          file_size?: number | null
        }
      }
    }
  }
}
