import 'server-only'

import { permissionsToModules } from '@/lib/auth/modules'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function listUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  const profileIds = (data ?? []).map((profile) => profile.id)
  const { data: permissionRows } = await supabase
    .from('user_permissions')
    .select('user_id, permission_id')
    .in('user_id', profileIds.length > 0 ? profileIds : ['00000000-0000-0000-0000-000000000000'])

  const permissionsByUser = new Map<string, string[]>()
  for (const row of permissionRows ?? []) {
    const existing = permissionsByUser.get(row.user_id) ?? []
    existing.push(row.permission_id)
    permissionsByUser.set(row.user_id, existing)
  }

  const admin = createAdminClient()
  const usersWithEmail = await Promise.all(
    (data ?? []).map(async (profile) => {
      const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
      const permissionIds = permissionsByUser.get(profile.id) ?? []
      return {
        ...profile,
        email: authUser.user?.email ?? null,
        modules:
          profile.role === 'staff'
            ? permissionsToModules(permissionIds)
            : [],
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
