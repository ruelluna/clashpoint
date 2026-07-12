'use server'

import { searchReferenceValuesSchema } from '@/features/reference-values/schema'
import { searchReferenceValues } from '@/features/reference-values/queries'
import type { ReferenceValueSearchResult } from '@/features/reference-values/types'
import { requirePermission } from '@/lib/auth/permissions'

export async function searchReferenceValuesAction(input: {
  kind: 'breed' | 'bloodline' | 'color_marking'
  query: string
}): Promise<{ error?: string; results?: ReferenceValueSearchResult[] }> {
  await requirePermission('entries.manage')

  const parsed = searchReferenceValuesSchema.safeParse({
    kind: input.kind,
    query: input.query,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid search query' }
  }

  const results = await searchReferenceValues(
    parsed.data.kind,
    parsed.data.query,
    parsed.data.limit
  )

  return { results }
}
