import { describe, expect, it } from 'vitest'

import { normalizeEntryIdentity } from '@/features/entries/utils'
import {
  getRegistrationClosedReason,
  isRegistrationOpen,
} from '@/features/events/utils'
import { createPublicEntrySchema } from '@/features/public/schema'

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

describe('createPublicEntrySchema', () => {
  it('forces online entry source with contact and per-rooster handler', () => {
    const parsed = createPublicEntrySchema.safeParse({
      eventId: '00000000-0000-4000-8000-000000000099',
      ownerName: 'Farm Alpha',
      contactFullName: 'Juan Dela Cruz',
      contactDesignation: 'Manager',
      entrySource: 'online',
      roosters: [
        {
          entryName: 'Thunder',
          bandNumber: 'B-001',
          weight: 2000,
          handlerName: 'Pedro',
        },
      ],
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.entrySource).toBe('online')
      expect(parsed.data.contactFullName).toBe('Juan Dela Cruz')
      expect(parsed.data.roosters[0]?.handlerName).toBe('Pedro')
    }
  })

  it('rejects staff-only fields when included', () => {
    const parsed = createPublicEntrySchema.safeParse({
      eventId: '00000000-0000-4000-8000-000000000099',
      ownerName: 'Farm Alpha',
      entrySource: 'online',
      referredByPromoterId: '00000000-0000-4000-8000-000000000001',
      roosters: [
        {
          entryName: 'Thunder',
          bandNumber: 'B-001',
          weight: 2000,
        },
      ],
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(
        'referredByPromoterId' in parsed.data &&
          parsed.data.referredByPromoterId
      ).toBeFalsy()
    }
  })
})
