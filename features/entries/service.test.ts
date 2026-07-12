import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { writeAuditLog, createClient } = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
  createClient: vi.fn(),
}))

vi.mock('@/features/audit/service', () => ({
  writeAuditLog,
}))

vi.mock('@/features/entries/queries', () => ({
  entryHasMatchReferences: vi.fn(),
  getPairedRosterIdsForEntry: vi.fn(),
  listEntryNumbersForEvent: vi.fn(),
}))

vi.mock('@/features/events/queries', () => ({
  getEvent: vi.fn(),
}))

vi.mock('@/features/weighing/service', () => ({
  createRoosterForEntry: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient,
}))

import {
  entryHasMatchReferences,
  getPairedRosterIdsForEntry,
} from '@/features/entries/queries'
import { deleteEntry, updateEntryRoosters } from '@/features/entries/service'
import { getEvent } from '@/features/events/queries'

const eventId = '00000000-0000-4000-8000-000000000001'
const entryId = '00000000-0000-4000-8000-000000000002'
const roosterId = '00000000-0000-4000-8000-000000000003'

describe('deleteEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks delete when entry is referenced by a match', async () => {
    vi.mocked(entryHasMatchReferences).mockResolvedValue(true)

    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: entryId,
                    event_id: eventId,
                    entry_number: '001',
                    entry_name: 'Team Alpha',
                  },
                }),
              }),
            }),
          }),
        }),
      })),
    })

    const result = await deleteEntry('actor-1', { eventId, entryId })

    expect(result.error).toBe('Entry is in a match and cannot be deleted')
    expect(writeAuditLog).not.toHaveBeenCalled()
  })
})

describe('updateEntryRoosters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips roosters that are already paired in a match', async () => {
    vi.mocked(getPairedRosterIdsForEntry).mockResolvedValue(new Set([roosterId]))
    vi.mocked(getEvent).mockResolvedValue({
      id: eventId,
      min_weight: 2,
      max_weight: 2.5,
    } as Awaited<ReturnType<typeof getEvent>>)

    const update = vi.fn()
    createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({ eq: vi.fn() }),
        update,
      })),
    })

    const result = await updateEntryRoosters('actor-1', eventId, entryId, [
      {
        roosterId,
        bandNumber: 'B-200',
        weight: 2.1,
        category: undefined,
        colorMarking: undefined,
        bandOrganization: undefined,
        bandSeason: undefined,
      },
    ])

    expect(result.error).toBeUndefined()
    expect(update).not.toHaveBeenCalled()
    expect(writeAuditLog).not.toHaveBeenCalled()
  })
})
