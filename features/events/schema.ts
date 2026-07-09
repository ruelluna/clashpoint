import { z } from 'zod'

export const eventTypeSchema = z.enum([
  'house',
  'external_promoter',
  'sponsored',
  'test',
])

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

export const eventFormatSchema = z.enum(['classic', 'derby'])

export const derbyTypeSchema = z.enum([
  '3_cock',
  '4_cock',
  '5_cock',
  'stag',
  'bullstag',
  'custom',
])

export const scoringSystemSchema = z.enum(['win_loss', 'points'])

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
  venue: z.string().min(1, 'Venue is required').max(200),
  eventDate: z.string().datetime({ message: 'Valid event date required' }),
  registrationDeadline: z.string().datetime().nullable().optional(),
  eventType: eventTypeSchema.default('house'),
  eventFormat: eventFormatSchema.default('derby'),
  derbyType: derbyTypeSchema.nullable().optional(),
  entryFee: z.coerce.number().nonnegative('Entry fee cannot be negative'),
  minEntries: z.coerce.number().int().positive().nullable().optional(),
  maxEntries: z.coerce.number().int().positive().nullable().optional(),
  cocksPerEntry: z.coerce.number().int().positive().default(5),
  minWeight: z.coerce.number().positive().nullable().optional(),
  maxWeight: z.coerce.number().positive().nullable().optional(),
  scoringSystem: scoringSystemSchema.default('points'),
  drawRule: z.string().min(1).max(200).default('0.5 points'),
  tieBreakerRule: z.string().min(1).max(200).default('shared_championship'),
  guaranteedPrizeAmount: z.coerce.number().nonnegative().nullable().optional(),
  houseDeduction: z.coerce.number().nonnegative().nullable().optional(),
  venueShare: z.coerce.number().nonnegative().nullable().optional(),
  legalAuthorized: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  publishMatches: z.boolean().default(false),
  publishStandings: z.boolean().default(false),
  publishWinners: z.boolean().default(false),
  publishPrizeAmounts: z.boolean().default(false),
  notes: z.string().max(5000).nullable().optional(),
})

function refineEventRanges(
  data: z.infer<typeof eventFieldsSchema>,
  ctx: z.RefinementCtx
) {
  if (
    data.minEntries != null &&
    data.maxEntries != null &&
    data.minEntries > data.maxEntries
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Minimum entries cannot exceed maximum entries',
      path: ['minEntries'],
    })
  }

  if (
    data.minWeight != null &&
    data.maxWeight != null &&
    data.minWeight > data.maxWeight
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'Minimum weight cannot exceed maximum weight',
      path: ['minWeight'],
    })
  }

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

  if (data.eventFormat === 'derby' && data.derbyType == null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Derby type is required for derby events',
      path: ['derbyType'],
    })
  }

  if (data.eventFormat === 'classic' && data.cocksPerEntry !== 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Classic events must have exactly 1 cock per entry',
      path: ['cocksPerEntry'],
    })
  }
}

export const createEventSchema = eventFieldsSchema
  .extend({
    prizeStructure: prizeStructureSchema,
  })
  .superRefine(refineEventRanges)

export const updateEventSchema = eventFieldsSchema
  .extend({
    eventId: z.string().uuid(),
  })
  .superRefine(refineEventRanges)

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
  house: 'House',
  external_promoter: 'External Promoter',
  sponsored: 'Sponsored',
  test: 'Test',
}

export const EVENT_FORMAT_LABELS: Record<z.infer<typeof eventFormatSchema>, string> = {
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
  '3_cock': '3-Cock',
  '4_cock': '4-Cock',
  '5_cock': '5-Cock',
  stag: 'Stag',
  bullstag: 'Bullstag',
  custom: 'Custom',
}

export const PRIZE_TYPE_LABELS: Record<z.infer<typeof prizeTypeSchema>, string> = {
  percentage: 'Percentage',
  fixed: 'Fixed Amount',
  manual: 'Manual',
}
