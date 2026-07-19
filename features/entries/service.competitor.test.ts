import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { getCompetitor, findOrCreateCompetitor, createExtendedClient } = vi.hoisted(() => ({
  getCompetitor: vi.fn(),
  findOrCreateCompetitor: vi.fn(),
  createExtendedClient: vi.fn(),
}))

vi.mock('@/features/competitors/queries', () => ({
  getCompetitor,
}))

vi.mock('@/features/competitors/service', () => ({
  findOrCreateCompetitor,
}))

vi.mock('@/lib/supabase/extended', () => ({
  createExtendedClient,
}))

import { resolveEntryCompetitor } from '@/features/entries/service'

const actorId = '00000000-0000-4000-8000-000000000001'
const competitorId = '00000000-0000-4000-8000-000000000002'

describe('resolveEntryCompetitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createExtendedClient.mockResolvedValue({
      from: vi.fn(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      })),
    })
  })

  it('syncs contact fields when a saved owner is selected', async () => {
    vi.mocked(getCompetitor).mockResolvedValue({
      id: competitorId,
      displayName: 'Saved Farm',
      contactFullName: 'Old Contact',
      contactDesignation: null,
      contactNumber: '09171234567',
      email: 'old@example.com',
      address: null,
    })

    const result = await resolveEntryCompetitor(actorId, {
      competitorId,
      ownerName: 'Saved Farm',
      contactFullName: 'Updated Contact',
      contactDesignation: 'Manager',
      contactNumber: '09179999999',
      email: 'new@example.com',
    })

    expect(result).toEqual({ competitorId })
    expect(findOrCreateCompetitor).not.toHaveBeenCalled()
  })

  it('finds or creates a registry owner for free-text owner names', async () => {
    vi.mocked(findOrCreateCompetitor).mockResolvedValue({ competitorId })

    const result = await resolveEntryCompetitor(actorId, {
      ownerName: '  New Farm  ',
      contactFullName: 'Juan',
      contactDesignation: undefined,
      contactNumber: '09171234567',
      email: 'juan@example.com',
    })

    expect(result).toEqual({ competitorId })
    expect(findOrCreateCompetitor).toHaveBeenCalledWith(actorId, {
      displayName: 'New Farm',
      contactFullName: 'Juan',
      contactDesignation: undefined,
      contactNumber: '09171234567',
      email: 'juan@example.com',
      address: undefined,
      notes: undefined,
    })
  })

  it('returns null when owner name is blank', async () => {
    const result = await resolveEntryCompetitor(actorId, {
      ownerName: '   ',
      contactFullName: undefined,
      contactDesignation: undefined,
      contactNumber: undefined,
      email: undefined,
    })

    expect(result).toEqual({ competitorId: null })
    expect(findOrCreateCompetitor).not.toHaveBeenCalled()
  })
})
