import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import type { UpsertEligibilityPolicyInput } from '@/features/eligibility/schema'
import { buildEligibilityPolicyPayload } from '@/features/eligibility/policy-form'
import { createExtendedClient } from '@/lib/supabase/extended'

export async function saveEligibilityPolicy(
  actorId: string,
  input: UpsertEligibilityPolicyInput
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()
  const built = buildEligibilityPolicyPayload(input, actorId)
  const { eligibility_enforcement_enabled: eligibilityEnforcementEnabled, ...payload } =
    built

  const { error: policyError } = await supabase
    .from('derby_eligibility_policies')
    .upsert({ ...payload, created_by: actorId }, { onConflict: 'event_id' })

  if (policyError) return { error: policyError.message }

  const { error: eventError } = await supabase
    .from('events')
    .update({
      eligibility_enforcement_enabled: eligibilityEnforcementEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.eventId)

  if (eventError) return { error: eventError.message }

  await writeAuditLog({
    actorId,
    action: 'eligibility_policy.updated',
    entityType: 'derby_eligibility_policy',
    entityId: input.eventId,
    newValues: payload,
  })

  return {}
}
