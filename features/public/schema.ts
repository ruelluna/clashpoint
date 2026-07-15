import { z } from 'zod'

import {
  contactNumberSchema,
  parseCreateEntryFromFormData,
  roosterEntryItemSchema,
} from '@/features/entries/schema'

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)

export const createPublicOwnerSchema = z.object({
  eventId: z.string().uuid(),
  ownerName: z.string().min(1, 'Game farm name is required').max(200),
  contactFullName: optionalText(200),
  contactDesignation: optionalText(200),
  contactNumber: contactNumberSchema,
  email: z.string().email('Valid email is required'),
  notes: optionalText(2000),
})

export type CreatePublicOwnerInput = z.infer<typeof createPublicOwnerSchema>

export const sendOwnerVerificationSchema = z.object({
  eventId: z.string().uuid(),
  competitorId: z.string().uuid(),
})

export type SendOwnerVerificationInput = z.infer<typeof sendOwnerVerificationSchema>

export const verifyOwnerVerificationSchema = z.object({
  eventId: z.string().uuid(),
  competitorId: z.string().uuid(),
  code: z
    .string()
    .trim()
    .length(6, 'Enter the 6-digit verification code'),
})

export type VerifyOwnerVerificationInput = z.infer<typeof verifyOwnerVerificationSchema>

export const createPublicRoostersSchema = z.object({
  eventId: z.string().uuid(),
  roosters: z.array(roosterEntryItemSchema).min(1, 'Add at least one rooster'),
})

export type CreatePublicRoostersInput = z.infer<typeof createPublicRoostersSchema>

export const searchPublicGameFarmsSchema = z.object({
  query: z.string().max(200).default(''),
  limit: z.coerce.number().int().min(1).max(25).default(10),
})

export function parsePublicOwnerFromFormData(formData: FormData) {
  return createPublicOwnerSchema.safeParse({
    eventId: formData.get('eventId'),
    ownerName: formData.get('ownerName'),
    contactFullName: formData.get('contactFullName')?.toString().trim() || undefined,
    contactDesignation: formData.get('contactDesignation')?.toString().trim() || undefined,
    contactNumber: formData.get('contactNumber')?.toString().trim() || undefined,
    email: formData.get('email')?.toString().trim() || undefined,
    notes: formData.get('notes')?.toString().trim() || undefined,
  })
}

export function parsePublicRoostersFromFormData(formData: FormData) {
  const parsed = parseCreateEntryFromFormData(formData)
  const eventId = formData.get('eventId')?.toString()

  const schemaResult = createPublicRoostersSchema.safeParse({
    eventId,
    roosters: parsed.roosters,
  })

  return {
    ...parsed,
    schemaResult,
  }
}

export { roosterEntryItemSchema }
