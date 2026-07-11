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

export const derbyTypeSchema = z.enum([
  '2_cock',
  '3_cock',
  '4_cock',
  '5_cock',
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
  derbyType: derbyTypeSchema.nullable().optional(),
  entryFee: z.coerce.number().nonnegative('Entry fee cannot be negative'),
  taxPerFight: z.coerce.number().nonnegative('Tax per fight cannot be negative').default(0),
  cocksPerEntry: z.coerce.number().int().positive().default(5),
  registrationRules: z.string().max(50000).nullable().optional(),
  legalAuthorized: z.boolean().default(false),
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

  if (data.eventType === 'derby') {
    if (data.derbyType == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Derby type is required for derby events',
        path: ['derbyType'],
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
    if (data.derbyType != null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Derby type must not be set for classic events',
        path: ['derbyType'],
      })
    }
  }

  if (data.eventType === 'derby' && data.derbyType === 'custom' && data.cocksPerEntry < 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Cocks per entry is required for custom derby type',
      path: ['cocksPerEntry'],
    })
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

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type TransitionStatusInput = z.infer<typeof transitionStatusSchema>
export type UpdatePrizeStructureInput = z.infer<typeof updatePrizeStructureSchema>
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

export const DERBY_TYPE_LABELS: Record<z.infer<typeof derbyTypeSchema>, string> = {
  '2_cock': '2-Cock',
  '3_cock': '3-Cock',
  '4_cock': '4-Cock',
  '5_cock': '5-Cock',
  custom: 'Custom',
}

export const PRIZE_TYPE_LABELS: Record<z.infer<typeof prizeTypeSchema>, string> = {
  percentage: 'Percentage',
  fixed: 'Fixed Amount',
  manual: 'Manual',
}
