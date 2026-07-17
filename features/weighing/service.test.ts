import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { writeAuditLog, createClient, createExtendedClient } = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
  createClient: vi.fn(),
  createExtendedClient: vi.fn(),
}))

vi.mock('@/features/audit/service', () => ({ writeAuditLog }))
vi.mock('@/features/eligibility/registration-bridge', () => ({
  applyRegistrationEligibility: vi.fn(),
}))
vi.mock('@/features/entries/queries', () => ({
  listCockEntryBarcodesForEvent: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/features/events/queries', () => ({
  getEvent: vi.fn(),
}))
vi.mock('@/features/roosters/service', () => ({
  createRooster: vi.fn(),
}))
vi.mock('@/features/reference-values/service', () => ({
  resolveEntryReferenceValues: vi.fn().mockResolvedValue({
    breed: 'Talisayon',
    colorMarking: 'Black',
    bloodline: undefined,
  }),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient }))
vi.mock('@/lib/supabase/extended', () => ({ createExtendedClient }))

import { getEvent } from '@/features/events/queries'
import { createRooster } from '@/features/roosters/service'
import { createRoosterForEntry, recordAndVerifyWeightFromGrams } from '@/features/weighing/service'

const eventId = '00000000-0000-4000-8000-000000000001'
const entryId = '00000000-0000-4000-8000-000000000002'
const registrationId = '00000000-0000-4000-8000-000000000003'

function chain(resolver: () => unknown) {
  const builder: Record<string, unknown> = {}
  const self = () => builder
  for (const method of [
    'select',
    'eq',
    'ilike',
    'is',
    'in',
    'order',
    'insert',
    'update',
    'delete',
  ]) {
    builder[method] = vi.fn(self)
  }
  builder.maybeSingle = vi.fn(resolver)
  builder.single = vi.fn(resolver)
  return builder
}

describe('createRoosterForEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates submitted registration with unpaid entry fee when inspection is not required', async () => {
    vi.mocked(getEvent).mockResolvedValue({
      id: eventId,
      event_type: 'classic',
      cocks_per_entry: 1,
      min_weight: 1.5,
      max_weight: 2.5,
      rooster_entry_fee_enabled: true,
      require_rooster_entry_approval: false,
    } as Awaited<ReturnType<typeof getEvent>>)

    vi.mocked(createRooster).mockResolvedValue({ roosterId: 'registry-rooster-id' })

    const insertRegistration = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: registrationId },
          error: null,
        }),
      }),
    })

    const from = vi.fn((table: string) => {
      if (table === 'entries') {
        return chain(() =>
          Promise.resolve({
            data: {
              id: entryId,
              entry_number: '001',
              entry_name: 'Team Alpha',
            },
            error: null,
          })
        )
      }

      if (table === 'rooster_event_registrations') {
        return {
          select: vi.fn((columns?: string) => {
            if (columns?.includes('cock_number')) {
              return {
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }
            }
            return chain(() => Promise.resolve({ data: null, error: null }))
          }),
          insert: insertRegistration,
        }
      }

      if (table === 'events') {
        return chain(() =>
          Promise.resolve({
            data: {
              require_rooster_entry_approval: false,
              eligibility_enforcement_enabled: false,
              event_type: 'classic',
              rooster_entry_fee_enabled: true,
              physical_inspection_required: false,
              weight_verification_required: false,
            },
            error: null,
          })
        )
      }

      return chain(() => Promise.resolve({ data: null, error: null }))
    })

    createClient.mockResolvedValue({ from })
    createExtendedClient.mockResolvedValue({ from })

    const result = await createRoosterForEntry('actor-1', {
      eventId,
      entryId,
      entryName: 'Band One',
      bandNumber: 'B-001',
      weight: 2100,
    })

    expect(result.error).toBeUndefined()
    expect(result.roosterId).toBe(registrationId)
    expect(insertRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        registration_status: 'submitted',
        reg_payment_status: 'unpaid',
        weight_verified: false,
        official_weight_grams: null,
        inspection_status: 'not_required',
      })
    )
  })

  it('creates pending inspection registration when physical inspection is required', async () => {
    vi.mocked(getEvent).mockResolvedValue({
      id: eventId,
      event_type: 'classic',
      cocks_per_entry: 1,
      min_weight: 1.5,
      max_weight: 2.5,
      rooster_entry_fee_enabled: false,
      require_rooster_entry_approval: false,
    } as Awaited<ReturnType<typeof getEvent>>)

    vi.mocked(createRooster).mockResolvedValue({ roosterId: 'registry-rooster-id' })

    const insertRegistration = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: registrationId },
          error: null,
        }),
      }),
    })

    const from = vi.fn((table: string) => {
      if (table === 'entries') {
        return chain(() =>
          Promise.resolve({
            data: {
              id: entryId,
              entry_number: '001',
              entry_name: 'Team Alpha',
            },
            error: null,
          })
        )
      }

      if (table === 'rooster_event_registrations') {
        return {
          select: vi.fn((columns?: string) => {
            if (columns?.includes('cock_number')) {
              return {
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }
            }
            return chain(() => Promise.resolve({ data: null, error: null }))
          }),
          insert: insertRegistration,
        }
      }

      if (table === 'events') {
        return chain(() =>
          Promise.resolve({
            data: {
              require_rooster_entry_approval: false,
              eligibility_enforcement_enabled: false,
              event_type: 'classic',
              rooster_entry_fee_enabled: false,
              physical_inspection_required: true,
              weight_verification_required: false,
            },
            error: null,
          })
        )
      }

      return chain(() => Promise.resolve({ data: null, error: null }))
    })

    createClient.mockResolvedValue({ from })
    createExtendedClient.mockResolvedValue({ from })

    const result = await createRoosterForEntry('actor-1', {
      eventId,
      entryId,
      entryName: 'Band One',
      bandNumber: 'B-001',
      weight: 2100,
    })

    expect(result.error).toBeUndefined()
    expect(insertRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        registration_status: 'pending_inspection',
        inspection_status: 'pending',
      })
    )
  })
})

const weighingId = '00000000-0000-4000-8000-000000000005'

describe('recordAndVerifyWeightFromGrams', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records and verifies weight in grams with passed status', async () => {
    vi.mocked(getEvent).mockResolvedValue({
      id: eventId,
      min_weight_grams: 2000,
      max_weight_grams: 2500,
      min_weight: null,
      max_weight: null,
    } as Awaited<ReturnType<typeof getEvent>>)

    const insertWeighing = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: weighingId }, error: null }),
      }),
    })
    const updateRegistration = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const from = vi.fn((table: string) => {
      if (table === 'rooster_event_registrations') {
        return chain(() => ({
          data: {
            id: registrationId,
            entry_id: entryId,
            event_id: eventId,
            band_number: 'B-001',
            status: 'pending_inspection',
          },
          error: null,
        }))
      }
      if (table === 'weighings') {
        const builder = chain(() => ({ data: null, error: null }))
        builder.insert = insertWeighing
        return builder
      }
      return chain(() => ({ data: null, error: null }))
    })

    from.mockImplementation((table: string) => {
      const builder = chain(() => ({ data: null, error: null }))
      if (table === 'rooster_event_registrations') {
        builder.maybeSingle = vi.fn().mockResolvedValue({
          data: {
            id: registrationId,
            entry_id: entryId,
            event_id: eventId,
            band_number: 'B-001',
            status: 'pending_inspection',
          },
          error: null,
        })
        builder.update = updateRegistration
      }
      if (table === 'weighings') {
        builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
        builder.insert = insertWeighing
      }
      return builder
    })

    createClient.mockResolvedValue({ from })

    const result = await recordAndVerifyWeightFromGrams('actor-1', {
      eventId,
      roosterRecordId: registrationId,
      officialWeightGrams: 2100,
    })

    expect(result.error).toBeUndefined()
    expect(result.weightStatus).toBe('passed')
    expect(result.weighingId).toBe(weighingId)
    expect(writeAuditLog).toHaveBeenCalledTimes(2)
  })

  it('returns failed status when weight is out of range', async () => {
    vi.mocked(getEvent).mockResolvedValue({
      id: eventId,
      min_weight_grams: 2000,
      max_weight_grams: 2500,
      min_weight: null,
      max_weight: null,
    } as Awaited<ReturnType<typeof getEvent>>)

    const insertWeighing = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: weighingId }, error: null }),
      }),
    })

    const from = vi.fn((table: string) => {
      const builder = chain(() => ({ data: null, error: null }))
      if (table === 'rooster_event_registrations') {
        builder.maybeSingle = vi.fn().mockResolvedValue({
          data: {
            id: registrationId,
            entry_id: entryId,
            event_id: eventId,
            band_number: 'B-001',
            status: 'pending_inspection',
          },
          error: null,
        })
        builder.update = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })
      }
      if (table === 'weighings') {
        builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
        builder.insert = insertWeighing
      }
      return builder
    })

    createClient.mockResolvedValue({ from })

    const result = await recordAndVerifyWeightFromGrams('actor-1', {
      eventId,
      roosterRecordId: registrationId,
      officialWeightGrams: 1900,
    })

    expect(result.error).toBeUndefined()
    expect(result.weightStatus).toBe('failed')
  })
})
