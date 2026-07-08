import 'server-only'

import { redirect } from 'next/navigation'

import { getProfile } from '@/lib/auth/queries'
import { getUser } from '@/lib/auth/session'
import type { AppRole, Profile } from '@/lib/auth/types'
import { createClient } from '@/lib/supabase/server'

export const SYSTEM_OWNER_ROLES: AppRole[] = ['admin', 'system_owner']

export const DASHBOARD_ROLES: AppRole[] = [
  'admin',
  'system_owner',
  'event_organizer',
  'registration_staff',
  'finance_staff',
  'weighing_staff',
  'matchmaker',
  'result_recorder',
  'promoter',
]

export function isSystemOwnerRole(role: AppRole): boolean {
  return SYSTEM_OWNER_ROLES.includes(role)
}

export function canAccessDashboard(role: AppRole): boolean {
  return DASHBOARD_ROLES.includes(role)
}

export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const profile = await getProfile(userId)
  if (!profile || !profile.is_active) return false
  if (isSystemOwnerRole(profile.role)) return true

  const supabase = await createClient()
  const { data } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .eq('role', profile.role)
    .eq('permission_id', permission)
    .maybeSingle()

  return !!data
}

export async function requirePermission(
  permission: string
): Promise<Profile> {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.is_active) redirect('/access-denied')

  const allowed = await hasPermission(user.id, permission)
  if (!allowed) redirect('/access-denied')

  return profile
}

export async function requireDashboardAccess(): Promise<Profile> {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (
    !profile ||
    !profile.is_active ||
    !canAccessDashboard(profile.role)
  ) {
    redirect('/access-denied')
  }

  return profile
}

export function canAccessPortal(role: AppRole): boolean {
  return isSystemOwnerRole(role) || role === 'promoter'
}

export async function requirePortalAccess(): Promise<Profile> {
  const user = await getUser()
  if (!user) redirect('/login')

  const profile = await getProfile(user.id)
  if (!profile || !profile.is_active || !canAccessPortal(profile.role)) {
    redirect('/access-denied')
  }

  return profile
}
