'use server'

import { searchCompetitorsSchema } from '@/features/competitors/schema'
import { searchCompetitors } from '@/features/competitors/queries'
import type { CompetitorSearchResult } from '@/features/competitors/types'
import { requirePermission } from '@/lib/auth/permissions'

export async function searchCompetitorsAction(
  query: string
): Promise<{ error?: string; results?: CompetitorSearchResult[] }> {
  await requirePermission('entries.manage')

  const parsed = searchCompetitorsSchema.safeParse({ query })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid search query' }
  }

  const results = await searchCompetitors(parsed.data.query, parsed.data.limit)
  return { results }
}
