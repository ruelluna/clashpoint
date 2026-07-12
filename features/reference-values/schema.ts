import { z } from 'zod'

export const referenceValueKindSchema = z.enum(['breed', 'bloodline', 'color_marking'])

export const searchReferenceValuesSchema = z.object({
  kind: referenceValueKindSchema,
  query: z.string().max(200).default(''),
  limit: z.number().int().min(1).max(50).default(20),
})

export const findOrCreateReferenceValueSchema = z.object({
  kind: referenceValueKindSchema,
  name: z.string().trim().min(1).max(200),
})

export type SearchReferenceValuesInput = z.infer<typeof searchReferenceValuesSchema>
export type FindOrCreateReferenceValueInput = z.infer<typeof findOrCreateReferenceValueSchema>

export function normalizeReferenceValueName(name: string): string {
  return name.trim().toLowerCase()
}

export function hasExactReferenceMatch(
  results: Array<{ name: string }>,
  query: string
): boolean {
  const normalized = normalizeReferenceValueName(query)
  if (!normalized) return false
  return results.some((result) => normalizeReferenceValueName(result.name) === normalized)
}

export function filterExactReferenceMatches<T extends { name: string }>(
  results: T[],
  query: string
): T[] {
  const normalized = normalizeReferenceValueName(query)
  if (!normalized) return []
  return results.filter((result) => normalizeReferenceValueName(result.name) === normalized)
}

export const ADD_NEW_REFERENCE_VALUE_ID = '__add_new__'
