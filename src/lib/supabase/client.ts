import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export function createClientSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseKey)
}

export { createClientSupabaseClient as createClient }