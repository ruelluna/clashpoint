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
