import { z } from 'zod'

import type { CommissionType, PromoterStatus } from '@/features/promoters/types'

export const promoterStatusSchema = z.enum(['active', 'inactive', 'suspended'])

export const commissionTypeSchema = z.enum([
  'none',
  'fixed',
  'percentage',
  'custom',
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

function validateCommission(
  data: { commissionType: CommissionType; commissionValue?: number },
  ctx: z.RefinementCtx
) {
  if (data.commissionType === 'none') return

  if (data.commissionType === 'custom') return

  if (data.commissionValue == null || Number.isNaN(data.commissionValue)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Commission value is required',
      path: ['commissionValue'],
    })
    return
  }

  if (data.commissionType === 'percentage') {
    if (data.commissionValue < 0 || data.commissionValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage must be between 0 and 100',
        path: ['commissionValue'],
      })
    }
    return
  }

  if (data.commissionType === 'fixed' && data.commissionValue < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Fixed commission must be zero or greater',
      path: ['commissionValue'],
    })
  }
}

function validateLoginAccess(
  data: {
    giveLoginAccess: boolean
    loginEmail?: string
    loginPassword?: string
  },
  ctx: z.RefinementCtx
) {
  if (!data.giveLoginAccess) return

  if (!data.loginEmail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Login email is required',
      path: ['loginEmail'],
    })
  }

  if (!data.loginPassword || data.loginPassword.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Password must be at least 8 characters',
      path: ['loginPassword'],
    })
  }
}

const promoterBaseFields = {
  name: z.string().min(1, 'Name is required').max(200),
  contactPerson: optionalText(200),
  phone: optionalText(50),
  email: optionalEmail,
  address: optionalText(500),
  commissionType: commissionTypeSchema,
  commissionValue: z.coerce.number().optional(),
  notes: optionalText(2000),
}

export const createPromoterSchema = z
  .object({
    ...promoterBaseFields,
    giveLoginAccess: z.boolean(),
    loginEmail: optionalEmail,
    loginPassword: z.string().optional(),
  })
  .superRefine(validateCommission)
  .superRefine(validateLoginAccess)

export const updatePromoterSchema = z
  .object({
    promoterId: z.string().uuid(),
    ...promoterBaseFields,
    status: promoterStatusSchema,
  })
  .superRefine(validateCommission)

export const changePromoterStatusSchema = z.object({
  promoterId: z.string().uuid(),
  status: promoterStatusSchema,
  reason: z.string().min(3, 'Reason must be at least 3 characters').optional(),
})

export const linkPromoterUserSchema = z.object({
  promoterId: z.string().uuid(),
  loginEmail: z.string().email('Valid email required'),
  loginPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export type CreatePromoterInput = z.infer<typeof createPromoterSchema>
export type UpdatePromoterInput = z.infer<typeof updatePromoterSchema>
export type ChangePromoterStatusInput = z.infer<typeof changePromoterStatusSchema>
export type LinkPromoterUserInput = z.infer<typeof linkPromoterUserSchema>

export const PROMOTER_STATUS_LABELS: Record<PromoterStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
}

export const COMMISSION_TYPE_LABELS: Record<CommissionType, string> = {
  none: 'None',
  fixed: 'Fixed amount',
  percentage: 'Percentage',
  custom: 'Custom',
}
