'use server'

import { revalidatePath } from 'next/cache'

import { evaluateMatchCompatibility } from '@/features/compatibility/service'
import type { MatchCompatibilityEvaluation } from '@/features/compatibility/types'
import { parseEligibilityPolicyFormData } from '@/features/eligibility/policy-form'
import { saveEligibilityPolicy } from '@/features/eligibility/policy-service'
import { evaluateDerbyEligibility } from '@/features/eligibility/service'
import { upsertPairingRulesSchema } from '@/features/classification/schema'
import { upsertPairingRules } from '@/features/classification/service'
import { requirePermission } from '@/lib/auth/permissions'
import { createExtendedClient } from '@/lib/supabase/extended'

export type EligibilityActionState = { error?: string; success?: string }

export type MatchCompatibilityActionResult = {
  error?: string
  evaluation?: MatchCompatibilityEvaluation
}

export async function upsertEligibilityPolicyAction(
  _prev: EligibilityActionState,
  formData: FormData
): Promise<EligibilityActionState> {
  const profile = await requirePermission('derby_eligibility.manage')

  const parsed = parseEligibilityPolicyFormData(formData)
  if (parsed.error) return { error: parsed.error }
  if (!parsed.data) return { error: 'Invalid eligibility policy input' }

  const result = await saveEligibilityPolicy(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/edit`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}`)
  return { success: 'Eligibility settings saved' }
}

export async function evaluateMatchCompatibilityAction(
  eventId: string,
  firstRegistrationId: string,
  secondRegistrationId: string
): Promise<MatchCompatibilityActionResult> {
  await requirePermission('events.view')

  if (!eventId || !firstRegistrationId || !secondRegistrationId) {
    return { error: 'Both roosters must be selected' }
  }

  const evaluation = await evaluateMatchCompatibility(
    eventId,
    firstRegistrationId,
    secondRegistrationId
  )

  return { evaluation }
}

export async function evaluateRegistrationEligibilityAction(
  _prev: EligibilityActionState,
  formData: FormData
): Promise<EligibilityActionState> {
  const profile = await requirePermission('derby_eligibility.view')

  const eventId = formData.get('eventId')?.toString()
  const registrationId = formData.get('registrationId')?.toString()

  if (!eventId || !registrationId) {
    return { error: 'Event and registration are required' }
  }

  const evaluation = await evaluateDerbyEligibility(eventId, registrationId)

  const supabase = await createExtendedClient()
  await supabase
    .from('rooster_event_registrations')
    .update({
      eligibility_status: evaluation.status,
      eligibility_snapshot: evaluation,
      eligibility_checked_at: new Date().toISOString(),
      eligibility_checked_by: profile.id,
    })
    .eq('id', registrationId)
    .eq('event_id', eventId)

  revalidatePath(`/dashboard/events/${eventId}/roosters`)
  return { success: 'Eligibility evaluated' }
}

export async function upsertPairingRulesAction(
  _prev: EligibilityActionState,
  formData: FormData
): Promise<EligibilityActionState> {
  const profile = await requirePermission('classification.manage_pairing_rules')

  const rulesJson = formData.get('rulesJson')?.toString()
  if (!rulesJson) return { error: 'Pairing rules payload is required' }

  let rules: unknown
  try {
    rules = JSON.parse(rulesJson)
  } catch {
    return { error: 'Invalid pairing rules JSON' }
  }

  const parsed = upsertPairingRulesSchema.safeParse({
    eventId: formData.get('eventId'),
    rules,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid pairing rules' }
  }

  const result = await upsertPairingRules(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/edit`)
  return { success: 'Pairing rules saved' }
}
