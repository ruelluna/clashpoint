import { z } from 'zod'

export const openCashierSessionSchema = z
  .object({
    eventId: z.string().uuid(),
    openingFloatAmount: z.coerce.number().nonnegative('Opening float cannot be negative'),
    openingFloatDefault: z.coerce.number().nonnegative(),
    openingFloatNote: z
      .string()
      .max(500)
      .optional()
      .or(z.literal(''))
      .transform((value) => value || undefined),
  })
  .superRefine((data, ctx) => {
    const differs =
      Number(data.openingFloatAmount.toFixed(2)) !==
      Number(data.openingFloatDefault.toFixed(2))

    if (differs && !data.openingFloatNote?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'A note is required when opening float differs from the default',
        path: ['openingFloatNote'],
      })
    }
  })

export const closeCashierSessionSchema = z.object({
  eventId: z.string().uuid(),
  sessionId: z.string().uuid(),
  closingCountedCash: z.coerce
    .number()
    .nonnegative('Counted cash cannot be negative')
    .optional(),
  closingNotes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
})

export const recordAdminHandoverSchema = z.object({
  eventId: z.string().uuid(),
  sessionId: z.string().uuid(),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  description: z.string().min(3, 'Reason must be at least 3 characters').max(500),
  adminUserId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
})

export type OpenCashierSessionInput = z.infer<typeof openCashierSessionSchema>
export type CloseCashierSessionInput = z.infer<typeof closeCashierSessionSchema>
export type RecordAdminHandoverInput = z.infer<typeof recordAdminHandoverSchema>

export const CASHIER_SESSION_MOVEMENT_LABELS: Record<
  import('@/features/cashier-sessions/types').CashierSessionMovementType,
  string
> = {
  opening_float: 'Opening float',
  admin_handover: 'Admin handover',
  adjustment: 'Adjustment',
}
