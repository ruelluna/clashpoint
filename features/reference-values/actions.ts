'use server'

import {
  findOrCreateReferenceValueSchema,
  searchReferenceValuesSchema,
} from '@/features/reference-values/schema'
import { searchReferenceValues } from '@/features/reference-values/queries'
import { createReferenceValue } from '@/features/reference-values/service'
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

  try {
    const results = await searchReferenceValues(
      parsed.data.kind,
      parsed.data.query,
      parsed.data.limit
    )

    return { results }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof error.message === 'string'
          ? error.message
          : 'Failed to search reference values'

    return { error: message }
  }
}

export async function createReferenceValueAction(input: {
  kind: 'breed' | 'bloodline' | 'color_marking'
  name: string
}): Promise<{ error?: string; value?: ReferenceValueSearchResult }> {
  await requirePermission('entries.manage')

  const parsed = findOrCreateReferenceValueSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  try {
    const value = await createReferenceValue(parsed.data.kind, parsed.data.name)
    return { value }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof error.message === 'string'
          ? error.message
          : 'Failed to save reference value'

    return { error: message }
  }
}
