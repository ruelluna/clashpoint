import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function hasServiceRoleCredentials() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function canManageProfiles() {
  const supabase = getAdminClient()

  if (!supabase) {
    return false
  }

  const { error } = await supabase
    .from('profiles')
    .select('id', { head: true, count: 'exact' })
    .limit(1)

  return !error
}

export async function countSystemOwners() {
  const supabase = getAdminClient()

  if (!supabase) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for system owner count'
    )
  }

  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .in('role', ['admin', 'system_owner'])

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function createProfileLessTestUser() {
  const supabase = getAdminClient()

  if (!supabase) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for profile-less auth tests'
    )
  }

  const email = `e2e-profileless-${Date.now()}@clashpoint.test`
  const password = `Test-${crypto.randomUUID()}`

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (createError || !created.user) {
    throw createError ?? new Error('Failed to create profile-less test user')
  }

  return {
    id: created.user.id,
    email,
    password,
  }
}

export async function createStaffTestUser() {
  const supabase = getAdminClient()

  if (!supabase) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for staff auth tests'
    )
  }

  const email = `e2e-staff-${Date.now()}@clashpoint.test`
  const password = `Test-${crypto.randomUUID()}`

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: 'E2E Staff' },
    })

  if (createError || !created.user) {
    throw createError ?? new Error('Failed to create staff test user')
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      role: 'registration_staff',
      display_name: 'E2E Staff',
      is_active: true,
    })
    .eq('id', created.user.id)

  if (updateError) {
    await supabase.auth.admin.deleteUser(created.user.id)
    throw updateError
  }

  return {
    id: created.user.id,
    email,
    password,
  }
}

export async function removeProfileForUser(userId: string) {
  const supabase = getAdminClient()

  if (!supabase) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for profile-less auth tests'
    )
  }

  const { error } = await supabase.from('profiles').delete().eq('id', userId)

  if (error) {
    throw error
  }
}

export async function deleteTestUser(userId: string) {
  const supabase = getAdminClient()

  if (!supabase) {
    return
  }

  await supabase.auth.admin.deleteUser(userId)
}
