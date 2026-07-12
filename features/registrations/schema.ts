import { z } from 'zod'

import { rejectionCategorySchema } from '@/lib/derby/enums'

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)

const requiredReason = z.string().trim().min(3).max(2000)

export const registrationActionBaseSchema = z.object({
  eventId: z.string().uuid(),
  registrationId: z.string().uuid(),
})

export const submitRegistrationSchema = registrationActionBaseSchema

export const approveRegistrationSchema = registrationActionBaseSchema.extend({
  approvalNotes: optionalText(2000),
})

export const conditionallyApproveRegistrationSchema =
  registrationActionBaseSchema.extend({
    condition: requiredReason,
    deadline: z.string().datetime().nullable().optional(),
    approvalNotes: optionalText(2000),
  })

export const rejectRegistrationSchema = registrationActionBaseSchema.extend({
  rejectionCategory: rejectionCategorySchema,
  rejectionReason: requiredReason,
})

export const revokeRegistrationApprovalSchema = registrationActionBaseSchema.extend({
  reason: requiredReason,
})

export const withdrawRegistrationSchema = registrationActionBaseSchema.extend({
  withdrawalReason: requiredReason,
})

export const disqualifyRegistrationSchema = registrationActionBaseSchema.extend({
  disqualificationReason: requiredReason,
})

export type SubmitRegistrationInput = z.infer<typeof submitRegistrationSchema>
export type ApproveRegistrationInput = z.infer<typeof approveRegistrationSchema>
export type ConditionallyApproveRegistrationInput = z.infer<
  typeof conditionallyApproveRegistrationSchema
>
export type RejectRegistrationInput = z.infer<typeof rejectRegistrationSchema>
export type RevokeRegistrationApprovalInput = z.infer<
  typeof revokeRegistrationApprovalSchema
>
export type WithdrawRegistrationInput = z.infer<typeof withdrawRegistrationSchema>
export type DisqualifyRegistrationInput = z.infer<typeof disqualifyRegistrationSchema>
