import 'server-only'

import type { MatchForResult, ResultListItem } from '@/features/results/types'
import { createClient } from '@/lib/supabase/server'

type ResultRow = {
  id: string
  match_id: string
  event_id: string
  winning_side: string | null
  result_type: string
  winning_entry_id: string | null
  losing_entry_id: string | null
  result_status: string
  recorded_by: string | null
  verified_by: string | null
  result_time: string | null
  notes: string | null
  under_protest: boolean
  created_at: string
  updated_at: string
  matches: {
    fight_number: number
    meron_entry_id: string
    wala_entry_id: string
  } | null
}

type EntryNameRow = {
  id: string
  entry_name: string
}

export async function listResultsForEvent(
  eventId: string
): Promise<ResultListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fight_results')
    .select(
      `
      id,
      match_id,
      event_id,
      winning_side,
      result_type,
      winning_entry_id,
      losing_entry_id,
      result_status,
      recorded_by,
      verified_by,
      result_time,
      notes,
      under_protest,
      created_at,
      updated_at,
      matches (
        fight_number,
        meron_entry_id,
        wala_entry_id
      )
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as unknown as ResultRow[]
  const entryIds = [
    ...new Set(
      rows.flatMap((row) => [
        row.matches?.meron_entry_id,
        row.matches?.wala_entry_id,
      ])
    ),
  ].filter(Boolean) as string[]

  const entryNameMap = new Map<string, string>()
  if (entryIds.length > 0) {
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, entry_name')
      .in('id', entryIds)

    if (entriesError) throw entriesError

    for (const entry of (entries ?? []) as EntryNameRow[]) {
      entryNameMap.set(entry.id, entry.entry_name)
    }
  }

  return rows.map((row) => ({
    id: row.id,
    match_id: row.match_id,
    event_id: row.event_id,
    winning_side: row.winning_side as ResultListItem['winning_side'],
    result_type: row.result_type as ResultListItem['result_type'],
    winning_entry_id: row.winning_entry_id,
    losing_entry_id: row.losing_entry_id,
    result_status: row.result_status as ResultListItem['result_status'],
    recorded_by: row.recorded_by,
    verified_by: row.verified_by,
    result_time: row.result_time,
    notes: row.notes,
    under_protest: row.under_protest,
    created_at: row.created_at,
    updated_at: row.updated_at,
    fight_number: row.matches?.fight_number ?? 0,
    meron_entry_id: row.matches?.meron_entry_id ?? '',
    wala_entry_id: row.matches?.wala_entry_id ?? '',
    meron_entry_name:
      entryNameMap.get(row.matches?.meron_entry_id ?? '') ?? '—',
    wala_entry_name: entryNameMap.get(row.matches?.wala_entry_id ?? '') ?? '—',
  }))
}

export async function listMatchesPendingResults(
  eventId: string
): Promise<MatchForResult[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('id, event_id, fight_number, meron_entry_id, wala_entry_id, status')
    .eq('event_id', eventId)
    .in('status', ['at_pit', 'fighting', 'completed'])
    .order('fight_number', { ascending: true })

  if (error) throw error

  const matches = (data ?? []) as MatchForResult[]
  if (matches.length === 0) return []

  const { data: existingResults, error: resultsError } = await supabase
    .from('fight_results')
    .select('match_id, result_status')
    .eq('event_id', eventId)

  if (resultsError) throw resultsError

  const verifiedMatchIds = new Set(
    ((existingResults ?? []) as Array<{ match_id: string; result_status: string }>)
      .filter(
        (row) =>
          row.result_status === 'verified' || row.result_status === 'final'
      )
      .map((row) => row.match_id)
  )

  return matches.filter((match) => !verifiedMatchIds.has(match.id))
}
