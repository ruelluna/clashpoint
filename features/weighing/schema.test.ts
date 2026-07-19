import { describe, expect, it } from 'vitest'

import {
  createRoosterSchema,
  evaluateWeightStatus,
  evaluateWeightStatusGrams,
  inspectionWeightGramsSchema,
  recordInspectionWeightSchema,
  recordWeightSchema,
  validateCockCount,
  verifyWeightSchema,
} from '@/features/weighing/schema'

const eventId = '00000000-0000-4000-8000-000000000001'
const entryId = '00000000-0000-4000-8000-000000000002'
const roosterId = '00000000-0000-4000-8000-000000000003'
const weighingId = '00000000-0000-4000-8000-000000000004'

describe('evaluateWeightStatus', () => {
  it('passes weight within min and max', () => {
    expect(evaluateWeightStatus(2.1, 2.0, 2.5)).toBe('passed')
  })

  it('fails weight below minimum', () => {
    expect(evaluateWeightStatus(1.9, 2.0, 2.5)).toBe('failed')
  })

  it('fails weight above maximum', () => {
    expect(evaluateWeightStatus(2.6, 2.0, 2.5)).toBe('failed')
  })

  it('passes when only minimum is set and weight meets it', () => {
    expect(evaluateWeightStatus(2.0, 2.0, null)).toBe('passed')
  })

  it('passes when only maximum is set and weight is under it', () => {
    expect(evaluateWeightStatus(2.4, null, 2.5)).toBe('passed')
  })

  it('passes when no limits are configured', () => {
    expect(evaluateWeightStatus(2.2, null, null)).toBe('passed')
  })
})

describe('evaluateWeightStatusGrams', () => {
  it('passes weight within min and max grams', () => {
    expect(evaluateWeightStatusGrams(2100, 2000, 2500)).toBe('passed')
  })

  it('fails weight below minimum grams', () => {
    expect(evaluateWeightStatusGrams(1900, 2000, 2500)).toBe('failed')
  })

  it('fails weight above maximum grams', () => {
    expect(evaluateWeightStatusGrams(2600, 2000, 2500)).toBe('failed')
  })
})

describe('inspectionWeightGramsSchema', () => {
  it('accepts whole grams up to 10000', () => {
    expect(inspectionWeightGramsSchema.safeParse(2100).success).toBe(true)
    expect(inspectionWeightGramsSchema.safeParse(10000).success).toBe(true)
  })

  it('rejects weight above 10000 g', () => {
    expect(inspectionWeightGramsSchema.safeParse(10001).success).toBe(false)
  })

  it('rejects fractional grams', () => {
    expect(inspectionWeightGramsSchema.safeParse(2100.5).success).toBe(false)
  })
})

describe('recordInspectionWeightSchema', () => {
  it('accepts valid inspection weight input', () => {
    const result = recordInspectionWeightSchema.safeParse({
      eventId,
      roosterRecordId: roosterId,
      officialWeightGrams: 2150,
    })

    expect(result.success).toBe(true)
  })

  it('rejects weight above inspection maximum', () => {
    const result = recordInspectionWeightSchema.safeParse({
      eventId,
      roosterRecordId: roosterId,
      officialWeightGrams: 10001,
    })

    expect(result.success).toBe(false)
  })
})

describe('recordWeightSchema', () => {
  it('accepts valid weight input in grams', () => {
    const result = recordWeightSchema.safeParse({
      eventId,
      roosterRecordId: roosterId,
      officialWeight: 2150,
    })

    expect(result.success).toBe(true)
  })

  it('rejects non-positive weight', () => {
    const result = recordWeightSchema.safeParse({
      eventId,
      roosterRecordId: roosterId,
      officialWeight: 0,
    })

    expect(result.success).toBe(false)
  })

  it('rejects weight above 9999 g', () => {
    const result = recordWeightSchema.safeParse({
      eventId,
      roosterRecordId: roosterId,
      officialWeight: 10000,
    })

    expect(result.success).toBe(false)
  })
})

describe('verifyWeightSchema', () => {
  it('accepts valid verification input', () => {
    const result = verifyWeightSchema.safeParse({
      eventId,
      weighingId,
    })

    expect(result.success).toBe(true)
  })
})

describe('createRoosterSchema', () => {
  it('accepts valid rooster create input', () => {
    const result = createRoosterSchema.safeParse({
      eventId,
      entryId,
      entryName: 'Thunder',
      bandNumber: 'B-101',
      weight: 2150,
      breed: 'Talisayon',
      colorMarking: 'Red',
      notes: 'Staff encoded',
    })

    expect(result.success).toBe(true)
  })

  it('requires rooster name', () => {
    const result = createRoosterSchema.safeParse({
      eventId,
      entryId,
      bandNumber: 'B-101',
      breed: 'Talisayon',
      colorMarking: 'Red',
      notes: 'Staff encoded',
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing breed or color', () => {
    const result = createRoosterSchema.safeParse({
      eventId,
      entryId,
      bandNumber: 'B-101',
      weight: 2150,
      colorMarking: 'Red',
      notes: 'Staff encoded',
    })

    expect(result.success).toBe(false)
  })

  it('allows optional notes', () => {
    const result = createRoosterSchema.safeParse({
      eventId,
      entryId,
      entryName: 'Thunder',
      bandNumber: 'B-101',
      weight: 2150,
      breed: 'Talisayon',
      colorMarking: 'Red',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBeUndefined()
    }
  })

  it('rejects missing band number', () => {
    const result = createRoosterSchema.safeParse({
      eventId,
      entryId,
      bandNumber: '',
      weight: 2150,
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-positive weight', () => {
    const result = createRoosterSchema.safeParse({
      eventId,
      entryId,
      bandNumber: 'B-101',
      weight: 0,
    })

    expect(result.success).toBe(false)
  })
})

describe('validateCockCount', () => {
  it('allows count within event limit', () => {
    expect(validateCockCount(2, 3)).toBeNull()
  })

  it('rejects zero cocks', () => {
    expect(validateCockCount(0, 3)).toBe('At least one cock is required')
  })

  it('rejects count above event limit', () => {
    expect(validateCockCount(4, 3)).toBe('This event allows at most 3 cock(s) per entry')
  })
})
