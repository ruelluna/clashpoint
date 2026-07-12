import { z } from 'zod'

import { contactNumberSchema } from '@/features/entries/schema'

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)

const optionalEmail = z
  .string()
  .email('Valid email required')
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined)

export const searchCompetitorsSchema = z.object({
  query: z.string().max(200).default(''),
  limit: z.coerce.number().int().min(1).max(25).default(10),
})

export const createCompetitorSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(200),
  contactNumber: contactNumberSchema,
  email: optionalEmail,
  address: optionalText(500),
})

export type SearchCompetitorsInput = z.infer<typeof searchCompetitorsSchema>
export type CreateCompetitorInput = z.infer<typeof createCompetitorSchema>
