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
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

const competitorProfileFields = {
  displayName: z.string().min(1, 'Display name is required').max(200),
  contactFullName: optionalText(200),
  contactDesignation: optionalText(200),
  contactNumber: contactNumberSchema,
  email: optionalEmail,
  address: optionalText(500),
  notes: optionalText(2000),
}

export const createCompetitorSchema = z.object(competitorProfileFields)

export const updateCompetitorSchema = z.object({
  id: z.string().uuid(),
  ...competitorProfileFields,
})

export const deleteCompetitorSchema = z.object({
  id: z.string().uuid(),
})

export const listCompetitorsSchema = z.object({
  search: z.string().max(200).default(''),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type SearchCompetitorsInput = z.infer<typeof searchCompetitorsSchema>
export type CreateCompetitorInput = z.infer<typeof createCompetitorSchema>
export type UpdateCompetitorInput = z.infer<typeof updateCompetitorSchema>
export type DeleteCompetitorInput = z.infer<typeof deleteCompetitorSchema>
export type ListCompetitorsInput = z.infer<typeof listCompetitorsSchema>
