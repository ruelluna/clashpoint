import 'server-only'

import type { PromoterStatus } from '@/features/promoters/types'
import type { Profile } from '@/lib/auth/types'
import { createClient } from '@/lib/supabase/server'

export const PROMOTER_INACTIVE_MESSAGE =
  'Your promoter account is inactive. Contact your organizer to restore access.'

export const PROMOTER_SUSPENDED_MESSAGE =
  'Your promoter account has been suspended. Contact your organizer if you believe this is an error.'

export const PROMOTER_NOT_LINKED_MESSAGE =
  'No promoter profile is linked to this account. Contact your organizer.'

export const PROMOTER_DEACTIVATED_MESSAGE =
  'Your account has been deactivated. Contact your organizer for assistance.'

type LinkedPromoter = {
  id: string
  status: PromoterStatus
  user_id: string | null
}

export type PromoterSignInAccess =
  | { allowed: true }
  | { allowed: false; message: string }

export async function getPromoterByUserId(
  userId: string
): Promise<LinkedPromoter | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('promoters')
    .select('id, status, user_id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return (data as LinkedPromoter | null) ?? null
}

export function promoterStatusDeniedMessage(
  status: PromoterStatus
): string | null {
  if (status === 'inactive') return PROMOTER_INACTIVE_MESSAGE
  if (status === 'suspended') return PROMOTER_SUSPENDED_MESSAGE
  return null
}

export async function resolvePromoterSignInAccess(
  profile: Profile
): Promise<PromoterSignInAccess> {
  const promoter = await getPromoterByUserId(profile.id)

  if (!promoter) {
    return { allowed: false, message: PROMOTER_NOT_LINKED_MESSAGE }
  }

  const statusMessage = promoterStatusDeniedMessage(promoter.status)
  if (statusMessage) {
    return { allowed: false, message: statusMessage }
  }

  if (!profile.is_active) {
    return { allowed: false, message: PROMOTER_DEACTIVATED_MESSAGE }
  }

  return { allowed: true }
}

export async function canPromoterAccessApp(profile: Profile): Promise<boolean> {
  const access = await resolvePromoterSignInAccess(profile)
  return access.allowed
}

export async function getPromoterAccessDeniedReason(
  profile: Profile
): Promise<string | null> {
  const access = await resolvePromoterSignInAccess(profile)
  return access.allowed ? null : access.message
}
