import { getUser } from '@/lib/auth/session'
import { getProfile } from '@/lib/auth/queries'
import type { Profile } from '@/lib/auth/types'

export async function getProfileForUser(): Promise<Profile | null> {
  const user = await getUser()

  if (!user) {
    return null
  }

  return getProfile(user.id)
}
