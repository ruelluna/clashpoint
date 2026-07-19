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
    .select('side, payment_status')
    .eq('match_id', matchId)

  if (betsError) return { promoted: false, error: betsError.message }

  const meronBetStatus =
    (bets?.find((bet) => bet.side === 'meron')?.payment_status as
      | MatchBetPaymentStatus
      | undefined) ?? 'unpaid'
  const walaBetStatus =
    (bets?.find((bet) => bet.side === 'wala')?.payment_status as
      | MatchBetPaymentStatus
      | undefined) ?? 'unpaid'

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
    },
    {
      betPaymentStatus: walaBetStatus,
      entryOutstanding: walaDues.dues?.totalOutstanding ?? 0,
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
