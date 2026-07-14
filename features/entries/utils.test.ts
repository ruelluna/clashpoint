import { describe, expect, it } from 'vitest'

import {
  DUPLICATE_ENTRY_ERROR,
  isDuplicateOwnerForEvent,
  isSameOwnerIdentity,
} from '@/features/entries/utils'

const competitorId = '00000000-0000-4000-8000-000000000003'
const entryId = '00000000-0000-4000-8000-000000000002'

describe('owner duplicate detection', () => {
  it('flags duplicate owner names case-insensitively', () => {
    expect(isSameOwnerIdentity('farm alpha', 'Farm Alpha')).toBe(true)
  })

  it('blocks duplicate owner for event', () => {
    const existing = {
      id: entryId,
      owner_name: 'Farm Alpha',
      competitor_id: null,
    }

    expect(
      isDuplicateOwnerForEvent('Farm Alpha', null, existing)
    ).toBe(true)
    expect(
      isDuplicateOwnerForEvent('Farm Alpha', null, existing, entryId)
    ).toBe(false)
  })

  it('blocks duplicate linked competitor regardless of display name', () => {
    const existing = {
      id: entryId,
      owner_name: 'Farm Alpha',
      competitor_id: competitorId,
    }

    expect(
      isDuplicateOwnerForEvent('Different Label', competitorId, existing)
    ).toBe(true)
  })

  it('uses stable duplicate error copy', () => {
    expect(DUPLICATE_ENTRY_ERROR).toMatch(/already registered for this event/i)
  })
})
