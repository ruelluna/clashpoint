import { describe, expect, it } from 'vitest'

import {
  submitLineupSchema,
  validateCockCount,
} from '@/features/lineups/schema'

const eventId = '00000000-0000-4000-8000-000000000001'
const entryId = '00000000-0000-4000-8000-000000000002'

describe('submitLineupSchema', () => {
  it('accepts a valid lineup', () => {
    const result = submitLineupSchema.safeParse({
      eventId,
      entryId,
      cocks: [
        { cockNumber: 1, bandNumber: 'B-101' },
        { cockNumber: 2, bandNumber: 'B-102' },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('rejects duplicate cock numbers', () => {
    const result = submitLineupSchema.safeParse({
      eventId,
      entryId,
      cocks: [
        { cockNumber: 1, bandNumber: 'B-101' },
        { cockNumber: 1, bandNumber: 'B-102' },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Duplicate cock number')
    }
  })

  it('rejects duplicate band numbers', () => {
    const result = submitLineupSchema.safeParse({
      eventId,
      entryId,
      cocks: [
        { cockNumber: 1, bandNumber: 'B-101' },
        { cockNumber: 2, bandNumber: 'b-101' },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Duplicate band number')
    }
  })

  it('requires band numbers', () => {
    const result = submitLineupSchema.safeParse({
      eventId,
      entryId,
      cocks: [{ cockNumber: 1, bandNumber: '' }],
    })

    expect(result.success).toBe(false)
  })
})

describe('validateCockCount', () => {
  it('returns null when count matches cocks per entry', () => {
    expect(validateCockCount(5, 5)).toBeNull()
  })

  it('returns error when count differs from cocks per entry', () => {
    expect(validateCockCount(3, 5)).toBe(
      'Lineup must include exactly 5 cocks (received 3)'
    )
  })
})
