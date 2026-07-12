import 'server-only'

import type { EntryListItem, EntryRow, EntryWithEvent } from '@/features/entries/types'
import { createClient } from '@/lib/supabase/server'

type EntryListRow = EntryListItem & {
  promoters: { name: string } | null
}

export type EntryRoosterEditItem = {
  rooster_id: string
  cock_number: number
  band_number: string
  weight: number | null
  category: string | null
  color_marking: string | null
  is_paired: boolean
}

export async function listEntriesByEvent(eventId: string): Promise<EntryListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entries')
    .select(
      `
      id,
      entry_number,
      entry_name,
      owner_name,
      handler_name,
      contact_number,
      entry_source,
      registration_status,
      payment_status,
      created_at,
      promoters ( name )
    `
    )
    .eq('event_id', eventId)
    .is('deleted_at', null)
    .order('entry_number', { ascending: true })

  if (error) throw error

  return ((data ?? []) as unknown as EntryListRow[]).map((row) => ({
    id: row.id,
    entry_number: row.entry_number,
    entry_name: row.entry_name,
    owner_name: row.owner_name,
    handler_name: row.handler_name,
    contact_number: row.contact_number,
    entry_source: row.entry_source,
    registration_status: row.registration_status,
    payment_status: row.payment_status,
    created_at: row.created_at,
    promoter_name: row.promoters?.name ?? null,
  }))
}

export async function getEntry(entryId: string): Promise<EntryRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entryId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return data as EntryRow
}

export async function getEntryWithEvent(entryId: string): Promise<EntryWithEvent | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entries')
    .select(
      `
      *,
      events ( name, entry_fee )
    `
    )
    .eq('id', entryId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as EntryRow & {
    events: { name: string; entry_fee: number } | null
  }

  return {
    ...row,
    event_name: row.events?.name ?? '',
    entry_fee: Number(row.events?.entry_fee ?? 0),
  }
}

export async function listEntryNumbersForEvent(eventId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entries')
    .select('entry_number')
    .eq('event_id', eventId)
    .is('deleted_at', null)

  if (error) throw error
  return (data ?? []).map((row) => row.entry_number as string)
}

export async function getPairedRosterIdsForEntry(
  eventId: string,
  entryId: string
): Promise<Set<string>> {
  const supabase = await createClient()

  const { data: roosters, error: roosterError } = await supabase
    .from('rooster_records')
    .select('id')
    .eq('entry_id', entryId)
    .eq('event_id', eventId)

  if (roosterError) throw roosterError

  const roosterIds = (roosters ?? []).map((row) => row.id as string)
  const paired = new Set<string>()

  if (roosterIds.length === 0) return paired

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('meron_entry_id, wala_entry_id, meron_rooster_id, wala_rooster_id')
    .eq('event_id', eventId)
    .or(
      `meron_entry_id.eq.${entryId},wala_entry_id.eq.${entryId},meron_rooster_id.in.(${roosterIds.join(',')}),wala_rooster_id.in.(${roosterIds.join(',')})`
    )

  if (matchError) throw matchError

  for (const match of matches ?? []) {
    if (match.meron_entry_id === entryId && match.meron_rooster_id) {
      paired.add(match.meron_rooster_id as string)
    }
    if (match.wala_entry_id === entryId && match.wala_rooster_id) {
      paired.add(match.wala_rooster_id as string)
    }
    if (roosterIds.includes(match.meron_rooster_id as string)) {
      paired.add(match.meron_rooster_id as string)
    }
    if (roosterIds.includes(match.wala_rooster_id as string)) {
      paired.add(match.wala_rooster_id as string)
    }
  }

  return paired
}

export async function entryHasMatchReferences(
  eventId: string,
  entryId: string
): Promise<boolean> {
  const paired = await getPairedRosterIdsForEntry(eventId, entryId)
  if (paired.size > 0) return true

  const supabase = await createClient()
  const { count, error } = await supabase
    .from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .or(`meron_entry_id.eq.${entryId},wala_entry_id.eq.${entryId}`)

  if (error) throw error
  return (count ?? 0) > 0
}

export async function listEntryRoostersForEdit(
  eventId: string,
  entryId: string
): Promise<EntryRoosterEditItem[]> {
  const supabase = await createClient()
  const pairedIds = await getPairedRosterIdsForEntry(eventId, entryId)

  const { data, error } = await supabase
    .from('rooster_records')
    .select(
      `
      id,
      cock_number,
      band_number,
      category,
      color_marking,
      weighings ( official_weight )
    `
    )
    .eq('entry_id', entryId)
    .eq('event_id', eventId)
    .order('cock_number', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const weighingRaw = row.weighings
    const weighing = Array.isArray(weighingRaw)
      ? weighingRaw[0] ?? null
      : weighingRaw

    const roosterId = row.id as string

    return {
      rooster_id: roosterId,
      cock_number: Number(row.cock_number),
      band_number: row.band_number as string,
      weight:
        weighing?.official_weight != null ? Number(weighing.official_weight) : null,
      category: (row.category as string | null) ?? null,
      color_marking: (row.color_marking as string | null) ?? null,
      is_paired: pairedIds.has(roosterId),
    }
  })
}
