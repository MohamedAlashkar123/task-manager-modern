import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// Server-side Supabase client with service role (full access)
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables for server-side operations.'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Server-side Supabase client with user context (RLS enforced)
// For now, use service role with manual RLS enforcement
export const createServerSupabaseClientWithAuth = async () => {
  return createServerSupabaseClient()
}