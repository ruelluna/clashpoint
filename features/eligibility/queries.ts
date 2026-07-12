import 'server-only'

import type { DerbyEligibilityPolicy } from '@/features/eligibility/types'
import { createExtendedClient } from '@/lib/supabase/extended'
import { createAdminClient } from '@/lib/supabase/admin'

export type DerbyEligibilityPolicyRow = DerbyEligibilityPolicy & {
  id: string
  event_id: string
  enabled_eligibility_fields: string[]
  eligibility_notes: string | null
}

type EligibilityQueryOptions = {
  useAdminClient?: boolean
}

export async function getDerbyEligibilityPolicy(
  eventId: string,
  options?: EligibilityQueryOptions
): Promise<DerbyEligibilityPolicyRow | null> {
  const supabase = options?.useAdminClient
    ? (createAdminClient() as Awaited<ReturnType<typeof createExtendedClient>>)
    : await createExtendedClient()
  const { data } = await supabase
    .from('derby_eligibility_policies')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle()

  if (!data) return null
  return data as DerbyEligibilityPolicyRow
}
