import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    // Only show error in browser, not during build
    console.error('Missing Supabase environment variables')
  }
}

export const supabase = createClient<Database>(
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

// Use auto-generated types from database
export type ProjectStatus = Database['public']['Enums']['status']
export type ProjectPriority = Database['public']['Enums']['priority']
export type DatabaseProject = Database['public']['Tables']['projects']['Row']
export type DatabaseTodo = Database['public']['Tables']['todos']['Row']

// Extended types for local app state (includes sync state)
export type Project = DatabaseProject & {
  id: string              // Override to use local UUID
  remoteId?: string       // Server ID once synced to database  
  syncState: SyncState
  lastError?: string
}

export type Todo = DatabaseTodo & {
  id: string              // Override to use local UUID
  remoteId?: string       // Server ID once synced to database
  completed: boolean      // Override to make non-nullable
  project_id: string      // Override to make non-nullable (References local Project.id)
  syncState: SyncState
  lastError?: string
}