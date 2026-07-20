import 'server-only'

import type { AddPalitadaContributionInput, DeletePalitadaContributionInput } from '@/features/matches/schema'
import { loadMatchSettlementContext } from '@/features/matches/pledge-settlement-service'
import {
  buildPledgeSettlementInput,
  calculatePledgeSettlement,
  validatePalitadaContribution,
} from '@/features/matches/pledge-settlement'
import { isBetEditHardLocked } from '@/features/matches/utils'
import { writeAuditLog } from '@/features/audit/service'
import { createClient } from '@/lib/supabase/server'

export async function addPalitadaContribution(
  actorId: string,
  input: AddPalitadaContributionInput
): Promise<{ error?: string; contributionId?: string }> {
  const context = await loadMatchSettlementContext(input.eventId, input.matchId)
  if (context.error || !context.match || !context.event) {
    return { error: context.error ?? 'Match not found' }
  }

  if (
    isBetEditHardLocked(context.match.status, context.match.queue_status)
  ) {
    return { error: 'Palitada cannot be changed after handlers are called' }
  }

  const settlement = calculatePledgeSettlement(
    buildPledgeSettlementInput({
      match: context.match,
      commissionRatePercent: context.event.tax_commission,
      taxAmount: context.event.tax_per_fight,
    })
  )

  const validationError = validatePalitadaContribution({
    settlement,
    side: input.side,
    amount: input.amount,
  })
  if (validationError) return { error: validationError }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('match_palitada_contributions')
    .insert({
      match_id: input.matchId,
      event_id: input.eventId,
      side: input.side,
      contributor_name: input.contributorName.trim(),
      contributor_type: input.contributorType,
      amount: input.amount,
      recorded_by: actorId,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to record Palitada' }
  }

  await writeAuditLog({
    actorId,
    action: 'match.palitada.added',
    entityType: 'match',
    entityId: input.matchId,
    newValues: {
      contributionId: data.id,
      side: input.side,
      contributorName: input.contributorName,
      contributorType: input.contributorType,
      amount: input.amount,
    },
  })

  return { contributionId: data.id }
}

export async function deletePalitadaContribution(
  actorId: string,
  input: DeletePalitadaContributionInput
): Promise<{ error?: string }> {
  const context = await loadMatchSettlementContext(input.eventId, input.matchId)
  if (context.error || !context.match) {
    return { error: context.error ?? 'Match not found' }
  }

  if (
    isBetEditHardLocked(context.match.status, context.match.queue_status)
  ) {
    return { error: 'Palitada cannot be changed after handlers are called' }
  }

  const supabase = await createClient()
  const { data: existing, error: fetchError } = await supabase
    .from('match_palitada_contributions')
    .select('id, side, contributor_name, amount, contributor_type')
    .eq('id', input.contributionId)
    .eq('match_id', input.matchId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Palitada contribution not found' }

  const { error } = await supabase
    .from('match_palitada_contributions')
    .delete()
    .eq('id', input.contributionId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'match.palitada.deleted',
    entityType: 'match',
    entityId: input.matchId,
    oldValues: existing,
  })

  return {}
}
