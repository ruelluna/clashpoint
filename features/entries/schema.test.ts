import { describe, expect, it } from 'vitest'

import {
  CONTACT_NUMBER_PATTERN,
  CONTACT_NUMBER_PREFIX,
  createEntrySchema,
  deleteEntrySchema,
  entryMetadataSchema,
  formatEntryNumber,
  getNextEntryNumber,
  parseCreateEntryFromFormData,
  parseEntryNumber,
  roosterEntryItemSchema,
  updateEntrySchema,
  validateEntryRosterCount,
} from '@/features/entries/schema'

const eventId = '00000000-0000-4000-8000-000000000001'
const entryId = '00000000-0000-4000-8000-000000000002'

describe('contactNumberSchema', () => {
  it('accepts numbers with +63 prefix', () => {
    const result = entryMetadataSchema.safeParse({
      eventId,
      ownerName: 'Farm A',
      contactNumber: '+639171234567',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid contact numbers', () => {
    const result = entryMetadataSchema.safeParse({
      eventId,
      ownerName: 'Farm A',
      contactNumber: '6912345678',
    })
    expect(result.success).toBe(false)
  })

  it('allows empty contact number', () => {
    const result = entryMetadataSchema.safeParse({
      eventId,
      ownerName: 'Farm A',
      contactNumber: '',
    })
    expect(result.success).toBe(true)
  })
})

describe('createEntrySchema', () => {
  const baseRooster = {
    entryName: 'Thunder',
    bandNumber: 'B-101',
    weight: 2150,
  }

  it('accepts entry with one rooster in grams', () => {
    const result = createEntrySchema.safeParse({
      eventId,
      ownerName: 'Juan Dela Cruz',
      roosters: [baseRooster],
    })

    expect(result.success).toBe(true)
  })

  it('accepts derby entry with multiple roosters', () => {
    const result = createEntrySchema.safeParse({
      eventId,
      ownerName: 'Game Farm X',
      roosters: [
        baseRooster,
        { entryName: 'Lightning', bandNumber: 'B-102', weight: 2050 },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing roosters', () => {
    const result = createEntrySchema.safeParse({
      eventId,
      ownerName: 'Juan Dela Cruz',
      roosters: [],
    })

    expect(result.success).toBe(false)
  })

  it('rejects fractional grams', () => {
    const result = roosterEntryItemSchema.safeParse({
      entryName: 'Thunder',
      bandNumber: 'B-101',
      weight: 2.15,
    })

    expect(result.success).toBe(false)
  })

  it('accepts optional competitor link', () => {
    const competitorId = '00000000-0000-4000-8000-000000000003'
    const result = createEntrySchema.safeParse({
      eventId,
      ownerName: 'Juan Dela Cruz',
      competitorId,
      roosters: [baseRooster],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.competitorId).toBe(competitorId)
    }
  })
})

describe('validateEntryRosterCount', () => {
  it('requires exactly one rooster for classic events', () => {
    expect(validateEntryRosterCount(1, 'classic', 1)).toBeNull()
    expect(validateEntryRosterCount(2, 'classic', 1)).toMatch(/exactly one/)
  })

  it('allows partial derby rosters up to format limit', () => {
    expect(validateEntryRosterCount(1, 'derby', 3)).toBeNull()
    expect(validateEntryRosterCount(3, 'derby', 3)).toBeNull()
    expect(validateEntryRosterCount(4, 'derby', 3)).toMatch(/at most/)
  })
})

describe('parseCreateEntryFromFormData', () => {
  it('parses filled rooster slots from indexed form fields', () => {
    const formData = new FormData()
    formData.set('eventId', eventId)
    formData.set('ownerName', 'Farm A')
    formData.set('roosterSlotCount', '2')
    formData.set('rooster_1_entryName', 'Thunder')
    formData.set('rooster_1_bandNumber', 'B-1')
    formData.set('rooster_1_weight', '2100')
    formData.set('rooster_2_entryName', 'Lightning')
    formData.set('rooster_2_bandNumber', 'B-2')
    formData.set('rooster_2_weight', '2000')

    const parsed = parseCreateEntryFromFormData(formData)
    expect(parsed.parseErrors).toHaveLength(0)
    expect(parsed.roosters).toHaveLength(2)
    expect(parsed.roosters[0]?.entryName).toBe('Thunder')
  })

  it('skips empty derby slots', () => {
    const formData = new FormData()
    formData.set('eventId', eventId)
    formData.set('ownerName', 'Farm A')
    formData.set('roosterSlotCount', '3')
    formData.set('rooster_1_entryName', 'Thunder')
    formData.set('rooster_1_bandNumber', 'B-1')
    formData.set('rooster_1_weight', '2100')

    const parsed = parseCreateEntryFromFormData(formData)
    expect(parsed.roosters).toHaveLength(1)
  })
})

describe('updateEntrySchema', () => {
  it('accepts valid entry update input without entry name', () => {
    const result = updateEntrySchema.safeParse({
      eventId,
      entryId,
      ownerName: 'Juan Dela Cruz',
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing owner name', () => {
    const result = updateEntrySchema.safeParse({
      eventId,
      entryId,
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

  it('matches contact number pattern', () => {
    expect(CONTACT_NUMBER_PATTERN.test('+639171234567')).toBe(true)
    expect(CONTACT_NUMBER_PREFIX).toBe('+63')
  })
})
