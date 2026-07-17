import { describe, expect, it } from 'vitest'

import {
  createRoosterSchema,
  evaluateWeightStatus,
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

  it('rejects missing breed, color, or notes', () => {
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
