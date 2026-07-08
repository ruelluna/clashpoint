import 'server-only'

import { createClient } from '@/lib/supabase/server'

import type { EventFinalizationRow, FinalizationSummary } from '@/features/winners/types'
import { buildWinnerListItems } from '@/features/winners/utils'
import { listStandingsForEvent } from '@/features/standings/queries'
import { getEvent } from '@/features/events/queries'

export async function getEventFinalization(
  eventId: string
): Promise<EventFinalizationRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_finalizations')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    event_id: data.event_id,
    finalized_by: data.finalized_by,
    finalized_at: data.finalized_at,
    is_locked: data.is_locked,
    champion_entry_ids: data.champion_entry_ids ?? [],
    notes: data.notes,
  }
}

export async function getFinalizationSummary(
  eventId: string
): Promise<FinalizationSummary | null> {
  const event = await getEvent(eventId)
  if (!event) return null

  const [finalization, standings] = await Promise.all([
    getEventFinalization(eventId),
    listStandingsForEvent(eventId),
  ])

  const championIds =
    finalization?.champion_entry_ids ??
    standings.filter((row) => row.rank === 1).map((row) => row.entry_id)

  return {
    finalization,
    winners: buildWinnerListItems(standings, championIds),
    tieBreakerRule: event.tie_breaker_rule,
  }
}
