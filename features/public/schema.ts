import { z } from 'zod'

import {
  createEntrySchema,
  entryMetadataSchema,
  parseCreateEntryFromFormData,
  roosterEntryItemSchema,
} from '@/features/entries/schema'

export const createPublicEntrySchema = createEntrySchema
  .omit({
    referredByPromoterId: true,
    competitorId: true,
    entrySource: true,
  })
  .extend({
    entrySource: z.literal('online'),
  })

export type CreatePublicEntryInput = z.infer<typeof createPublicEntrySchema>

export function parsePublicEntryFromFormData(formData: FormData) {
  const parsed = parseCreateEntryFromFormData(formData)
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
      handlerName: formData.get('handlerName')?.toString().trim() || undefined,
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
