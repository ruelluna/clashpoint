import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { writeAuditLog, createClient, createExtendedClient } = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
  createClient: vi.fn(),
  createExtendedClient: vi.fn(),
}))

vi.mock('@/features/audit/service', () => ({
  writeAuditLog,
}))

vi.mock('@/features/entries/queries', () => ({
  entryHasMatchReferences: vi.fn(),
  getPairedRosterIdsForEntry: vi.fn(),
  listEntryNumbersForEvent: vi.fn(),
  listOwnerBarcodesForEvent: vi.fn(),
}))

vi.mock('@/lib/supabase/extended', () => ({
  createExtendedClient,
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
  listEntryNumbersForEvent,
  listOwnerBarcodesForEvent,
} from '@/features/entries/queries'
import { createEntry, deleteEntry, updateEntryRoosters } from '@/features/entries/service'
import { getEvent } from '@/features/events/queries'

const eventId = '00000000-0000-4000-8000-000000000001'
const entryId = '00000000-0000-4000-8000-000000000002'
const roosterId = '00000000-0000-4000-8000-000000000003'
const newEntryId = '00000000-0000-4000-8000-000000000004'

describe('createEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listEntryNumbersForEvent).mockResolvedValue([])
    vi.mocked(listOwnerBarcodesForEvent).mockResolvedValue([])
  })

  it('assigns owner barcode for classic events without fee snapshot', async () => {
    const insertEntry = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: newEntryId },
          error: null,
        }),
      }),
    })

    const from = vi.fn((table: string) => {
      if (table === 'events') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: eventId,
                    name: 'Classic Open',
                    status: 'open',
                    max_entries: null,
                    registration_deadline: null,
                    event_type: 'classic',
                    entry_fee: 0,
                    registration_fee_enabled: false,
                    registration_fee_amount: 0,
                    rooster_entry_fee_enabled: false,
                    rooster_entry_fee_amount: 0,
                    cash_bond_enabled: false,
                    cash_bond_amount: 0,
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }
      }

      if (table === 'entries') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          insert: insertEntry,
        }
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }
    })

    createClient.mockResolvedValue({ from })
    createExtendedClient.mockResolvedValue({ from })

    const result = await createEntry('actor-1', {
      eventId,
      ownerName: 'Classic Farm',
      entrySource: 'staff_encoded',
    })

    expect(result.error).toBeUndefined()
    expect(result.ownerBarcode).toMatch(/^OWN-/)
    expect(insertEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_barcode: expect.stringMatching(/^OWN-/),
        fee_snapshot: null,
      })
    )
  })
})

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
      min_weight_grams: 2000,
      max_weight_grams: 2500,
      min_weight: null,
      max_weight: null,
      event_type: 'classic',
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
        entryName: 'Rooster',
        bandNumber: 'B-200',
        weight: 2100,
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
