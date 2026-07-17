import 'server-only'

import type { ReferenceValueKind, ReferenceValueSearchResult } from '@/features/reference-values/types'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'

type ReferenceSupabase = SupabaseClient<Database>

async function resolveClient(client?: ReferenceSupabase) {
  return client ?? (await createClient())
}

export async function listReferenceValuesByKind(
  kind: ReferenceValueKind,
  client?: ReferenceSupabase
): Promise<ReferenceValueSearchResult[]> {
  const supabase = await resolveClient(client)

  const { data, error } = await supabase
    .from('reference_values')
    .select('id, name')
    .eq('kind', kind)
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
  }))
}

export async function searchReferenceValues(
  kind: ReferenceValueKind,
  query: string,
  limit = 20,
  client?: ReferenceSupabase
): Promise<ReferenceValueSearchResult[]> {
  const supabase = await resolveClient(client)
  const trimmed = query.trim()

  let builder = supabase
    .from('reference_values')
    .select('id, name')
    .eq('kind', kind)
    .order('name', { ascending: true })
    .limit(limit)

  if (trimmed) {
    builder = builder.ilike('name', `%${trimmed}%`)
  }

  const { data, error } = await builder

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
  }))
}
