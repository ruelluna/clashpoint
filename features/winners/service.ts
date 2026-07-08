import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { getEventWithPrize } from '@/features/events/queries'
import {
  computePrizePoolForEvent,
  distributePrizesFromStructure,
} from '@/features/prizes/service'
import { listStandingsForEvent } from '@/features/standings/queries'
import type { FinalizeWinnersInput } from '@/features/winners/schema'
import { resolveTopRankChampions } from '@/features/winners/utils'
import { createClient } from '@/lib/supabase/server'

export async function finalizeWinners(
  actorId: string,
  input: FinalizeWinnersInput
): Promise<{ error?: string; finalizationId?: string }> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('event_finalizations')
    .select('id, is_locked')
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (existing?.is_locked) {
    return { error: 'Winners are locked and cannot be re-finalized' }
  }

  const event = await getEventWithPrize(input.eventId)
  if (!event) return { error: 'Event not found' }

  const standings = await listStandingsForEvent(input.eventId)
  if (standings.length === 0) {
    return { error: 'Standings are required before finalizing winners' }
  }

  const { champions, topRank } = resolveTopRankChampions(
    standings,
    event.tie_breaker_rule
  )

  if (champions.length === 0 || topRank == null) {
    return { error: 'No ranked entries available to finalize' }
  }

  const championEntryIds = champions.map((row) => row.entry_id)
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('event_finalizations')
    .upsert(
      {
        event_id: input.eventId,
        finalized_by: actorId,
        finalized_at: now,
        is_locked: true,
        champion_entry_ids: championEntryIds,
        notes: input.notes ?? null,
      },
      { onConflict: 'event_id' }
    )
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to finalize winners' }
  }

  await writeAuditLog({
    actorId,
    action: 'winners.finalized',
    entityType: 'event_finalization',
    entityId: data.id,
    newValues: {
      event_id: input.eventId,
      champion_entry_ids: championEntryIds,
      tie_breaker_rule: event.tie_breaker_rule,
      top_rank: topRank,
    },
    reason: input.notes,
  })

  const prizePoolBreakdown = await computePrizePoolForEvent(event)
  const winnersForPrize = standings
    .filter((row) => row.rank != null)
    .map((row) => ({
      entryId: row.entry_id,
      entryNumber: row.entry_number,
      entryName: row.entry_name,
      ownerName: row.owner_name,
      rank: row.rank as number,
    }))

  const allocations = distributePrizesFromStructure(
    event,
    prizePoolBreakdown.prizePool,
    winnersForPrize
  )

  if (allocations.length > 0) {
    const { data: existingPayouts } = await supabase
      .from('prize_payouts')
      .select('payout_reference')
      .eq('event_id', input.eventId)

    const references = (existingPayouts ?? []).map(
      (row) => row.payout_reference as string
    )
    let sequence = references.length

    for (const allocation of allocations) {
      const { data: existingPayout } = await supabase
        .from('prize_payouts')
        .select('id')
        .eq('event_id', input.eventId)
        .eq('entry_id', allocation.entryId)
        .eq('rank_position', allocation.rankPosition)
        .maybeSingle()

      if (existingPayout) continue

      sequence += 1
      const payoutReference = generatePayoutReference(input.eventId, sequence)

      await supabase.from('prize_payouts').insert({
        payout_reference: payoutReference,
        event_id: input.eventId,
        entry_id: allocation.entryId,
        rank_label: allocation.label,
        rank_position: allocation.rankPosition,
        amount: allocation.amount,
        recipient_name: allocation.ownerName,
      })
    }
  }

  return { finalizationId: data.id }
}

function generatePayoutReference(eventId: string, sequence: number): string {
  const eventPrefix = eventId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `PO-${eventPrefix}-${String(sequence).padStart(4, '0')}`
}
