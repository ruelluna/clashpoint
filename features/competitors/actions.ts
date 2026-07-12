'use server'

import { createCompetitorSchema, searchCompetitorsSchema } from '@/features/competitors/schema'
import { createCompetitor } from '@/features/competitors/service'
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

export async function createCompetitorAction(input: {
  displayName: string
  contactNumber?: string
  email?: string
}): Promise<{ error?: string; competitor?: CompetitorSearchResult }> {
  const profile = await requirePermission('entries.manage')

  const parsed = createCompetitorSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await createCompetitor(profile.id, parsed.data)
  if (result.error || !result.competitorId) {
    return { error: result.error ?? 'Failed to create owner' }
  }

  return {
    competitor: {
      id: result.competitorId,
      displayName: parsed.data.displayName,
      contactNumber: parsed.data.contactNumber ?? null,
      email: parsed.data.email ?? null,
      address: null,
    },
  }
}
