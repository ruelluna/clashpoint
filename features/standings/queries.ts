import 'server-only'

import { rankStandings } from '@/features/standings/utils'
import type { EntryFightStats, StandingListItem } from '@/features/standings/types'
import { createClient } from '@/lib/supabase/server'

type StandingRow = {
  id: string
  event_id: string
  entry_id: string
  total_fights: number
  wins: number
  losses: number
  draws: number
  points: number
  rank: number | null
  status: string
  updated_at: string
}

type EntryRow = {
  id: string
  entry_number: string
  entry_name: string
  owner_name: string
}

export async function listStandingsForEvent(
  eventId: string
): Promise<StandingListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('standings')
    .select(
      `
      id,
      event_id,
      entry_id,
      total_fights,
      wins,
      losses,
      draws,
      points,
      rank,
      status,
      updated_at
    `
    )
    .eq('event_id', eventId)
    .order('rank', { ascending: true, nullsFirst: false })
    .order('points', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as StandingRow[]
  const entryIds = rows.map((row) => row.entry_id)
  const entryMap = new Map<string, EntryRow>()

  if (entryIds.length > 0) {
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, entry_number, entry_name, owner_name')
      .in('id', entryIds)

    if (entriesError) throw entriesError

    for (const entry of (entries ?? []) as EntryRow[]) {
      entryMap.set(entry.id, entry)
    }
  }

  const stats: EntryFightStats[] = rows.map((row) => ({
    entryId: row.entry_id,
    totalFights: row.total_fights,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    points: Number(row.points),
  }))
  const ranked = rankStandings(stats)
  const tiedEntryIds = new Set(
    ranked.filter((row) => row.isTied).map((row) => row.entryId)
  )

  return rows.map((row) => {
    const entry = entryMap.get(row.entry_id)
    return {
      id: row.id,
      event_id: row.event_id,
      entry_id: row.entry_id,
      total_fights: row.total_fights,
      wins: row.wins,
      losses: row.losses,
      draws: row.draws,
      points: Number(row.points),
      rank: row.rank,
      status: row.status as StandingListItem['status'],
      updated_at: row.updated_at,
      entry_number: entry?.entry_number ?? '—',
      entry_name: entry?.entry_name ?? '—',
      owner_name: entry?.owner_name ?? '—',
      is_tied: tiedEntryIds.has(row.entry_id),
    }
  })
}
