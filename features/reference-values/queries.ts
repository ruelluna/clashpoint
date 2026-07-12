import 'server-only'

import type { ReferenceValueKind, ReferenceValueSearchResult } from '@/features/reference-values/types'
import { createClient } from '@/lib/supabase/server'

export async function searchReferenceValues(
  kind: ReferenceValueKind,
  query: string,
  limit = 20
): Promise<ReferenceValueSearchResult[]> {
  const supabase = await createClient()
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
