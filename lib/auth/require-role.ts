import { redirect } from 'next/navigation'

import {
  isSystemOwnerRole,
  requireDashboardAccess,
} from '@/lib/auth/permissions'
import { getUser } from '@/lib/auth/session'
import { getProfile } from '@/lib/auth/queries'
import type { Profile } from '@/lib/auth/types'

export async function requireAdmin(): Promise<Profile> {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getProfile(user.id)

  if (!profile || !profile.is_active || !isSystemOwnerRole(profile.role)) {
    redirect('/access-denied')
  }

  return profile
}

export { requireDashboardAccess }
