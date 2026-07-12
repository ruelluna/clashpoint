import 'server-only'

import type { CompetitorRow, CompetitorSearchResult } from '@/features/competitors/types'
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
