import { describe, expect, it } from 'vitest'

import { normalizeEntryIdentity } from '@/features/entries/utils'
import {
  getRegistrationClosedReason,
  isRegistrationOpen,
} from '@/features/events/utils'
import {
  buildCreatePublicRoostersSchema,
  createPublicOwnerSchema,
  parsePublicRoostersFromFormData,
  verifyOwnerVerificationSchema,
} from '@/features/public/schema'

describe('normalizeEntryIdentity', () => {
  it('trims, collapses whitespace, and lowercases', () => {
    expect(normalizeEntryIdentity('  Farm   Alpha  ')).toBe('farm alpha')
  })

  it('returns null for empty values', () => {
    expect(normalizeEntryIdentity('')).toBeNull()
    expect(normalizeEntryIdentity('   ')).toBeNull()
    expect(normalizeEntryIdentity(null)).toBeNull()
  })
})

describe('isRegistrationOpen', () => {
  it('returns true when open and before deadline', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    expect(
      isRegistrationOpen({ status: 'open', registration_deadline: future })
    ).toBe(true)
  })

  it('returns false when past deadline', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString()
    expect(
      isRegistrationOpen({ status: 'open', registration_deadline: past })
    ).toBe(false)
  })

  it('returns false when status is not open', () => {
    expect(
      isRegistrationOpen({ status: 'draft', registration_deadline: null })
    ).toBe(false)
  })
})

describe('getRegistrationClosedReason', () => {
  it('explains draft status', () => {
    expect(
      getRegistrationClosedReason({ status: 'draft', registration_deadline: null })
    ).toContain('not open')
  })
})

describe('createPublicOwnerSchema', () => {
  it('requires email for new public game farm registration', () => {
    const parsed = createPublicOwnerSchema.safeParse({
      eventId: '00000000-0000-4000-8000-000000000099',
      ownerName: 'Farm Alpha',
      email: 'owner@example.com',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects missing email', () => {
    const parsed = createPublicOwnerSchema.safeParse({
      eventId: '00000000-0000-4000-8000-000000000099',
      ownerName: 'Farm Alpha',
    })

    expect(parsed.success).toBe(false)
  })
})

describe('verifyOwnerVerificationSchema', () => {
  it('requires a 6-digit code', () => {
    const parsed = verifyOwnerVerificationSchema.safeParse({
      eventId: '00000000-0000-4000-8000-000000000099',
      competitorId: '00000000-0000-4000-8000-000000000001',
      code: '123456',
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects short codes', () => {
    const parsed = verifyOwnerVerificationSchema.safeParse({
      eventId: '00000000-0000-4000-8000-000000000099',
      competitorId: '00000000-0000-4000-8000-000000000001',
      code: '123',
    })

    expect(parsed.success).toBe(false)
  })
})

describe('buildCreatePublicRoostersSchema', () => {
  it('requires handler and allows optional breed/color/notes', () => {
    const parsed = buildCreatePublicRoostersSchema(true, 'derby', 2).safeParse({
      eventId: '00000000-0000-4000-8000-000000000099',
      roosters: [
        {
          entryName: 'Thunder',
          bandNumber: 'B-001',
          weight: 2000,
          handlerName: 'Pedro',
        },
        {
          entryName: 'Bolt',
          bandNumber: 'B-002',
          weight: 2100,
          handlerName: 'Maria',
          breed: 'Talisayon',
          colorMarking: 'Black',
          notes: 'Public rooster note',
        },
      ],
    })

    expect(parsed.success).toBe(true)
  })

  it('rejects missing handler', () => {
    const parsed = buildCreatePublicRoostersSchema(true, 'classic', 1).safeParse({
      eventId: '00000000-0000-4000-8000-000000000099',
      roosters: [
        {
          entryName: 'Thunder',
          bandNumber: 'B-001',
          weight: 2000,
        },
      ],
    })

    expect(parsed.success).toBe(false)
  })

  it('requires all derby slots', () => {
    const parsed = buildCreatePublicRoostersSchema(true, 'derby', 2).safeParse({
      eventId: '00000000-0000-4000-8000-000000000099',
      roosters: [
        {
          entryName: 'Thunder',
          bandNumber: 'B-001',
          weight: 2000,
          handlerName: 'Pedro',
        },
      ],
    })

    expect(parsed.success).toBe(false)
  })
})

describe('parsePublicRoostersFromFormData', () => {
  it('parses rooster slots without owner metadata fields', () => {
    const formData = new FormData()
    formData.set('eventId', '00000000-0000-4000-8000-000000000099')
    formData.set('roosterSlotCount', '1')
    formData.set('rooster_1_entryName', 'Thunder')
    formData.set('rooster_1_bandNumber', 'B-001')
    formData.set('rooster_1_weight', '2000')
    formData.set('handlerName_rooster_1', 'Pedro')

    const parsed = parsePublicRoostersFromFormData(formData, {
      bandingRequired: true,
      eventType: 'classic',
      cocksPerEntry: 1,
    })

    expect(parsed.parseErrors).toEqual([])
    expect(parsed.schemaResult.success).toBe(true)
  })
})
