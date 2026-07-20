import 'server-only'

import { resolveEffectiveWeightLimitsGrams } from '@/features/entries/weight-utils'
import { getDerbyEligibilityPolicy } from '@/features/eligibility/queries'
import { getEvent } from '@/features/events/queries'
import type { EventRow } from '@/features/events/types'

export async function getEffectiveWeightLimitsForEvent(eventId: string) {
  const [event, policy] = await Promise.all([
    getEvent(eventId),
    getDerbyEligibilityPolicy(eventId),
  ])

  if (!event) return null

  return resolveEffectiveWeightLimitsGrams(event, policy)
}

export async function resolveEffectiveWeightLimitsForLoadedEvent(
  event: EventRow,
  eventId: string
) {
  const policy = await getDerbyEligibilityPolicy(eventId)
  return resolveEffectiveWeightLimitsGrams(event, policy)
}
