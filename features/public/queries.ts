import 'server-only'

import { rankStandings } from '@/features/standings/utils'
import type {
  PublicEvent,
  PublicEventListItem,
  PublicMatch,
  PublicStanding,
  PublicWinnersSummary,
} from '@/features/public/types'
import type { MatchStatus } from '@/features/matches/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type EventPublishRow = {
  id: string
  name: string
  venue: string
  event_date: string
  event_type: PublicEvent['event_type']
  derby_type: PublicEvent['derby_type']
  status: PublicEvent['status']
  cocks_per_entry: number
  tax_per_fight: number
  registration_rules: string | null
  is_public: boolean
  publish_matches: boolean
  publish_standings: boolean
  publish_winners: boolean
  publish_prize_amounts: boolean
  deleted_at: string | null
  promoters: { name: string } | null
}

type MatchQueryRow = {
  id: string
  event_id: string
  fight_number: number
  round_number: number | null
  status: MatchStatus
  queue_status: string | null
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
  meron_rooster:rooster_event_registrations!matches_meron_rooster_id_fkey ( id, cock_number, band_number ),
  wala_rooster:rooster_event_registrations!matches_wala_rooster_id_fkey ( id, cock_number, band_number )
`

function mapPublicEvent(row: EventPublishRow): PublicEvent {
  return {
    id: row.id,
    name: row.name,
    venue: row.venue,
    event_date: row.event_date,
    event_type: row.event_type,
    derby_type: row.derby_type,
    status: row.status,
    cocks_per_entry: Number(row.cocks_per_entry),
    tax_per_fight: Number(row.tax_per_fight),
    registration_rules: row.registration_rules,
    promoter_name: row.promoters?.name ?? null,
    publish_matches: row.publish_matches,
    publish_standings: row.publish_standings,
    publish_winners: row.publish_winners,
    publish_prize_amounts: row.publish_prize_amounts,
  }
}

function mapMatchRow(row: MatchQueryRow): PublicMatch {
  return {
    id: row.id,
    event_id: row.event_id,
    fight_number: Number(row.fight_number),
    round_number: row.round_number != null ? Number(row.round_number) : null,
    status: row.status,
    queue_status: row.queue_status as PublicMatch['queue_status'],
    meron: {
      entry_id: row.meron_entry?.id ?? '',
      entry_number: row.meron_entry?.entry_number ?? '—',
      entry_name: row.meron_entry?.entry_name ?? '—',
      rooster_id: row.meron_rooster?.id ?? '',
      cock_number: Number(row.meron_rooster?.cock_number ?? 0),
      band_number: row.meron_rooster?.band_number ?? '—',
      weight: row.meron_weight != null ? Number(row.meron_weight) : null,
    },
    wala: {
      entry_id: row.wala_entry?.id ?? '',
      entry_number: row.wala_entry?.entry_number ?? '—',
      entry_name: row.wala_entry?.entry_name ?? '—',
      rooster_id: row.wala_rooster?.id ?? '',
      cock_number: Number(row.wala_rooster?.cock_number ?? 0),
      band_number: row.wala_rooster?.band_number ?? '—',
      weight: row.wala_weight != null ? Number(row.wala_weight) : null,
    },
  }
}

async function getPublicEventRow(
  eventId: string
): Promise<EventPublishRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      name,
      venue,
      event_date,
      event_type,
      derby_type,
      status,
      cocks_per_entry,
      tax_per_fight,
      registration_rules,
      is_public,
      publish_matches,
      publish_standings,
      publish_winners,
      publish_prize_amounts,
      deleted_at,
      promoters ( name )
    `
    )
    .eq('id', eventId)
    .eq('is_public', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  return (data as unknown as EventPublishRow | null) ?? null
}

export async function listPublicEvents(): Promise<PublicEventListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      name,
      venue,
      event_date,
      event_type,
      derby_type,
      status,
      promoters ( name )
    `
    )
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('event_date', { ascending: false })

  if (error) throw error

  return ((data ?? []) as unknown as Array<{
    id: string
    name: string
    venue: string
    event_date: string
    event_type: PublicEventListItem['event_type']
    derby_type: PublicEventListItem['derby_type']
    status: PublicEventListItem['status']
    promoters: { name: string } | null
  }>).map((row) => ({
    id: row.id,
    name: row.name,
    venue: row.venue,
    event_date: row.event_date,
    event_type: row.event_type,
    derby_type: row.derby_type,
    status: row.status,
    promoter_name: row.promoters?.name ?? null,
  }))
}

export async function getPublicEvent(
  eventId: string
): Promise<PublicEvent | null> {
  const row = await getPublicEventRow(eventId)
  if (!row) return null
  return mapPublicEvent(row)
}

export async function getPublicMatches(
  eventId: string
): Promise<PublicMatch[] | null> {
  const event = await getPublicEventRow(eventId)
  if (!event?.publish_matches) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('event_id', eventId)
    .order('fight_number', { ascending: true })

  if (error) throw error
  return ((data ?? []) as unknown as MatchQueryRow[]).map(mapMatchRow)
}

export async function getPublicStandings(
  eventId: string
): Promise<PublicStanding[] | null> {
  const event = await getPublicEventRow(eventId)
  if (!event?.publish_standings) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('standings')
    .select(
      `
      id,
      entry_id,
      total_fights,
      wins,
      losses,
      draws,
      points,
      rank,
      status
    `
    )
    .eq('event_id', eventId)
    .order('rank', { ascending: true, nullsFirst: false })
    .order('points', { ascending: false })

  if (error) throw error

  const rows = data ?? []
  const entryIds = rows.map((row) => row.entry_id as string)
  const entryMap = new Map<
    string,
    { entry_number: string; entry_name: string; owner_name: string }
  >()

  if (entryIds.length > 0) {
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, entry_number, entry_name, owner_name')
      .in('id', entryIds)

    if (entriesError) throw entriesError

    for (const entry of entries ?? []) {
      entryMap.set(entry.id as string, {
        entry_number: entry.entry_number as string,
        entry_name: entry.entry_name as string,
        owner_name: entry.owner_name as string,
      })
    }
  }

  const stats = rows.map((row) => ({
    entryId: row.entry_id as string,
    totalFights: row.total_fights as number,
    wins: row.wins as number,
    losses: row.losses as number,
    draws: row.draws as number,
    points: Number(row.points),
  }))
  const ranked = rankStandings(stats)
  const tiedEntryIds = new Set(
    ranked.filter((row) => row.isTied).map((row) => row.entryId)
  )

  return rows.map((row) => {
    const entry = entryMap.get(row.entry_id as string)
    return {
      id: row.id as string,
      entry_id: row.entry_id as string,
      entry_number: entry?.entry_number ?? '—',
      entry_name: entry?.entry_name ?? '—',
      owner_name: entry?.owner_name ?? '—',
      total_fights: row.total_fights as number,
      wins: row.wins as number,
      losses: row.losses as number,
      draws: row.draws as number,
      points: Number(row.points),
      rank: row.rank as number | null,
      status: row.status as string,
      is_tied: tiedEntryIds.has(row.entry_id as string),
    }
  })
}

export async function getPublicWinners(
  eventId: string
): Promise<PublicWinnersSummary | null> {
  const event = await getPublicEventRow(eventId)
  if (!event?.publish_winners) return null

  const supabase = createAdminClient()
  const [{ data: finalization, error: finalizationError }, { data: payouts, error: payoutsError }] =
    await Promise.all([
      supabase
        .from('event_finalizations')
        .select('finalized_at, champion_entry_ids')
        .eq('event_id', eventId)
        .maybeSingle(),
      supabase
        .from('prize_payouts')
        .select('id, entry_id, rank_label, rank_position, amount')
        .eq('event_id', eventId)
        .order('rank_position', { ascending: true }),
    ])

  if (finalizationError) throw finalizationError
  if (payoutsError) throw payoutsError

  const championIds = (finalization?.champion_entry_ids ?? []) as string[]
  const payoutEntryIds = (payouts ?? []).map((row) => row.entry_id as string)
  const entryIds = [...new Set([...championIds, ...payoutEntryIds])]

  const entryMap = new Map<
    string,
    { entry_number: string; entry_name: string }
  >()

  if (entryIds.length > 0) {
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, entry_number, entry_name')
      .in('id', entryIds)

    if (entriesError) throw entriesError

    for (const entry of entries ?? []) {
      entryMap.set(entry.id as string, {
        entry_number: entry.entry_number as string,
        entry_name: entry.entry_name as string,
      })
    }
  }

  return {
    finalized_at: (finalization?.finalized_at as string | null) ?? null,
    champions: championIds.map((entryId) => {
      const entry = entryMap.get(entryId)
      return {
        entry_id: entryId,
        entry_name: entry?.entry_name ?? '—',
        entry_number: entry?.entry_number ?? '—',
      }
    }),
    payouts: (payouts ?? []).map((row) => ({
      id: row.id as string,
      rank_label: row.rank_label as string,
      rank_position: row.rank_position as number,
      entry_name: entryMap.get(row.entry_id as string)?.entry_name ?? '—',
      entry_number: entryMap.get(row.entry_id as string)?.entry_number ?? '—',
      amount: event.publish_prize_amounts ? Number(row.amount) : null,
    })),
  }
}
