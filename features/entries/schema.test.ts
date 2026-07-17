import { describe, expect, it } from 'vitest'

import {
  CONTACT_NUMBER_PATTERN,
  CONTACT_NUMBER_PREFIX,
  buildRoosterEntryItemSchema,
  createEntrySchema,
  deleteEntrySchema,
  entryMetadataSchema,
  formatEntryNumber,
  formatCockEntryBarcode,
  formatOwnerBarcode,
  getNextEntryNumber,
  getNextOwnerBarcode,
  isBandNumberRequiredForEvent,
  isCockEntryBarcodeForEvent,
  isOwnerBarcodeForEvent,
  normalizeCockEntryBarcodeInput,
  normalizeOwnerBarcodeInput,
  parseCockEntryBarcodeSequence,
  parseCreateEntryFromFormData,
  parseEntryNumber,
  parseOwnerBarcodeSequence,
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

  it('accepts optional contact fields on owner metadata', () => {
    const result = entryMetadataSchema.safeParse({
      eventId,
      ownerName: 'Farm A',
      contactFullName: 'Juan Dela Cruz',
      contactDesignation: 'Manager',
      contactNumber: '+639171234567',
      email: 'juan@example.com',
    })
    expect(result.success).toBe(true)
  })
})

describe('roosterEntryItemSchema', () => {
  const validRooster = {
    entryName: 'Thunder',
    bandNumber: 'B-101',
    weight: 2150,
    breed: 'Talisayon',
    colorMarking: 'Black',
    notes: 'Ready for weigh-in',
  }

  it('accepts optional handler name per rooster', () => {
    const result = roosterEntryItemSchema.safeParse({
      ...validRooster,
      handlerName: 'Pedro',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.handlerName).toBe('Pedro')
    }
  })

  it('requires breed, color, and notes', () => {
    const result = roosterEntryItemSchema.safeParse({
      entryName: 'Thunder',
      bandNumber: 'B-101',
      weight: 2150,
    })
    expect(result.success).toBe(false)
  })

  it('allows optional band when banding is not required', () => {
    const schema = buildRoosterEntryItemSchema(false)
    const result = schema.safeParse({
      entryName: 'Thunder',
      weight: 2150,
      breed: 'Talisayon',
      colorMarking: 'Black',
      notes: 'No band yet',
    })
    expect(result.success).toBe(true)
  })
})

describe('isBandNumberRequiredForEvent', () => {
  it('requires band for classic events', () => {
    expect(isBandNumberRequiredForEvent('classic', null)).toBe(true)
  })

  it('requires band for derby only when banding policy is enabled', () => {
    expect(
      isBandNumberRequiredForEvent('derby', {
        enabledFields: ['banding'],
        bandingRequired: true,
      } as never)
    ).toBe(true)
    expect(isBandNumberRequiredForEvent('derby', null)).toBe(false)
  })
})

describe('createEntrySchema', () => {
  const baseRooster = {
    entryName: 'Thunder',
    bandNumber: 'B-101',
    weight: 2150,
    breed: 'Talisayon',
    colorMarking: 'Red',
    notes: 'First cock',
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
        {
          entryName: 'Lightning',
          bandNumber: 'B-102',
          weight: 2050,
          breed: 'Buyugon',
          colorMarking: 'Black',
          notes: 'Second cock',
        },
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
      breed: 'Talisayon',
      colorMarking: 'Black',
      notes: 'Note',
    })

    expect(result.success).toBe(false)
  })

  it('accepts weight up to 9999 grams', () => {
    const result = roosterEntryItemSchema.safeParse({
      entryName: 'Thunder',
      bandNumber: 'B-101',
      weight: 9999,
      breed: 'Talisayon',
      colorMarking: 'Black',
      notes: 'Note',
    })

    expect(result.success).toBe(true)
  })

  it('rejects weight over 9999 grams', () => {
    const result = roosterEntryItemSchema.safeParse({
      entryName: 'Thunder',
      bandNumber: 'B-101',
      weight: 10000,
      breed: 'Talisayon',
      colorMarking: 'Black',
      notes: 'Note',
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
    formData.set('handlerName_rooster_1', 'Pedro')
    formData.set('breed_rooster_1', 'Talisayon')
    formData.set('colorMarking_rooster_1', 'Black')
    formData.set('notes_rooster_1', 'Handler prefers morning weigh-in')
    formData.set('rooster_2_entryName', 'Lightning')
    formData.set('rooster_2_bandNumber', 'B-2')
    formData.set('rooster_2_weight', '2000')
    formData.set('breed_rooster_2', 'Buyugon')
    formData.set('colorMarking_rooster_2', 'Red')
    formData.set('notes_rooster_2', 'Second cock note')

    const parsed = parseCreateEntryFromFormData(formData)
    expect(parsed.parseErrors).toHaveLength(0)
    expect(parsed.roosters).toHaveLength(2)
    expect(parsed.roosters[0]?.entryName).toBe('Thunder')
    expect(parsed.roosters[0]?.handlerName).toBe('Pedro')
    expect(parsed.roosters[0]?.breed).toBe('Talisayon')
    expect(parsed.roosters[0]?.colorMarking).toBe('Black')
    expect(parsed.roosters[0]?.notes).toBe('Handler prefers morning weigh-in')
  })

  it('skips empty derby slots', () => {
    const formData = new FormData()
    formData.set('eventId', eventId)
    formData.set('ownerName', 'Farm A')
    formData.set('roosterSlotCount', '3')
    formData.set('rooster_1_entryName', 'Thunder')
    formData.set('rooster_1_bandNumber', 'B-1')
    formData.set('rooster_1_weight', '2100')
    formData.set('breed_rooster_1', 'Talisayon')
    formData.set('colorMarking_rooster_1', 'Black')
    formData.set('notes_rooster_1', 'Only cock')

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

describe('owner barcode helpers', () => {
  it('formats and parses owner barcodes for an event', () => {
    const barcode = formatOwnerBarcode(eventId, 1)
    expect(barcode).toBe('OWN-00000000-0001')
    expect(parseOwnerBarcodeSequence(barcode, eventId)).toBe(1)
  })

  it('normalizes barcode input', () => {
    expect(normalizeOwnerBarcodeInput(' own-abc-0001 ')).toBe('OWN-ABC-0001')
  })

  it('validates barcode belongs to event', () => {
    const barcode = formatOwnerBarcode(eventId, 2)
    expect(isOwnerBarcodeForEvent(barcode, eventId)).toBe(true)
    expect(isOwnerBarcodeForEvent('OWN-FFFFFFFF-0001', eventId)).toBe(false)
  })

  it('returns the next owner barcode sequence', () => {
    const existing = [formatOwnerBarcode(eventId, 1), formatOwnerBarcode(eventId, 3)]
    expect(getNextOwnerBarcode(eventId, existing)).toBe(formatOwnerBarcode(eventId, 4))
  })
})

describe('cock entry barcode helpers', () => {
  it('formats and validates cock entry barcodes for an event', () => {
    const barcode = formatCockEntryBarcode(eventId, 1)
    expect(parseCockEntryBarcodeSequence(barcode, eventId)).toBe(1)
    expect(isCockEntryBarcodeForEvent(barcode, eventId)).toBe(true)
    expect(normalizeCockEntryBarcodeInput(` ${barcode.toLowerCase()} `)).toBe(barcode)
  })
})
