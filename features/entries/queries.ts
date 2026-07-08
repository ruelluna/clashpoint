import 'server-only'

import type { EntryListItem, EntryRow, EntryWithEvent } from '@/features/entries/types'
import { createClient } from '@/lib/supabase/server'

type EntryListRow = EntryListItem & {
  promoters: { name: string } | null
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
