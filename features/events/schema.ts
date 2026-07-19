import { z } from 'zod'

export const eventTypeSchema = z.enum(['classic', 'derby'])

export const eventStatusSchema = z.enum([
  'draft',
  'open',
  'registration_closed',
  'ready_for_weighing',
  'ready_for_matching',
  'ongoing',
  'completed',
  'cancelled',
  'archived',
])

export const derbyFormatSchema = z.enum([
  '2_cock',
  '3_cock',
  '4_cock',
  '5_cock',
  'custom',
])

export const derbyAgeTypeSchema = z.enum([
  'stag_derby',
  'bullstag_derby',
  'cock_derby',
  'stag_cock_derby',
  'cock_bullstag_derby',
  'stag_bullstag_cock_combo',
  'open_derby',
  'custom',
])

export const prizeTypeSchema = z.enum(['percentage', 'fixed', 'manual'])

export const prizeConfigEntrySchema = z.object({
  place: z.number().int().positive('Place must be at least 1'),
  label: z.string().min(1).max(100),
  value: z.number().nonnegative().optional(),
})

export const prizeStructureSchema = z
  .object({
    prizeType: prizeTypeSchema,
    config: z.array(prizeConfigEntrySchema).min(1, 'At least one prize tier required'),
  })
  .superRefine((data, ctx) => {
    if (data.prizeType === 'manual') return

    for (const [index, entry] of data.config.entries()) {
      if (entry.value === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'Value required for percentage and fixed prize types',
          path: ['config', index, 'value'],
        })
      }
    }

    if (data.prizeType === 'percentage') {
      const total = data.config.reduce((sum, entry) => sum + (entry.value ?? 0), 0)
      if (total > 100) {
        ctx.addIssue({
          code: 'custom',
          message: 'Percentage prizes cannot exceed 100%',
          path: ['config'],
        })
      }
    }
  })

const eventFieldsSchema = z.object({
  promoterId: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'Event name is required').max(200),
  eventDate: z.string().datetime({ message: 'Valid event date required' }),
  registrationDeadline: z.string().datetime().nullable().optional(),
  eventType: eventTypeSchema.default('derby'),
  derbyFormat: derbyFormatSchema.nullable().optional(),
  /** @deprecated alias for derbyFormat */
  derbyType: derbyFormatSchema.nullable().optional(),
  derbyAgeType: derbyAgeTypeSchema.nullable().optional(),
  entryFee: z.coerce.number().nonnegative('Entry fee cannot be negative').default(0),
  registrationFeeEnabled: z.coerce.boolean().default(false),
  registrationFeeAmount: z.coerce
    .number()
    .nonnegative('Registration fee cannot be negative')
    .default(0),
  roosterEntryFeeEnabled: z.coerce.boolean().default(false),
  roosterEntryFeeAmount: z.coerce
    .number()
    .nonnegative('Rooster entry fee cannot be negative')
    .default(0),
  cashBondEnabled: z.coerce.boolean().default(false),
  cashBondAmount: z.coerce.number().nonnegative('Cash bond cannot be negative').default(0),
  taxPerFight: z.coerce.number().nonnegative('Tax per fight cannot be negative').default(100),
  taxCommission: z.coerce.number().nonnegative('Tax commission cannot be negative').default(0),
  physicalInspectionRequired: z.coerce.boolean().default(false),
  revolvingFundInitial: z.coerce
    .number()
    .nonnegative('Revolving fund cannot be negative')
    .default(0),
  cocksPerEntry: z.coerce.number().int().positive().default(2),
  registrationRules: z.string().max(50000).nullable().optional(),
  legalAuthorized: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  publishMatches: z.boolean().default(false),
  publishStandings: z.boolean().default(false),
  publishWinners: z.boolean().default(false),
  publishPrizeAmounts: z.boolean().default(false),
  notes: z.string().max(5000).nullable().optional(),
})

function refineEventRanges(
  data: z.infer<typeof eventFieldsSchema> & { prizeStructure?: z.infer<typeof prizeStructureSchema> },
  ctx: z.RefinementCtx,
  options?: { requirePrizeStructure?: boolean }
) {
  if (
    data.registrationDeadline &&
    new Date(data.registrationDeadline) > new Date(data.eventDate)
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Registration deadline must be before event date',
      path: ['registrationDeadline'],
    })
  }

  const derbyFormat = data.derbyFormat ?? data.derbyType

  if (data.eventType === 'derby') {
    if (derbyFormat == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Derby format is required for derby events',
        path: ['derbyFormat'],
      })
    }

    if (options?.requirePrizeStructure && data.prizeStructure == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Prize structure is required for derby events',
        path: ['prizeStructure'],
      })
    }
  }

  if (data.eventType === 'classic') {
    if (data.cocksPerEntry !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Classic events must have exactly 1 cock per entry',
        path: ['cocksPerEntry'],
      })
    }
    if (derbyFormat != null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Derby format must not be set for classic events',
        path: ['derbyFormat'],
      })
    }
  }

  if (data.eventType === 'derby' && derbyFormat === 'custom' && data.cocksPerEntry < 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Cocks per entry is required for custom derby type',
      path: ['cocksPerEntry'],
    })
  }

  if (data.eventType === 'derby') {
    if (data.registrationFeeEnabled && data.registrationFeeAmount <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Registration fee amount is required when enabled',
        path: ['registrationFeeAmount'],
      })
    }
    if (data.roosterEntryFeeEnabled && data.roosterEntryFeeAmount <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Rooster entry fee amount is required when enabled',
        path: ['roosterEntryFeeAmount'],
      })
    }
    if (data.cashBondEnabled && data.cashBondAmount <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Cash bond amount is required when enabled',
        path: ['cashBondAmount'],
      })
    }
  }
}

export const createEventSchema = eventFieldsSchema
  .extend({
    prizeStructure: prizeStructureSchema.optional(),
  })
  .superRefine((data, ctx) =>
    refineEventRanges(data, ctx, { requirePrizeStructure: data.eventType === 'derby' })
  )

export const updateEventSchema = eventFieldsSchema
  .extend({
    eventId: z.string().uuid(),
    prizeStructure: prizeStructureSchema.optional(),
  })
  .superRefine((data, ctx) => refineEventRanges(data, ctx))

export const transitionStatusSchema = z.object({
  eventId: z.string().uuid(),
  status: eventStatusSchema,
  reason: z.string().min(3).max(500).optional(),
})

export const updatePrizeStructureSchema = z.object({
  eventId: z.string().uuid(),
  prizeStructure: prizeStructureSchema,
})

export const setEventActiveSchema = z.object({
  eventId: z.string().uuid(),
})

export const clearEventActiveSchema = z.object({
  eventId: z.string().uuid(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type TransitionStatusInput = z.infer<typeof transitionStatusSchema>
export type UpdatePrizeStructureInput = z.infer<typeof updatePrizeStructureSchema>
export type SetEventActiveInput = z.infer<typeof setEventActiveSchema>
export type ClearEventActiveInput = z.infer<typeof clearEventActiveSchema>
export type PrizeStructureInput = z.infer<typeof prizeStructureSchema>

export const EVENT_TYPE_LABELS: Record<z.infer<typeof eventTypeSchema>, string> = {
  classic: 'Classic',
  derby: 'Derby',
}

export const EVENT_STATUS_LABELS: Record<z.infer<typeof eventStatusSchema>, string> = {
  draft: 'Draft',
  open: 'Open',
  registration_closed: 'Registration Closed',
  ready_for_weighing: 'Ready for Weighing',
  ready_for_matching: 'Ready for Matching',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  archived: 'Archived',
}

export const DERBY_FORMAT_LABELS: Record<z.infer<typeof derbyFormatSchema>, string> = {
  '2_cock': '2-Cock',
  '3_cock': '3-Cock',
  '4_cock': '4-Cock',
  '5_cock': '5-Cock',
  custom: 'Custom',
}

export const DERBY_AGE_TYPE_LABELS: Record<z.infer<typeof derbyAgeTypeSchema>, string> = {
  stag_derby: 'Stag Derby',
  bullstag_derby: 'Bullstag Derby',
  cock_derby: 'Cock Derby',
  stag_cock_derby: 'Stag/Cock Derby',
  cock_bullstag_derby: 'Cock/Bullstag Derby',
  stag_bullstag_cock_combo: 'Stag/Bullstag/Cock Combo',
  open_derby: 'Open Derby',
  custom: 'Custom Derby',
}

/** @deprecated Use DERBY_FORMAT_LABELS */
export const DERBY_TYPE_LABELS = DERBY_FORMAT_LABELS

export const PRIZE_TYPE_LABELS: Record<z.infer<typeof prizeTypeSchema>, string> = {
  percentage: 'Percentage',
  fixed: 'Fixed Amount',
  manual: 'Manual',
}

export function defaultTaxPerFight(eventType: z.infer<typeof eventTypeSchema>): number {
  return eventType === 'classic' ? 50 : 100
}
