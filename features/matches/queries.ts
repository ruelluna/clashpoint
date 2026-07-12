import 'server-only'

import type {
  EligibleRooster,
  FightQueueSummary,
  MatchListItem,
  MatchRow,
  MatchStatus,
} from '@/features/matches/types'
import { isRoosterEligibleForMatching } from '@/features/matches/utils'
import { createClient } from '@/lib/supabase/server'

type MatchQueryRow = {
  id: string
  event_id: string
  fight_number: number
  round_number: number | null
  status: MatchStatus
  queue_status: MatchRow['queue_status']
  meron_weight: number | null
  wala_weight: number | null
  meron_entry: {
    id: string
    entry_number: string
    entry_name: string
  } | null
  wala_entry: {
    id: string
    entry_number: string
    entry_name: string
  } | null
  meron_rooster: {
    id: string
    cock_number: number
    band_number: string
  } | null
  wala_rooster: {
    id: string
    cock_number: number
    band_number: string
  } | null
}

type RoosterQueryRow = {
  id: string
  entry_id: string
  cock_number: number
  band_number: string
  category: string | null
  status: string
  entries: {
    entry_number: string
    entry_name: string
  } | null
  weighings: {
    official_weight: number | null
    weight_status: string
  } | null
}

function mapMatchRow(
  row: MatchQueryRow,
  betsByMatch: Map<string, { meron: number; wala: number }>
): MatchListItem {
  const bets = betsByMatch.get(row.id) ?? { meron: 0, wala: 0 }
  return {
    id: row.id,
    event_id: row.event_id,
    fight_number: Number(row.fight_number),
    round_number: row.round_number != null ? Number(row.round_number) : null,
    status: row.status,
    queue_status: row.queue_status,
    meron: {
      entry_id: row.meron_entry?.id ?? '',
      entry_number: row.meron_entry?.entry_number ?? '—',
      entry_name: row.meron_entry?.entry_name ?? '—',
      rooster_id: row.meron_rooster?.id ?? '',
      cock_number: Number(row.meron_rooster?.cock_number ?? 0),
      band_number: row.meron_rooster?.band_number ?? '—',
      weight: row.meron_weight != null ? Number(row.meron_weight) : null,
      bet_amount: bets.meron,
    },
    wala: {
      entry_id: row.wala_entry?.id ?? '',
      entry_number: row.wala_entry?.entry_number ?? '—',
      entry_name: row.wala_entry?.entry_name ?? '—',
      rooster_id: row.wala_rooster?.id ?? '',
      cock_number: Number(row.wala_rooster?.cock_number ?? 0),
      band_number: row.wala_rooster?.band_number ?? '—',
      weight: row.wala_weight != null ? Number(row.wala_weight) : null,
      bet_amount: bets.wala,
    },
  }
}

async function loadBetsByMatchIds(
  matchIds: string[]
): Promise<Map<string, { meron: number; wala: number }>> {
  const map = new Map<string, { meron: number; wala: number }>()
  if (matchIds.length === 0) return map

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('match_bets')
    .select('match_id, side, amount')
    .in('match_id', matchIds)

  if (error) throw error

  for (const row of data ?? []) {
    const matchId = row.match_id as string
    const current = map.get(matchId) ?? { meron: 0, wala: 0 }
    if (row.side === 'meron') current.meron = Number(row.amount)
    if (row.side === 'wala') current.wala = Number(row.amount)
    map.set(matchId, current)
  }

  return map
}

const MATCH_SELECT = `
  id,
  event_id,
  fight_number,
  round_number,
  status,
  queue_status,
  meron_weight,
  wala_weight,
  meron_entry:entries!matches_meron_entry_id_fkey ( id, entry_number, entry_name ),
  wala_entry:entries!matches_wala_entry_id_fkey ( id, entry_number, entry_name ),
  meron_rooster:rooster_records!matches_meron_rooster_id_fkey ( id, cock_number, band_number ),
  wala_rooster:rooster_records!matches_wala_rooster_id_fkey ( id, cock_number, band_number )
`

export async function listMatchesByEvent(eventId: string): Promise<MatchListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('event_id', eventId)
    .order('fight_number', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as unknown as MatchQueryRow[]
  const betsByMatch = await loadBetsByMatchIds(rows.map((row) => row.id))
  return rows.map((row) => mapMatchRow(row, betsByMatch))
}

export async function listFightQueueByEvent(eventId: string): Promise<MatchListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('event_id', eventId)
    .in('status', ['locked', 'ready', 'ongoing'])
    .order('fight_number', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as unknown as MatchQueryRow[]
  const betsByMatch = await loadBetsByMatchIds(rows.map((row) => row.id))
  return rows.map((row) => mapMatchRow(row, betsByMatch))
}

export async function getEligibleRoostersForMatching(
  eventId: string
): Promise<EligibleRooster[]> {
  const supabase = await createClient()

  const [{ data: roosters, error: roosterError }, { data: matches, error: matchError }] =
    await Promise.all([
      supabase
        .from('rooster_records')
        .select(
          `
          id,
          entry_id,
          cock_number,
          band_number,
          category,
          status,
          entries ( entry_number, entry_name ),
          weighings ( official_weight, weight_status )
        `
        )
        .eq('event_id', eventId)
        .order('cock_number', { ascending: true }),
      supabase
        .from('matches')
        .select('meron_rooster_id, wala_rooster_id, status')
        .eq('event_id', eventId),
    ])

  if (roosterError) throw roosterError
  if (matchError) throw matchError

  const usedIds = new Set<string>()
  for (const match of matches ?? []) {
    const status = match.status as MatchStatus
    if (['cancelled', 'completed'].includes(status)) continue
    usedIds.add(match.meron_rooster_id as string)
    usedIds.add(match.wala_rooster_id as string)
  }

  return ((roosters ?? []) as unknown as RoosterQueryRow[])
    .filter((row) =>
      isRoosterEligibleForMatching({
        rooster_id: row.id,
        entry_id: row.entry_id,
        event_id: eventId,
        lineup_status: row.status,
        weight_status: row.weighings?.weight_status ?? null,
      })
    )
    .filter((row) => !usedIds.has(row.id))
    .map((row) => ({
      rooster_id: row.id,
      entry_id: row.entry_id,
      entry_number: row.entries?.entry_number ?? '—',
      entry_name: row.entries?.entry_name ?? '—',
      cock_number: Number(row.cock_number),
      band_number: row.band_number,
      official_weight:
        row.weighings?.official_weight != null
          ? Number(row.weighings.official_weight)
          : null,
      category: row.category,
    }))
}

export async function listOngoingFightQueueSummaries(): Promise<FightQueueSummary[]> {
  const supabase = await createClient()

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, venue')
    .eq('status', 'ongoing')
    .is('deleted_at', null)
    .order('event_date', { ascending: true })

  if (eventsError) throw eventsError
  if (!events?.length) return []

  const eventIds = events.map((event) => event.id)
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('event_id, fight_number, queue_status')
    .in('event_id', eventIds)
    .in('status', ['locked', 'ready', 'ongoing'])

  if (matchesError) throw matchesError

  const matchesByEvent = new Map<string, Array<{ fight_number: number; queue_status: string | null }>>()
  for (const match of matches ?? []) {
    const list = matchesByEvent.get(match.event_id as string) ?? []
    list.push({
      fight_number: Number(match.fight_number),
      queue_status: match.queue_status as string | null,
    })
    matchesByEvent.set(match.event_id as string, list)
  }

  return events.map((event) => {
    const eventMatches = matchesByEvent.get(event.id) ?? []
    const scheduled_count = eventMatches.filter((m) => m.queue_status === 'scheduled').length
    const called_count = eventMatches.filter((m) => m.queue_status === 'called').length
    const ready_count = eventMatches.filter((m) => m.queue_status === 'ready').length
    const ongoing = eventMatches.find((m) => m.queue_status === 'ongoing')

    return {
      event_id: event.id,
      event_name: event.name,
      venue: event.venue,
      total_fights: eventMatches.length,
      scheduled_count,
      called_count,
      ready_count,
      ongoing_count: ongoing ? 1 : 0,
      current_fight_number: ongoing?.fight_number ?? null,
    }
  })
}
