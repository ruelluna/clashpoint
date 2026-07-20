import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { getEntryOutstandingDues } from '@/features/payments/service'
import type { MatchBetPaymentStatus } from '@/features/matches/types'
import { isMatchQueueReady } from '@/features/matches/utils'
import { createClient } from '@/lib/supabase/server'

export async function tryPromoteMatchToQueue(
  matchId: string,
  actorId?: string
): Promise<{ promoted: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(
      'id, event_id, fight_number, status, queue_status, meron_entry_id, wala_entry_id'
    )
    .eq('id', matchId)
    .maybeSingle()

  if (matchError) return { promoted: false, error: matchError.message }
  if (!match) return { promoted: false, error: 'Match not found' }
  if (match.status === 'cancelled' || match.status === 'completed') {
    return { promoted: false }
  }
  if (match.queue_status != null) {
    return { promoted: false }
  }

  const { data: bets, error: betsError } = await supabase
    .from('match_bets')
    .select('side, payment_status, amount, collected_amount')
    .eq('match_id', matchId)

  if (betsError) return { promoted: false, error: betsError.message }

  const meronBet = bets?.find((bet) => bet.side === 'meron')
  const walaBet = bets?.find((bet) => bet.side === 'wala')
  const meronBetStatus =
    (meronBet?.payment_status as MatchBetPaymentStatus | undefined) ?? 'unpaid'
  const walaBetStatus =
    (walaBet?.payment_status as MatchBetPaymentStatus | undefined) ?? 'unpaid'

  const [meronDues, walaDues] = await Promise.all([
    getEntryOutstandingDues(match.event_id, match.meron_entry_id),
    getEntryOutstandingDues(match.event_id, match.wala_entry_id),
  ])

  if (meronDues.error) return { promoted: false, error: meronDues.error }
  if (walaDues.error) return { promoted: false, error: walaDues.error }

  const ready = isMatchQueueReady(
    {
      betPaymentStatus: meronBetStatus,
      entryOutstanding: meronDues.dues?.totalOutstanding ?? 0,
      agreedAmount: Number(meronBet?.amount ?? 0),
      collectedAmount: Number(meronBet?.collected_amount ?? 0),
    },
    {
      betPaymentStatus: walaBetStatus,
      entryOutstanding: walaDues.dues?.totalOutstanding ?? 0,
      agreedAmount: Number(walaBet?.amount ?? 0),
      collectedAmount: Number(walaBet?.collected_amount ?? 0),
    }
  )

  if (!ready) return { promoted: false }

  const { error: updateError } = await supabase
    .from('matches')
    .update({
      status: 'locked',
      queue_status: 'scheduled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)

  if (updateError) return { promoted: false, error: updateError.message }

  if (actorId) {
    await writeAuditLog({
      actorId,
      action: 'match.auto_queued',
      entityType: 'match',
      entityId: matchId,
      newValues: {
        fightNumber: match.fight_number,
        eventId: match.event_id,
      },
    })
  }

  return { promoted: true }
}

export async function promoteMatchesForEntry(
  eventId: string,
  entryId: string,
  actorId?: string
): Promise<void> {
  const supabase = await createClient()
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id')
    .eq('event_id', eventId)
    .eq('status', 'draft')
    .is('queue_status', null)
    .or(`meron_entry_id.eq.${entryId},wala_entry_id.eq.${entryId}`)

  if (error || !matches?.length) return

  for (const match of matches) {
    await tryPromoteMatchToQueue(match.id as string, actorId)
  }
}

const BLOCKED_PLEDGE_REFUND_QUEUE_STATUSES = new Set(['called', 'ready', 'ongoing'])

export async function revertPledgePaymentSideEffects(
  matchBetId: string,
  matchId: string,
  actorId: string
): Promise<{ error?: string; demoted?: boolean }> {
  const supabase = await createClient()

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, event_id, fight_number, status, queue_status, meron_entry_id, wala_entry_id')
    .eq('id', matchId)
    .maybeSingle()

  if (matchError) return { error: matchError.message }
  if (!match) return { error: 'Match not found' }
  if (match.status === 'cancelled' || match.status === 'completed') {
    return { error: 'Cannot refund pledge for a cancelled or completed match' }
  }

  const queueStatus = match.queue_status as string | null
  if (queueStatus && BLOCKED_PLEDGE_REFUND_QUEUE_STATUSES.has(queueStatus)) {
    return {
      error: `Cannot refund pledge after fight #${match.fight_number} has been ${queueStatus}`,
    }
  }

  const { error: betUpdateError } = await supabase
    .from('match_bets')
    .update({
      payment_status: 'unpaid',
      payment_id: null,
      collected_amount: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchBetId)

  if (betUpdateError) return { error: betUpdateError.message }

  let demoted = false

  if (queueStatus === 'scheduled' && match.status === 'locked') {
    const { data: bets, error: betsError } = await supabase
      .from('match_bets')
      .select('side, payment_status, amount, collected_amount')
      .eq('match_id', matchId)

    if (betsError) return { error: betsError.message }

    const meronBet = bets?.find((bet) => bet.side === 'meron')
    const walaBet = bets?.find((bet) => bet.side === 'wala')
    const meronBetStatus =
      (meronBet?.payment_status as MatchBetPaymentStatus | undefined) ?? 'unpaid'
    const walaBetStatus =
      (walaBet?.payment_status as MatchBetPaymentStatus | undefined) ?? 'unpaid'

    const [meronDues, walaDues] = await Promise.all([
      getEntryOutstandingDues(match.event_id, match.meron_entry_id),
      getEntryOutstandingDues(match.event_id, match.wala_entry_id),
    ])

    if (meronDues.error) return { error: meronDues.error }
    if (walaDues.error) return { error: walaDues.error }

    const stillReady = isMatchQueueReady(
      {
        betPaymentStatus: meronBetStatus,
        entryOutstanding: meronDues.dues?.totalOutstanding ?? 0,
        agreedAmount: Number(meronBet?.amount ?? 0),
        collectedAmount: Number(meronBet?.collected_amount ?? 0),
      },
      {
        betPaymentStatus: walaBetStatus,
        entryOutstanding: walaDues.dues?.totalOutstanding ?? 0,
        agreedAmount: Number(walaBet?.amount ?? 0),
        collectedAmount: Number(walaBet?.collected_amount ?? 0),
      }
    )

    if (!stillReady) {
      const { error: demoteError } = await supabase
        .from('matches')
        .update({
          status: 'draft',
          queue_status: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', matchId)

      if (demoteError) return { error: demoteError.message }

      demoted = true

      await writeAuditLog({
        actorId,
        action: 'match.demoted_from_queue',
        entityType: 'match',
        entityId: matchId,
        newValues: {
          fightNumber: match.fight_number,
          eventId: match.event_id,
          reason: 'pledge_refund',
        },
      })
    }
  }

  await writeAuditLog({
    actorId,
    action: 'match_bet.payment_reverted',
    entityType: 'match_bet',
    entityId: matchBetId,
    newValues: {
      matchId,
      fightNumber: match.fight_number,
      paymentStatus: 'unpaid',
    },
  })

  return { demoted }
}
