import { z } from 'zod'

import {
  buildCreateEntrySchema,
  entryMetadataSchema,
  isBandNumberRequiredForEvent,
  parseCreateEntryFromFormData,
  roosterEntryItemSchema,
} from '@/features/entries/schema'

export function buildCreatePublicEntrySchema(bandingRequired: boolean) {
  return buildCreateEntrySchema(bandingRequired)
    .omit({
      referredByPromoterId: true,
      competitorId: true,
      entrySource: true,
    })
    .extend({
      entrySource: z.literal('online'),
    })
}

export const createPublicEntrySchema = buildCreatePublicEntrySchema(true)

export type CreatePublicEntryInput = z.infer<typeof createPublicEntrySchema>

export function parsePublicEntryFromFormData(
  formData: FormData,
  options?: { bandingRequired?: boolean }
) {
  const parsed = parseCreateEntryFromFormData(formData, options)
  const metadataResult = entryMetadataSchema
    .omit({
      referredByPromoterId: true,
      competitorId: true,
      entrySource: true,
    })
    .extend({
      entrySource: z.literal('online'),
    })
    .safeParse({
      eventId: formData.get('eventId'),
      ownerName: formData.get('ownerName'),
      contactFullName: formData.get('contactFullName')?.toString().trim() || undefined,
      contactDesignation: formData.get('contactDesignation')?.toString().trim() || undefined,
      contactNumber: formData.get('contactNumber')?.toString().trim() || undefined,
      email: formData.get('email')?.toString().trim() || undefined,
      entrySource: 'online',
      notes: formData.get('notes')?.toString().trim() || undefined,
    })

  const parseErrors = [...parsed.parseErrors]
  if (!metadataResult.success) {
    parseErrors.unshift(
      metadataResult.error.issues[0]?.message ?? 'Invalid entry details'
    )
  }

  return {
    metadata: metadataResult.success ? metadataResult.data : null,
    roosters: parsed.roosters,
    parseErrors,
  }
}

export { roosterEntryItemSchema }
