import 'server-only'

import { SYSTEM_OWNER_ROLES } from '@/lib/auth/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function needsBootstrapSetup(): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('needs_bootstrap')

  if (!error && typeof data === 'boolean') {
    return data
  }

  return !(await hasAnySystemOwner())
}

export async function hasAnySystemOwner(): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return true
  }

  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .in('role', SYSTEM_OWNER_ROLES)

  if (error) {
    return true
  }

  return (count ?? 0) > 0
}
