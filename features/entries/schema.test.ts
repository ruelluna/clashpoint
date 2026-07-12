import { describe, expect, it } from 'vitest'

import {
  createEntrySchema,
  deleteEntrySchema,
  formatEntryNumber,
  getNextEntryNumber,
  parseEntryNumber,
  updateEntrySchema,
} from '@/features/entries/schema'

const eventId = '00000000-0000-4000-8000-000000000001'
const entryId = '00000000-0000-4000-8000-000000000002'

describe('createEntrySchema', () => {
  it('accepts entry with required rooster fields', () => {
    const result = createEntrySchema.safeParse({
      eventId,
      entryName: 'Team Alpha',
      ownerName: 'Juan Dela Cruz',
      bandNumber: 'B-101',
      weight: 2.15,
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing band number', () => {
    const result = createEntrySchema.safeParse({
      eventId,
      entryName: 'Team Alpha',
      ownerName: 'Juan Dela Cruz',
      bandNumber: '',
      weight: 2.15,
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-positive weight', () => {
    const result = createEntrySchema.safeParse({
      eventId,
      entryName: 'Team Alpha',
      ownerName: 'Juan Dela Cruz',
      bandNumber: 'B-101',
      weight: 0,
    })

    expect(result.success).toBe(false)
  })
})

describe('updateEntrySchema', () => {
  it('accepts valid entry update input', () => {
    const result = updateEntrySchema.safeParse({
      eventId,
      entryId,
      entryName: 'Team Alpha',
      ownerName: 'Juan Dela Cruz',
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing owner name', () => {
    const result = updateEntrySchema.safeParse({
      eventId,
      entryId,
      entryName: 'Team Alpha',
      ownerName: '',
    })

    expect(result.success).toBe(false)
  })
})

describe('deleteEntrySchema', () => {
  it('accepts valid delete input', () => {
    const result = deleteEntrySchema.safeParse({ eventId, entryId })
    expect(result.success).toBe(true)
  })

  it('rejects invalid entry id', () => {
    const result = deleteEntrySchema.safeParse({ eventId, entryId: 'not-uuid' })
    expect(result.success).toBe(false)
  })
})

describe('entry number helpers', () => {
  it('parses numeric entry numbers', () => {
    expect(parseEntryNumber('001')).toBe(1)
    expect(parseEntryNumber('42')).toBe(42)
    expect(parseEntryNumber('abc')).toBeNull()
  })

  it('formats entry numbers with zero padding', () => {
    expect(formatEntryNumber(1)).toBe('001')
    expect(formatEntryNumber(12)).toBe('012')
    expect(formatEntryNumber(120)).toBe('120')
  })

  it('rejects invalid sequences when formatting', () => {
    expect(() => formatEntryNumber(0)).toThrow()
    expect(() => formatEntryNumber(1.5)).toThrow()
  })

  it('returns the next sequential entry number for an event', () => {
    expect(getNextEntryNumber([])).toBe('001')
    expect(getNextEntryNumber(['001', '002', '010'])).toBe('011')
    expect(getNextEntryNumber(['003', '001', '002'])).toBe('004')
  })

  it('ignores non-numeric values when calculating the next number', () => {
    expect(getNextEntryNumber(['001', 'VIP-A', '002'])).toBe('003')
  })
})
