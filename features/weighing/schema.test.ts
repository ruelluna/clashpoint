import { describe, expect, it } from 'vitest'

import {
  evaluateWeightStatus,
  recordWeightSchema,
  verifyWeightSchema,
} from '@/features/weighing/schema'

const eventId = '00000000-0000-4000-8000-000000000001'
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
  it('accepts valid weight input', () => {
    const result = recordWeightSchema.safeParse({
      eventId,
      roosterRecordId: roosterId,
      officialWeight: 2.15,
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
