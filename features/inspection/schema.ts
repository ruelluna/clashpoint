import { z } from 'zod'

import { inspectionStatusSchema } from '@/lib/derby/enums'

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)

export const recordInspectionSchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid(),
  inspectionStatus: inspectionStatusSchema.default('pending'),
  notes: optionalText(2000),
})

export const approveInspectionSchema = z.object({
  eventId: z.string().uuid(),
  inspectionId: z.string().uuid(),
  notes: optionalText(2000),
})

export const rejectInspectionSchema = z.object({
  eventId: z.string().uuid(),
  inspectionId: z.string().uuid(),
  notes: z.string().trim().min(3).max(2000),
})

export type RecordInspectionInput = z.infer<typeof recordInspectionSchema>
export type ApproveInspectionInput = z.infer<typeof approveInspectionSchema>
export type RejectInspectionInput = z.infer<typeof rejectInspectionSchema>
