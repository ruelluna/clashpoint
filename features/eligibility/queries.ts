import 'server-only'

import type { DerbyEligibilityPolicy } from '@/features/eligibility/types'
import { createExtendedClient } from '@/lib/supabase/extended'

export type DerbyEligibilityPolicyRow = DerbyEligibilityPolicy & {
  id: string
  event_id: string
  enabled_eligibility_fields: string[]
  eligibility_notes: string | null
}

export async function getDerbyEligibilityPolicy(
  eventId: string
): Promise<DerbyEligibilityPolicyRow | null> {
  const supabase = await createExtendedClient()
  const { data } = await supabase
    .from('derby_eligibility_policies')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle()

  if (!data) return null
  return data as DerbyEligibilityPolicyRow
}
