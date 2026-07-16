import { z } from 'zod'

import {
  contactNumberSchema,
  weightGramsSchema,
} from '@/features/entries/schema'
import {
  notesFieldName,
  parseRoosterBreedFromForm,
  parseRoosterColorFromForm,
} from '@/features/entries/rooster-color'

function parsePublicHandlerFromForm(formData: FormData, slotKey: string): string | undefined {
  return formData.get(`handlerName_rooster_${slotKey}`)?.toString().trim() || undefined
}

function parsePublicNotesFromForm(formData: FormData, slotKey: string): string | undefined {
  return formData.get(notesFieldName('create', slotKey))?.toString().trim() || undefined
}

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)

const requiredText = (max: number, message: string) =>
  z
    .string()
    .min(1, message)
    .max(max, `Must be at most ${max} characters`)

const optionalBandNumberSchema = z
  .string()
  .max(50)
  .optional()
  .or(z.literal(''))
  .transform((value) => value?.trim() || undefined)

const optionalColorMarkingSchema = z
  .string()
  .max(200)
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined)

export function buildPublicRoosterEntryItemSchema(bandingRequired: boolean) {
  return z.object({
    cockIndex: z.number().int().positive().optional(),
    entryName: requiredText(200, 'Rooster name is required'),
    bandNumber: bandingRequired
      ? z.string().min(1, 'Band number is required').max(50)
      : optionalBandNumberSchema,
    weight: weightGramsSchema,
    handlerName: requiredText(200, 'Handler name is required'),
    breed: optionalText(100),
    colorMarking: optionalColorMarkingSchema,
    notes: optionalText(2000),
  })
}

export type PublicRoosterEntryItemInput = z.infer<
  ReturnType<typeof buildPublicRoosterEntryItemSchema>
>

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

export function buildCreatePublicRoostersSchema(
  bandingRequired: boolean,
  eventType: 'classic' | 'derby',
  cocksPerEntry: number
) {
  const roosterSchema = buildPublicRoosterEntryItemSchema(bandingRequired)
  const roostersField =
    eventType === 'classic'
      ? z
          .array(roosterSchema)
          .length(1, 'Classic events require exactly one rooster')
      : z
          .array(roosterSchema)
          .length(
            cocksPerEntry,
            `Submit all ${cocksPerEntry} rooster(s) for this derby entry`
          )

  return z.object({
    eventId: z.string().uuid(),
    roosters: roostersField,
  })
}

export type CreatePublicRoostersInput = z.infer<
  ReturnType<typeof buildCreatePublicRoostersSchema>
>

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

function publicSlotHasContent(formData: FormData, slotKey: string): boolean {
  const prefix = `rooster_${slotKey}_`
  const entryName = formData.get(`${prefix}entryName`)?.toString().trim()
  const bandNumber = formData.get(`${prefix}bandNumber`)?.toString().trim()
  const weight = formData.get(`${prefix}weight`)?.toString().trim()
  const breed = parseRoosterBreedFromForm(formData, slotKey, 'create')
  const colorMarking = parseRoosterColorFromForm(formData, slotKey, 'create')
  const notes = formData.get(notesFieldName('create', slotKey))?.toString().trim()
  const handlerName = parsePublicHandlerFromForm(formData, slotKey)
  return Boolean(
    entryName || bandNumber || weight || breed || colorMarking || notes || handlerName
  )
}

export function parsePublicRoostersFromFormData(
  formData: FormData,
  options: {
    bandingRequired: boolean
    eventType: 'classic' | 'derby'
    cocksPerEntry: number
  }
) {
  const roosterSchema = buildPublicRoosterEntryItemSchema(options.bandingRequired)
  const parseErrors: string[] = []
  const roosterCount = Number.parseInt(
    formData.get('roosterSlotCount')?.toString() ?? '1',
    10
  )
  const slots = Number.isNaN(roosterCount) ? 1 : roosterCount
  const expectedCount = options.eventType === 'classic' ? 1 : options.cocksPerEntry

  const roosters: PublicRoosterEntryItemInput[] = []
  for (let index = 1; index <= slots; index += 1) {
    const prefix = `rooster_${index}_`
    if (!publicSlotHasContent(formData, String(index))) {
      if (index <= expectedCount) {
        parseErrors.push(
          options.eventType === 'classic'
            ? 'Rooster details are required'
            : `Cock #${index} is required`
        )
      }
      continue
    }

    const parsed = roosterSchema.safeParse({
      cockIndex: index,
      entryName: formData.get(`${prefix}entryName`)?.toString().trim(),
      bandNumber: formData.get(`${prefix}bandNumber`)?.toString().trim(),
      weight: formData.get(`${prefix}weight`),
      handlerName: parsePublicHandlerFromForm(formData, String(index)),
      breed: parseRoosterBreedFromForm(formData, String(index), 'create'),
      colorMarking: parseRoosterColorFromForm(formData, String(index), 'create'),
      notes: parsePublicNotesFromForm(formData, String(index)),
    })

    if (parsed.success) {
      roosters.push(parsed.data)
    } else {
      parseErrors.push(parsed.error.issues[0]?.message ?? `Invalid rooster slot ${index}`)
    }
  }

  const eventId = formData.get('eventId')?.toString()
  const schemaResult = buildCreatePublicRoostersSchema(
    options.bandingRequired,
    options.eventType,
    options.cocksPerEntry
  ).safeParse({
    eventId,
    roosters,
  })

  return {
    roosters,
    parseErrors,
    schemaResult,
  }
}
