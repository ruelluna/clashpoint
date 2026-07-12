import 'server-only'

import { listEntriesByEvent } from '@/features/entries/queries'
import type {
  LineupEntrySummary,
  LineupWithEntry,
  RoosterRecordRow,
} from '@/features/lineups/types'
import type { LineupStatus } from '@/features/lineups/types'
import { createClient } from '@/lib/supabase/server'

export async function listLineupSummariesByEvent(
  eventId: string
): Promise<LineupEntrySummary[]> {
  const entries = await listEntriesByEvent(eventId)
  const supabase = await createClient()

  const { data: roosters, error } = await supabase
    .from('rooster_event_registrations')
    .select('entry_id, status')
    .eq('event_id', eventId)

  if (error) throw error

  const countByEntry = new Map<string, { count: number; status: LineupStatus | null }>()

  for (const row of roosters ?? []) {
    const entryId = row.entry_id as string
    const current = countByEntry.get(entryId) ?? { count: 0, status: null }
    current.count += 1
    current.status = row.status as LineupStatus
    countByEntry.set(entryId, current)
  }

  return entries.map((entry) => {
    const lineup = countByEntry.get(entry.id)
    return {
      entry_id: entry.id,
      entry_number: entry.entry_number,
      entry_name: entry.entry_name,
      owner_name: entry.owner_name,
      can_submit: false,
      rooster_count: lineup?.count ?? 0,
      status: lineup?.status ?? null,
    }
  })
}

export async function listRoostersByEntry(
  entryId: string
): Promise<RoosterRecordRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select('*')
    .eq('entry_id', entryId)
    .order('cock_number', { ascending: true })

  if (error) throw error
  return (data ?? []) as RoosterRecordRow[]
}

export async function listLineupsByEvent(
  eventId: string
): Promise<LineupWithEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
    .select(
      `
      *,
      entries ( entry_number, entry_name, owner_name )
    `
    )
    .eq('event_id', eventId)
    .order('entry_id')
    .order('cock_number', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const entry = row.entries as {
      entry_number: string
      entry_name: string
      owner_name: string
    } | null

    // Destructure to strip the joined `entries` relation from the record.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { entries: _entries, ...record } = row as RoosterRecordRow & {
      entries: unknown
    }

    return {
      ...(record as RoosterRecordRow),
      entry_number: entry?.entry_number ?? '',
      entry_name: entry?.entry_name ?? '',
      owner_name: entry?.owner_name ?? '',
    }
  })
}

export async function getExistingBandNumbers(
  eventId: string,
  excludeEntryId?: string
): Promise<string[]> {
  const supabase = await createClient()
  let query = supabase
    .from('rooster_event_registrations')
    .select('band_number, entry_id')
    .eq('event_id', eventId)

  if (excludeEntryId) {
    query = query.neq('entry_id', excludeEntryId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => row.band_number as string)
}
