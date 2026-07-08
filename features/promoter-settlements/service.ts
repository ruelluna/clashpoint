import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { getEventWithPrize } from '@/features/events/queries'
import { computePrizePoolForEvent, countEligibleEntries } from '@/features/prizes/service'
import type {
  ComputeSettlementInput,
  MarkSettledInput,
} from '@/features/promoter-settlements/schema'
import { generateSettlementReference } from '@/features/promoter-settlements/schema'
import { createClient } from '@/lib/supabase/server'

async function sumCollectedPayments(eventId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('amount_paid, payment_status')
    .eq('event_id', eventId)
    .neq('payment_status', 'refunded')

  if (error) throw error

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount_paid), 0)
}

export async function computeSettlement(
  actorId: string,
  input: ComputeSettlementInput
): Promise<{ error?: string; settlementId?: string }> {
  const event = await getEventWithPrize(input.eventId)
  if (!event) return { error: 'Event not found' }
  if (!event.promoter_id) {
    return { error: 'This event has no promoter assigned' }
  }

  const supabase = await createClient()
  const { data: promoter, error: promoterError } = await supabase
    .from('promoters')
    .select('id, name, commission_type, commission_value')
    .eq('id', event.promoter_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (promoterError) return { error: promoterError.message }
  if (!promoter) return { error: 'Promoter not found' }

  const entryCount = await countEligibleEntries(input.eventId)
  const prizePoolBreakdown = await computePrizePoolForEvent(event, entryCount)
  const collected = await sumCollectedPayments(input.eventId)

  const grossCollection = prizePoolBreakdown.grossCollection
  const eligibleCollection = collected > 0 ? collected : grossCollection
  const totalExpenses = prizePoolBreakdown.totalDeductions
  const prizePool = prizePoolBreakdown.prizePool
  const promoterCommission = prizePoolBreakdown.promoterCommission
  const promoterAdvances = 0
  const guaranteedPrize = prizePoolBreakdown.guaranteedPrizeAmount

  const netAfterPrizes = eligibleCollection - totalExpenses - prizePool - promoterCommission
  const amountPayable = netAfterPrizes > 0 ? Number(netAfterPrizes.toFixed(2)) : 0
  const amountReceivable =
    netAfterPrizes < 0 ? Number(Math.abs(netAfterPrizes).toFixed(2)) : 0

  const { data: existing } = await supabase
    .from('promoter_settlements')
    .select('id, settlement_reference, settlement_status')
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (existing?.settlement_status === 'settled') {
    return { error: 'Settlement is already marked as settled' }
  }

  const now = new Date().toISOString()
  const payload = {
    event_id: input.eventId,
    promoter_id: promoter.id,
    gross_collection: grossCollection,
    eligible_collection: eligibleCollection,
    total_expenses: totalExpenses,
    prize_pool: prizePool,
    promoter_commission: promoterCommission,
    promoter_advances: promoterAdvances,
    guaranteed_prize: guaranteedPrize,
    amount_payable: amountPayable,
    amount_receivable: amountReceivable,
    settlement_status: 'for_review' as const,
    updated_at: now,
  }

  let settlementId: string

  if (existing) {
    const { data, error } = await supabase
      .from('promoter_settlements')
      .update(payload)
      .eq('id', existing.id)
      .select('id')
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Failed to update settlement' }
    }
    settlementId = data.id
  } else {
    const settlementReference = generateSettlementReference(input.eventId, 1)
    const { data, error } = await supabase
      .from('promoter_settlements')
      .insert({
        ...payload,
        settlement_reference: settlementReference,
      })
      .select('id')
      .single()

    if (error || !data) {
      return { error: error?.message ?? 'Failed to compute settlement' }
    }
    settlementId = data.id
  }

  await writeAuditLog({
    actorId,
    action: 'settlement.computed',
    entityType: 'promoter_settlement',
    entityId: settlementId,
    newValues: {
      event_id: input.eventId,
      promoter_id: promoter.id,
      gross_collection: grossCollection,
      eligible_collection: eligibleCollection,
      prize_pool: prizePool,
      promoter_commission: promoterCommission,
      amount_payable: amountPayable,
      amount_receivable: amountReceivable,
    },
  })

  return { settlementId }
}

export async function markSettled(
  actorId: string,
  input: MarkSettledInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: settlement, error: fetchError } = await supabase
    .from('promoter_settlements')
    .select('id, settlement_reference, event_id, settlement_status')
    .eq('id', input.settlementId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!settlement) return { error: 'Settlement not found' }
  if (settlement.settlement_status === 'settled') {
    return { error: 'Settlement is already settled' }
  }

  const settledAt = new Date().toISOString()
  const { error } = await supabase
    .from('promoter_settlements')
    .update({
      settlement_status: 'settled',
      settled_by: actorId,
      settled_at: settledAt,
      notes: input.notes ?? null,
      updated_at: settledAt,
    })
    .eq('id', input.settlementId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'settlement.settled',
    entityType: 'promoter_settlement',
    entityId: input.settlementId,
    oldValues: {
      settlement_reference: settlement.settlement_reference,
      settlement_status: settlement.settlement_status,
    },
    newValues: {
      settlement_status: 'settled',
      settled_at: settledAt,
    },
    reason: input.notes,
  })

  return {}
}
