import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/auth/types'

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name, is_active, deactivated_at, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data
}
