import 'server-only'

import { redirect } from 'next/navigation'

import { modulesToPermissions } from '@/lib/auth/modules'
import { getProfile } from '@/lib/auth/queries'
import { getUser } from '@/lib/auth/session'
import type { AppRole, Profile } from '@/lib/auth/types'
import { createClient } from '@/lib/supabase/server'

export const SYSTEM_OWNER_ROLES: AppRole[] = ['admin', 'system_owner']

export const DASHBOARD_ROLES: AppRole[] = [
  'admin',
  'system_owner',
  'event_organizer',
  'promoter',
  'staff',
]

export function isSystemOwnerRole(role: AppRole): boolean {
  return SYSTEM_OWNER_ROLES.includes(role)
}

export function canAccessDashboard(role: AppRole): boolean {
  return DASHBOARD_ROLES.includes(role)
}

export async function getUserPermissionIds(userId: string): Promise<string[]> {
  const profile = await getProfile(userId)
  if (!profile || !profile.is_active) return []
  if (isSystemOwnerRole(profile.role)) {
    return ['*']
  }

  const supabase = await createClient()

  if (profile.role === 'staff') {
    const { data } = await supabase
      .from('user_permissions')
      .select('permission_id')
      .eq('user_id', userId)

    return (data ?? []).map((row) => row.permission_id)
  }

  const { data } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .eq('role', profile.role)

  return (data ?? []).map((row) => row.permission_id)
}

export async function hasAnyPermission(
  userId: string,
  permissions: string[]
): Promise<boolean> {
  if (permissions.length === 0) return true

  const granted = await getUserPermissionIds(userId)
  if (granted.includes('*')) return true

  return permissions.some((permission) => granted.includes(permission))
}

export async function hasPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  return hasAnyPermission(userId, [permission])
}

export async function canAccessDashboardForProfile(
  profile: Profile
): Promise<boolean> {
  if (!profile.is_active || !canAccessDashboard(profile.role)) {
    return false
  }

  if (profile.role !== 'staff') {
    return true
  }

  const permissions = await getUserPermissionIds(profile.id)
  return permissions.length > 0
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
  if (!profile || !(await canAccessDashboardForProfile(profile))) {
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

export { modulesToPermissions }
