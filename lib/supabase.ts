import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    // Only show error in browser, not during build
    console.error('Missing Supabase environment variables')
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

export type SyncState = 'local' | 'syncing' | 'synced' | 'failed'

export type Project = {
  id: string              // Stable local UUID, never changes
  remoteId?: string       // Server ID once synced to database
  name: string
  description?: string
  created_at: string
  syncState: SyncState
  lastError?: string
}

export type Todo = {
  id: string              // Stable local UUID, never changes
  remoteId?: string       // Server ID once synced to database
  text: string
  completed: boolean
  project_id: string      // References local Project.id
  created_at: string
  syncState: SyncState
  lastError?: string
}