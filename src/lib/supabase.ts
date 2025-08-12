import { createClient } from '@supabase/supabase-js'

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Database type definitions for TypeScript
export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          priority: 'low' | 'medium' | 'high'
          completed: boolean
          status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold'
          start_date: string | null
          due_date: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          priority: 'low' | 'medium' | 'high'
          completed?: boolean
          status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold'
          start_date?: string | null
          due_date?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          priority?: 'low' | 'medium' | 'high'
          completed?: boolean
          status?: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold'
          start_date?: string | null
          due_date?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          title: string
          content: string
          display_order: number
          created_at: string
          last_edited: string
        }
        Insert: {
          id?: string
          title: string
          content?: string
          display_order?: number
          created_at?: string
          last_edited?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          display_order?: number
          created_at?: string
          last_edited?: string
        }
      }
      rpa_processes: {
        Row: {
          id: string
          name: string
          description: string
          status: 'active' | 'inactive' | 'draft' | 'error'
          owner: string
          department: string
          entity_name: string | null
          start_date: string | null
          due_date: string | null
          created_at: string
          last_modified: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          status: 'active' | 'inactive' | 'draft' | 'error'
          owner?: string
          department?: string
          entity_name?: string | null
          start_date?: string | null
          due_date?: string | null
          created_at?: string
          last_modified?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          status?: 'active' | 'inactive' | 'draft' | 'error'
          owner?: string
          department?: string
          entity_name?: string | null
          start_date?: string | null
          due_date?: string | null
          created_at?: string
          last_modified?: string
        }
      }
    }
  }
}

// Type the Supabase client with our database schema
export type SupabaseClient = typeof supabase