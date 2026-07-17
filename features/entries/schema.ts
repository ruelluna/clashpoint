import { z } from 'zod'

import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import { entryRoosterPolicyFieldsSchema } from '@/features/entries/policy-validation'
import {
  parseRoosterBreedFromForm,
  parseRoosterColorFromForm,
} from '@/features/entries/rooster-color'
import type { EntrySource, RegistrationStatus } from '@/features/entries/types'
import { isEligibilityFieldEnabled } from '@/lib/derby/eligibility-fields'
import {
  ageClassSchema,
  breedingRelationshipSchema,
  competitionClassSchema,
  experienceStatusSchema,
  originTypeSchema,
} from '@/lib/derby/enums'

export const registrationStatusSchema = z.enum([
  'submitted',
  'pending_review',
  'approved',
  'rejected',
  'cancelled',
  'confirmed',
])

export const paymentStatusSchema = z.enum(['unpaid', 'partial', 'paid', 'refunded'])

export const entrySourceSchema = z.enum([
  'walk_in',
  'online',
  'promoter_invite',
  'staff_encoded',
])

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

const optionalEmail = z
  .string()
  .email('Valid email required')
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined)

const competitorIdField = z
  .string()
  .uuid()
  .nullable()
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined)

export const CONTACT_NUMBER_PREFIX = '+63'
export const CONTACT_NUMBER_PATTERN = /^\+63\d{10}$/

export const contactNumberSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined)
  .refine(
    (value) => value == null || CONTACT_NUMBER_PATTERN.test(value),
    'Contact number must be 10 digits after +63 (e.g. +639171234567)'
  )

export const entryMetadataSchema = z.object({
  eventId: z.string().uuid(),
  referredByPromoterId: z.string().uuid().nullable().optional(),
  competitorId: competitorIdField,
  ownerName: z.string().min(1, 'Owner Name/Game Farm is required').max(200),
  contactFullName: optionalText(200),
  contactDesignation: optionalText(200),
  contactNumber: contactNumberSchema,
  email: optionalEmail,
  entrySource: entrySourceSchema.default('staff_encoded'),
  notes: optionalText(2000),
})

export const weightGramsSchema = z.coerce
  .number()
  .int('Weight must be a whole number of grams')
  .positive('Weight must be greater than zero')

export const roosterColorMarkingSchema = z
  .string()
  .min(1, 'Color is required')
  .max(200, 'Color must be at most 200 characters')

const optionalBandNumberSchema = z
  .string()
  .max(50)
  .optional()
  .or(z.literal(''))
  .transform((value) => value?.trim() || undefined)

export function isBandNumberRequiredForEvent(
  eventType: string,
  eligibilityContext: EntryFormEligibilityContext | null | undefined
): boolean {
  if (eventType !== 'derby') return true
  if (!eligibilityContext) return false
  return (
    isEligibilityFieldEnabled(eligibilityContext.enabledFields, 'banding') &&
    eligibilityContext.bandingRequired
  )
}

export function buildRoosterEntryItemSchema(bandingRequired: boolean) {
  return z.object({
    cockIndex: z.number().int().positive().optional(),
    entryName: requiredText(200, 'Rooster name is required'),
    bandNumber: bandingRequired
      ? z.string().min(1, 'Band number is required').max(50)
      : optionalBandNumberSchema,
    weight: weightGramsSchema,
    handlerName: optionalText(200),
    breed: requiredText(100, 'Breed is required'),
    colorMarking: roosterColorMarkingSchema,
    notes: requiredText(2000, 'Notes are required'),
  })
}

export const roosterEntryItemSchema = buildRoosterEntryItemSchema(true)

export const entryRoosterRegistryFieldsSchema = {
  competitionClass: competitionClassSchema.optional(),
  hatchDate: z
    .string()
    .date()
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  hatchDateIsEstimated: z.coerce.boolean().optional(),
  bloodline: optionalText(200),
  countryOfOrigin: optionalText(100),
  provinceOfOrigin: optionalText(100),
  municipalityOfOrigin: optionalText(100),
  breederNameExternal: optionalText(200),
  originNotes: optionalText(2000),
  ...entryRoosterPolicyFieldsSchema,
}

export const entryRoosterEditItemSchema = roosterEntryItemSchema.extend(
  entryRoosterRegistryFieldsSchema
)

export const createOwnerEntrySchema = entryMetadataSchema

export type CreateOwnerEntryInput = z.infer<typeof createOwnerEntrySchema>

export function formatOwnerBarcode(eventId: string, sequence: number): string {
  const prefix = eventId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `OWN-${prefix}-${String(sequence).padStart(4, '0')}`
}

export function normalizeOwnerBarcodeInput(value: string): string {
  return value.trim().toUpperCase()
}

export function isOwnerBarcodeForEvent(value: string, eventId: string): boolean {
  return parseOwnerBarcodeSequence(normalizeOwnerBarcodeInput(value), eventId) != null
}

export function parseOwnerBarcodeSequence(value: string, eventId: string): number | null {
  const prefix = `OWN-${eventId.replace(/-/g, '').slice(0, 8).toUpperCase()}-`
  if (!value.startsWith(prefix)) return null
  const parsed = Number.parseInt(value.slice(prefix.length), 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function getNextOwnerBarcode(eventId: string, existingBarcodes: string[]): string {
  let max = 0
  for (const barcode of existingBarcodes) {
    const parsed = parseOwnerBarcodeSequence(barcode, eventId)
    if (parsed != null && parsed > max) max = parsed
  }
  return formatOwnerBarcode(eventId, max + 1)
}

export function formatCockEntryBarcode(eventId: string, sequence: number): string {
  const prefix = eventId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `COCK-${prefix}-${String(sequence).padStart(4, '0')}`
}

export function parseCockEntryBarcodeSequence(value: string, eventId: string): number | null {
  const prefix = `COCK-${eventId.replace(/-/g, '').slice(0, 8).toUpperCase()}-`
  if (!value.startsWith(prefix)) return null
  const parsed = Number.parseInt(value.slice(prefix.length), 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function getNextCockEntryBarcode(eventId: string, existingBarcodes: string[]): string {
  let max = 0
  for (const barcode of existingBarcodes) {
    const parsed = parseCockEntryBarcodeSequence(barcode, eventId)
    if (parsed != null && parsed > max) max = parsed
  }
  return formatCockEntryBarcode(eventId, max + 1)
}

export function normalizeCockEntryBarcodeInput(value: string): string {
  return value.trim().toUpperCase()
}

export function isCockEntryBarcodeForEvent(value: string, eventId: string): boolean {
  return parseCockEntryBarcodeSequence(normalizeCockEntryBarcodeInput(value), eventId) != null
}

export const createEntrySchema = entryMetadataSchema.extend({
  roosters: z.array(roosterEntryItemSchema).min(1, 'At least one rooster is required'),
})

export function buildCreateEntrySchema(bandingRequired: boolean) {
  return entryMetadataSchema.extend({
    roosters: z
      .array(buildRoosterEntryItemSchema(bandingRequired))
      .min(1, 'At least one rooster is required'),
  })
}

export type CreateEntryInput = z.infer<typeof createEntrySchema>
export type RoosterEntryItemInput = z.infer<typeof roosterEntryItemSchema>
export type EntryRoosterEditItemInput = z.infer<typeof entryRoosterEditItemSchema>
export type EntryMetadataInput = z.infer<typeof entryMetadataSchema>

export const updateEntrySchema = entryMetadataSchema.extend({
  entryId: z.string().uuid(),
})

export const updateEntryRosterItemSchema = entryRoosterEditItemSchema.extend({
  roosterId: z.string().uuid(),
})

export const newEntryRosterItemSchema = entryRoosterEditItemSchema.extend({
  cockIndex: z.number().int().positive(),
})

export const deleteEntrySchema = z.object({
  eventId: z.string().uuid(),
  entryId: z.string().uuid(),
})

export type UpdateEntryInput = z.infer<typeof updateEntrySchema>
export type UpdateEntryRosterItemInput = z.infer<typeof updateEntryRosterItemSchema>
export type NewEntryRosterItemInput = z.infer<typeof newEntryRosterItemSchema>
export type DeleteEntryInput = z.infer<typeof deleteEntrySchema>

export function validateEntryRosterCount(
  roosterCount: number,
  eventType: 'classic' | 'derby',
  cocksPerEntry: number
): string | null {
  if (roosterCount < 1) {
    return 'At least one rooster is required'
  }
  if (eventType === 'classic' && roosterCount !== 1) {
    return 'Classic events allow exactly one rooster per entry'
  }
  if (roosterCount > cocksPerEntry) {
    return `This event allows at most ${cocksPerEntry} cock(s) per entry`
  }
  return null
}

function parseOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (value == null || value.toString().trim() === '') return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function parseRoosterRegistryFieldsFromForm(
  formData: FormData,
  fieldSuffix: string
): Record<string, unknown> {
  const field = (name: string) => formData.get(`${name}_${fieldSuffix}`)
  const hatchDateRaw = field('hatchDate')?.toString().trim()
  const hatchDateIsEstimated = field('hatchDateIsEstimated') != null

  return {
    ageClass: field('ageClass')?.toString().trim() || undefined,
    competitionClass: field('competitionClass')?.toString().trim() || undefined,
    hatchDate: hatchDateRaw || undefined,
    hatchDateIsEstimated,
    bloodline: field('bloodline')?.toString().trim() || undefined,
    experienceStatus: field('experienceStatus')?.toString().trim() || undefined,
    originType: field('originType')?.toString().trim() || undefined,
    countryOfOrigin: field('countryOfOrigin')?.toString().trim() || undefined,
    provinceOfOrigin: field('provinceOfOrigin')?.toString().trim() || undefined,
    municipalityOfOrigin: field('municipalityOfOrigin')?.toString().trim() || undefined,
    breedingRelationship: field('breedingRelationship')?.toString().trim() || undefined,
    breederNameExternal: field('breederNameExternal')?.toString().trim() || undefined,
    originNotes: field('originNotes')?.toString().trim() || undefined,
    bandLevel: field('bandLevel')?.toString().trim() || undefined,
    bandOrganization: field('bandOrganization')?.toString().trim() || undefined,
    bandYear: parseOptionalNumber(field('bandYear')),
    bandSeason: field('bandSeason')?.toString().trim() || undefined,
  }
}

function handlerFieldName(mode: 'create' | 'edit', slotKey: string) {
  if (mode === 'create') {
    return `handlerName_rooster_${slotKey}`
  }
  return `handlerName_${slotKey}`
}

function parseRoosterHandlerFromForm(
  formData: FormData,
  mode: 'create' | 'edit',
  slotKey: string
): string | undefined {
  return formData.get(handlerFieldName(mode, slotKey))?.toString().trim() || undefined
}

function notesFieldName(mode: 'create' | 'edit', slotKey: string) {
  if (mode === 'create') {
    return `notes_rooster_${slotKey}`
  }
  return `notes_${slotKey}`
}

function parseRoosterNotesFromForm(
  formData: FormData,
  mode: 'create' | 'edit',
  slotKey: string
): string | undefined {
  return formData.get(notesFieldName(mode, slotKey))?.toString().trim() || undefined
}

function parseRoosterPolicyFieldsFromForm(
  formData: FormData,
  fieldPrefix: string
): Record<string, unknown> {
  return parseRoosterRegistryFieldsFromForm(formData, fieldPrefix)
}

function slotHasContent(formData: FormData, slotKey: string, mode: 'create' | 'new'): boolean {
  const prefix = mode === 'create' ? `rooster_${slotKey}_` : `new_rooster_${slotKey}_`
  const policyPrefix = mode === 'create' ? `rooster_${slotKey}` : `new_rooster_${slotKey}`
  const entryName = formData.get(`${prefix}entryName`)?.toString().trim()
  const bandNumber = formData.get(`${prefix}bandNumber`)?.toString().trim()
  const weight = formData.get(`${prefix}weight`)?.toString().trim()
  const breed = parseRoosterBreedFromForm(formData, policyPrefix, mode === 'create' ? 'create' : 'edit')
  const colorMarking = parseRoosterColorFromForm(
    formData,
    policyPrefix,
    mode === 'create' ? 'create' : 'edit'
  )
  const notes = formData
    .get(notesFieldName(mode === 'create' ? 'create' : 'edit', policyPrefix))
    ?.toString()
    .trim()
  return Boolean(entryName || bandNumber || weight || breed || colorMarking || notes)
}

function parseRoosterSlotFromForm(
  formData: FormData,
  slotKey: string,
  cockIndex: number,
  mode: 'create' | 'new'
): RoosterEntryItemInput | EntryRoosterEditItemInput | null {
  const prefix = mode === 'create' ? `rooster_${slotKey}_` : `new_rooster_${slotKey}_`
  if (!slotHasContent(formData, slotKey, mode)) return null

  const policyPrefix = mode === 'create' ? `rooster_${slotKey}` : `new_rooster_${slotKey}`

  const parsed = entryRoosterEditItemSchema.safeParse({
    cockIndex,
    entryName: formData.get(`${prefix}entryName`),
    bandNumber: formData.get(`${prefix}bandNumber`),
    weight: formData.get(`${prefix}weight`),
    handlerName: parseRoosterHandlerFromForm(
      formData,
      mode === 'create' ? 'create' : 'edit',
      policyPrefix
    ),
    breed: parseRoosterBreedFromForm(
      formData,
      policyPrefix,
      mode === 'create' ? 'create' : 'edit'
    ),
    colorMarking: parseRoosterColorFromForm(
      formData,
      policyPrefix,
      mode === 'create' ? 'create' : 'edit'
    ),
    notes: parseRoosterNotesFromForm(formData, mode === 'create' ? 'create' : 'edit', policyPrefix),
    ...parseRoosterRegistryFieldsFromForm(formData, policyPrefix),
  })

  return parsed.success ? parsed.data : null
}

export function parseUpdateEntryRosterFromForm(
  formData: FormData,
  roosterId: string
): UpdateEntryRosterItemInput | null {
  const parsed = updateEntryRosterItemSchema.safeParse({
    roosterId,
    entryName: formData.get(`entryName_${roosterId}`),
    bandNumber: formData.get(`bandNumber_${roosterId}`),
    weight: formData.get(`weight_${roosterId}`),
    handlerName: parseRoosterHandlerFromForm(formData, 'edit', roosterId),
    breed: parseRoosterBreedFromForm(formData, roosterId, 'edit'),
    colorMarking: parseRoosterColorFromForm(formData, roosterId, 'edit'),
    notes: parseRoosterNotesFromForm(formData, 'edit', roosterId),
    ...parseRoosterRegistryFieldsFromForm(formData, roosterId),
  })

  return parsed.success ? parsed.data : null
}

export type ParsedCreateEntryForm = {
  metadata: EntryMetadataInput
  roosters: RoosterEntryItemInput[]
  parseErrors: string[]
}

export function parseRosterSlotsFromCreateFormData(
  formData: FormData,
  options?: { bandingRequired?: boolean }
): {
  roosters: RoosterEntryItemInput[]
  parseErrors: string[]
} {
  const bandingRequired = options?.bandingRequired ?? true
  const roosterSchema = buildRoosterEntryItemSchema(bandingRequired)
  const parseErrors: string[] = []
  const roosterCount = Number.parseInt(
    formData.get('roosterSlotCount')?.toString() ?? '1',
    10
  )
  const slots = Number.isNaN(roosterCount) ? 1 : roosterCount

  const roosters: RoosterEntryItemInput[] = []
  for (let index = 1; index <= slots; index += 1) {
    const prefix = `rooster_${index}_`
    if (!slotHasContent(formData, String(index), 'create')) continue

    const entryName = formData.get(`${prefix}entryName`)?.toString().trim()
    const bandNumber = formData.get(`${prefix}bandNumber`)?.toString().trim()
    const weight = formData.get(`${prefix}weight`)

    const parsed = roosterSchema.safeParse({
      cockIndex: index,
      entryName,
      bandNumber,
      weight,
      handlerName: parseRoosterHandlerFromForm(formData, 'create', String(index)),
      breed: parseRoosterBreedFromForm(formData, String(index), 'create'),
      colorMarking: parseRoosterColorFromForm(formData, String(index), 'create'),
      notes: parseRoosterNotesFromForm(formData, 'create', String(index)),
    })

    if (parsed.success) {
      roosters.push(parsed.data)
    } else {
      parseErrors.push(parsed.error.issues[0]?.message ?? `Invalid rooster slot ${index}`)
    }
  }

  return { roosters, parseErrors }
}

export function parseCreateEntryFromFormData(
  formData: FormData,
  options?: { bandingRequired?: boolean }
): ParsedCreateEntryForm {
  const { roosters, parseErrors } = parseRosterSlotsFromCreateFormData(formData, options)

  const metadataResult = entryMetadataSchema.safeParse({
    eventId: formData.get('eventId'),
    referredByPromoterId: formData.get('referredByPromoterId')?.toString().trim() || undefined,
    competitorId: formData.get('competitorId')?.toString().trim() || undefined,
    ownerName: formData.get('ownerName'),
    contactFullName: formData.get('contactFullName')?.toString().trim() || undefined,
    contactDesignation: formData.get('contactDesignation')?.toString().trim() || undefined,
    contactNumber: formData.get('contactNumber')?.toString().trim() || undefined,
    email: formData.get('email')?.toString().trim() || undefined,
    entrySource: formData.get('entrySource')?.toString() ?? 'staff_encoded',
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!metadataResult.success) {
    parseErrors.unshift(
      metadataResult.error.issues[0]?.message ?? 'Invalid entry details'
    )
  }

  return {
    metadata: metadataResult.success ? metadataResult.data : ({} as EntryMetadataInput),
    roosters,
    parseErrors,
  }
}

export function parseNewRosterSlotsFromFormData(
  formData: FormData,
  cocksPerEntry: number
): { roosters: NewEntryRosterItemInput[]; parseErrors: string[] } {
  const parseErrors: string[] = []
  const roosters: NewEntryRosterItemInput[] = []

  for (let index = 1; index <= cocksPerEntry; index += 1) {
    const slot = parseRoosterSlotFromForm(formData, String(index), index, 'new')
    if (!slot) continue

    const parsed = newEntryRosterItemSchema.safeParse({
      ...slot,
      cockIndex: index,
    })

    if (parsed.success) {
      roosters.push(parsed.data)
    } else {
      parseErrors.push(parsed.error.issues[0]?.message ?? `Invalid new rooster slot ${index}`)
    }
  }

  return { roosters, parseErrors }
}

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  submitted: 'Submitted',
  pending_review: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  confirmed: 'Confirmed',
}

export const PAYMENT_STATUS_LABELS: Record<
  z.infer<typeof paymentStatusSchema>,
  string
> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
  refunded: 'Refunded',
}

export const ENTRY_SOURCE_LABELS: Record<EntrySource, string> = {
  walk_in: 'Walk-in',
  online: 'Online',
  promoter_invite: 'Promoter invite',
  staff_encoded: 'Staff encoded',
}

export function parseEntryNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const numeric = Number.parseInt(trimmed, 10)
  if (Number.isNaN(numeric) || numeric < 0) return null
  return numeric
}

export function formatEntryNumber(sequence: number, padLength = 3): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error('Entry sequence must be a positive integer')
  }
  return String(sequence).padStart(padLength, '0')
}

export function getNextEntryNumber(existingNumbers: string[]): string {
  let max = 0

  for (const value of existingNumbers) {
    const parsed = parseEntryNumber(value)
    if (parsed != null && parsed > max) {
      max = parsed
    }
  }

  return formatEntryNumber(max + 1)
}
