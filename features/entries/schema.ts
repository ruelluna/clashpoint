import { z } from 'zod'

import type { EntrySource, RegistrationStatus } from '@/features/entries/types'

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

const optionalEmail = z
  .string()
  .email('Valid email required')
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined)

const entryFieldsSchema = {
  eventId: z.string().uuid(),
  referredByPromoterId: z.string().uuid().nullable().optional(),
  entryName: z.string().min(1, 'Entry name is required').max(200),
  ownerName: z.string().min(1, 'Owner name is required').max(200),
  handlerName: optionalText(200),
  contactNumber: optionalText(50),
  email: optionalEmail,
  address: optionalText(500),
  entrySource: entrySourceSchema.default('staff_encoded'),
  notes: optionalText(2000),
}

export const createEntrySchema = z.object(entryFieldsSchema)

export const approveEntrySchema = z.object({
  entryId: z.string().uuid(),
  eventId: z.string().uuid(),
  reason: z.string().min(3).max(500).optional(),
})

export const rejectEntrySchema = z.object({
  entryId: z.string().uuid(),
  eventId: z.string().uuid(),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
})

export type CreateEntryInput = z.infer<typeof createEntrySchema>
export type ApproveEntryInput = z.infer<typeof approveEntrySchema>
export type RejectEntryInput = z.infer<typeof rejectEntrySchema>

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

export function canSubmitLineup(entry: {
  registration_status: RegistrationStatus
  payment_status: z.infer<typeof paymentStatusSchema>
}): boolean {
  return entry.registration_status === 'confirmed' && entry.payment_status === 'paid'
}
