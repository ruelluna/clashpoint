import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function listUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  const admin = createAdminClient()
  const usersWithEmail = await Promise.all(
    (data ?? []).map(async (profile) => {
      const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
      return {
        ...profile,
        email: authUser.user?.email ?? null,
      }
    })
  )

  return usersWithEmail
}

export async function getUserCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
}
