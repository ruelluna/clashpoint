import type { AppRole, Profile } from '@/lib/auth/types'

const SYSTEM_OWNER_ROLES: AppRole[] = ['admin', 'system_owner']

export function canOperateAsStaff(profile: Profile): boolean {
  return !SYSTEM_OWNER_ROLES.includes(profile.role)
}
