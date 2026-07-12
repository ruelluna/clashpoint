import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { writeAuditLog, createExtendedClient, findCompetitorByDisplayName } = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
  createExtendedClient: vi.fn(),
  findCompetitorByDisplayName: vi.fn(),
}))

vi.mock('@/features/audit/service', () => ({
  writeAuditLog,
}))

vi.mock('@/features/competitors/queries', () => ({
  findCompetitorByDisplayName,
  countEntriesForCompetitor: vi.fn(),
}))

vi.mock('@/lib/supabase/extended', () => ({
  createExtendedClient,
}))

import {
  findOrCreateCompetitor,
  softDeleteCompetitor,
  updateCompetitor,
} from '@/features/competitors/service'
import { countEntriesForCompetitor } from '@/features/competitors/queries'

const existingCompetitorId = '00000000-0000-4000-8000-000000000010'

describe('findOrCreateCompetitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reuses an existing competitor with an exact display name match', async () => {
    vi.mocked(findCompetitorByDisplayName).mockResolvedValue({
      id: existingCompetitorId,
      displayName: 'Juan Dela Cruz',
      contactNumber: '09171234567',
      email: 'juan@example.com',
      address: 'Cebu',
    })

    const result = await findOrCreateCompetitor('actor-1', {
      displayName: 'Juan Dela Cruz',
      contactNumber: '09179999999',
      email: undefined,
      address: undefined,
    })

    expect(result).toEqual({ competitorId: existingCompetitorId })
    expect(createExtendedClient).not.toHaveBeenCalled()
    expect(writeAuditLog).not.toHaveBeenCalled()
  })

  it('creates a competitor when no exact match exists', async () => {
    vi.mocked(findCompetitorByDisplayName).mockResolvedValue(null)

    const single = vi.fn().mockResolvedValue({
      data: { id: '00000000-0000-4000-8000-000000000011', display_name: 'New Owner' },
      error: null,
    })

    createExtendedClient.mockResolvedValue({
      from: vi.fn(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single,
          }),
        }),
      })),
    })

    const result = await findOrCreateCompetitor('actor-1', {
      displayName: 'New Owner',
      contactNumber: '09171234567',
      email: 'new@example.com',
      address: 'Manila',
    })

    expect(result).toEqual({ competitorId: '00000000-0000-4000-8000-000000000011' })
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'competitor.created',
        entityType: 'competitor',
      })
    )
  })
})

describe('updateCompetitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates an owner and writes an audit log', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: existingCompetitorId, display_name: 'Updated Farm' },
      error: null,
    })

    createExtendedClient.mockResolvedValue({
      from: vi.fn(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle,
              }),
            }),
          }),
        }),
      })),
    })

    const result = await updateCompetitor('actor-1', {
      id: existingCompetitorId,
      displayName: 'Updated Farm',
      contactNumber: '+639171234567',
      email: 'farm@example.com',
      address: 'Cebu',
      notes: undefined,
    })

    expect(result).toEqual({})
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'competitor.updated',
        entityType: 'competitor',
      })
    )
  })
})

describe('softDeleteCompetitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks delete when entries are linked', async () => {
    vi.mocked(countEntriesForCompetitor).mockResolvedValue(2)

    const result = await softDeleteCompetitor('actor-1', {
      id: existingCompetitorId,
    })

    expect(result.error).toContain('2 event entries')
    expect(createExtendedClient).not.toHaveBeenCalled()
  })

  it('soft deletes an owner when no entries are linked', async () => {
    vi.mocked(countEntriesForCompetitor).mockResolvedValue(0)

    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: existingCompetitorId, display_name: 'Farm To Delete' },
      error: null,
    })

    createExtendedClient.mockResolvedValue({
      from: vi.fn(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle,
              }),
            }),
          }),
        }),
      })),
    })

    const result = await softDeleteCompetitor('actor-1', {
      id: existingCompetitorId,
    })

    expect(result).toEqual({})
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'competitor.deleted',
        entityType: 'competitor',
      })
    )
  })
})
