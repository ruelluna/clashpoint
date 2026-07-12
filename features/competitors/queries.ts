import 'server-only'

import type {
  CompetitorDetail,
  CompetitorListItem,
  CompetitorRow,
  CompetitorSearchResult,
} from '@/features/competitors/types'
import type { ListCompetitorsInput } from '@/features/competitors/schema'
import { createExtendedClient } from '@/lib/supabase/extended'

function toSearchResult(row: Pick<
  CompetitorRow,
  'id' | 'display_name' | 'contact_number' | 'email' | 'address'
>): CompetitorSearchResult {
  return {
    id: row.id,
    displayName: row.display_name,
    contactNumber: row.contact_number,
    email: row.email,
    address: row.address,
  }
}

function toListItem(
  row: Pick<
    CompetitorRow,
    | 'id'
    | 'display_name'
    | 'contact_number'
    | 'email'
    | 'address'
    | 'notes'
    | 'created_at'
  >
): CompetitorListItem {
  return {
    id: row.id,
    displayName: row.display_name,
    contactNumber: row.contact_number,
    email: row.email,
    address: row.address,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

function toDetail(row: CompetitorRow): CompetitorDetail {
  return toListItem(row)
}

export async function searchCompetitors(
  query: string,
  limit = 10
): Promise<CompetitorSearchResult[]> {
  const supabase = await createExtendedClient()
  const trimmed = query.trim()

  let builder = supabase
    .from('competitors')
    .select('id, display_name, contact_number, email, address')
    .is('deleted_at', null)
    .order('display_name', { ascending: true })
    .limit(limit)

  if (trimmed) {
    builder = builder.ilike('display_name', `%${trimmed}%`)
  }

  const { data, error } = await builder

  if (error) throw error

  return ((data ?? []) as Pick<
    CompetitorRow,
    'id' | 'display_name' | 'contact_number' | 'email' | 'address'
  >[]).map(toSearchResult)
}

export async function listCompetitors(
  input: ListCompetitorsInput
): Promise<CompetitorListItem[]> {
  const supabase = await createExtendedClient()
  const trimmed = input.search.trim()

  let builder = supabase
    .from('competitors')
    .select('id, display_name, contact_number, email, address, notes, created_at')
    .is('deleted_at', null)
    .order('display_name', { ascending: true })
    .range(input.offset, input.offset + input.limit - 1)

  if (trimmed) {
    builder = builder.ilike('display_name', `%${trimmed}%`)
  }

  const { data, error } = await builder

  if (error) throw error

  return ((data ?? []) as Pick<
    CompetitorRow,
    | 'id'
    | 'display_name'
    | 'contact_number'
    | 'email'
    | 'address'
    | 'notes'
    | 'created_at'
  >[]).map(toListItem)
}

export async function getCompetitorDetail(id: string): Promise<CompetitorDetail | null> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('competitors')
    .select(
      'id, display_name, contact_number, email, address, notes, competitor_level, created_at, updated_at, deleted_at'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return toDetail(data as CompetitorRow)
}

export async function countEntriesForCompetitor(competitorId: string): Promise<number> {
  const supabase = await createExtendedClient()
  const { count, error } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('competitor_id', competitorId)
    .is('deleted_at', null)

  if (error) throw error
  return count ?? 0
}

export async function getCompetitor(id: string): Promise<CompetitorSearchResult | null> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('competitors')
    .select('id, display_name, contact_number, email, address')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return toSearchResult(
    data as Pick<
      CompetitorRow,
      'id' | 'display_name' | 'contact_number' | 'email' | 'address'
    >
  )
}

export async function findCompetitorByDisplayName(
  displayName: string
): Promise<CompetitorSearchResult | null> {
  const supabase = await createExtendedClient()
  const trimmed = displayName.trim()
  if (!trimmed) return null

  const { data, error } = await supabase
    .from('competitors')
    .select('id, display_name, contact_number, email, address')
    .is('deleted_at', null)
    .ilike('display_name', trimmed)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return toSearchResult(
    data as Pick<
      CompetitorRow,
      'id' | 'display_name' | 'contact_number' | 'email' | 'address'
    >
  )
}
