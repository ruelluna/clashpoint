'use client'

import { createClient } from '@/lib/supabase/client'
import type { MatchListItem } from '@/features/matches/types'
import {
  mapMatchListItemFromQueryRow,
  type ClientMatchQueryRow,
} from '@/features/matches/client-mapper'

export async function fetchMatchListItemClient(
  eventId: string,
  matchId: string
): Promise<MatchListItem | null> {
  const supabase = createClient()

  const { data: match, error } = await supabase
    .from('matches')
    .select(
      `
        id,
        event_id,
        fight_number,
        matching_number,
        round_number,
        status,
        queue_status,
        in_meron_odds,
        in_wala_odds,
        meron_entry_id,
        wala_entry_id,
        meron_rooster_id,
        wala_rooster_id,
        meron_weight,
        wala_weight,
        meron_entry:entries!matches_meron_entry_id_fkey (
          id,
          entry_number,
          entry_name,
          owner_name
        ),
        wala_entry:entries!matches_wala_entry_id_fkey (
          id,
          entry_number,
          entry_name,
          owner_name
        ),
        meron_rooster:rooster_event_registrations!matches_meron_rooster_id_fkey (
          id,
          cock_number,
          band_number
        ),
        wala_rooster:rooster_event_registrations!matches_wala_rooster_id_fkey (
          id,
          cock_number,
          band_number
        )
      `
    )
    .eq('event_id', eventId)
    .eq('id', matchId)
    .maybeSingle()

  if (error || !match) return null

  const [{ data: bets }, { data: palitada }] = await Promise.all([
    supabase.from('match_bets').select('*').eq('match_id', matchId),
    supabase.from('match_palitada_contributions').select('*').eq('match_id', matchId),
  ])

  return mapMatchListItemFromQueryRow(
    match as unknown as ClientMatchQueryRow,
    bets ?? [],
    palitada ?? []
  )
}
