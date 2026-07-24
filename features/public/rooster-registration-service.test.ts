import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const {
  addEntryRoosters,
  getEntryFormEligibilityContext,
  getPublicRegistrationEvent,
  getPublicRegistrationEntryContext,
  getPublicRegistrationSession,
  setPublicRegistrationReceiptSession,
  clearPublicRegistrationSession,
  getPublicReferenceOptions,
  createAdminClient,
} = vi.hoisted(() => ({
  addEntryRoosters: vi.fn(),
  getEntryFormEligibilityContext: vi.fn(),
  getPublicRegistrationEvent: vi.fn(),
  getPublicRegistrationEntryContext: vi.fn(),
  getPublicRegistrationSession: vi.fn(),
  setPublicRegistrationReceiptSession: vi.fn(),
  clearPublicRegistrationSession: vi.fn(),
  getPublicReferenceOptions: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/features/entries/service', () => ({ addEntryRoosters }))
vi.mock('@/features/eligibility/registration-bridge', () => ({
  getEntryFormEligibilityContext,
  toPolicyValidationContext: vi.fn((ctx) => ctx),
}))
vi.mock('@/features/public/queries', () => ({ getPublicRegistrationEvent }))
vi.mock('@/features/public/owner-registration-service', () => ({
  getPublicRegistrationEntryContext,
}))
vi.mock('@/features/public/session-cookie', () => ({
  getPublicRegistrationSession,
  setPublicRegistrationReceiptSession,
  clearPublicRegistrationSession,
}))
vi.mock('@/features/reference-values/catalog', () => ({ getPublicReferenceOptions }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient }))

import { createPublicRoostersForEntry } from '@/features/public/rooster-registration-service'

const eventId = '00000000-0000-4000-8000-000000000001'
const entryId = '00000000-0000-4000-8000-000000000002'
const competitorId = '00000000-0000-4000-8000-000000000003'
const registrationId = '00000000-0000-4000-8000-000000000004'
const registryId = '00000000-0000-4000-8000-000000000005'

describe('createPublicRoostersForEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPublicRegistrationSession.mockResolvedValue({
      eventId,
      entryId,
      competitorId,
      exp: Date.now() + 60_000,
    })
    getPublicRegistrationEvent.mockResolvedValue({
      id: eventId,
      name: 'Public Derby',
      event_type: 'derby',
      cocks_per_entry: 1,
      registration_open: true,
    })
    getPublicRegistrationEntryContext.mockResolvedValue({
      entryId,
      entryNumber: '001',
      competitorId,
      roosterCount: 0,
      cocksPerEntry: 1,
      eventType: 'derby',
    })
    getEntryFormEligibilityContext.mockResolvedValue(null)
    getPublicReferenceOptions.mockResolvedValue({
      allowBreedAdd: false,
      allowColorAdd: false,
    })
    addEntryRoosters.mockResolvedValue({ roosterIds: [registrationId] })
  })

  it('returns owner and cock barcodes and sets a receipt session', async () => {
    const entriesMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: entryId,
        entry_number: '001',
        owner_barcode: 'OWN-00000000-0001',
        owner_name: 'Farm Alpha',
        contact_full_name: 'Juan Dela Cruz',
        contact_designation: 'Manager',
      },
      error: null,
    })
    const registrationsOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: registrationId,
          band_number: 'B-100',
          cock_entry_barcode: 'COCK-00000000-0001',
          registry_rooster_id: registryId,
        },
      ],
      error: null,
    })
    const roostersIn = vi.fn().mockResolvedValue({
      data: [{ id: registryId, name: 'Thunder' }],
      error: null,
    })

    createAdminClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'entries') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: entriesMaybeSingle,
              }),
            }),
          }
        }
        if (table === 'rooster_event_registrations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: registrationsOrder,
              }),
            }),
          }
        }
        if (table === 'roosters') {
          return {
            select: vi.fn().mockReturnValue({
              in: roostersIn,
            }),
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const result = await createPublicRoostersForEntry({
      eventId,
      roosters: [
        {
          cockIndex: 1,
          entryName: 'Thunder',
          bandNumber: 'B-100',
          weight: 2000,
          handlerName: 'Handler',
          breed: 'Kelso',
          colorMarking: 'Red',
          notes: undefined,
        },
      ],
    })

    expect(result.error).toBeUndefined()
    expect(result.entryNumber).toBe('001')
    expect(result.ownerBarcode).toBe('OWN-00000000-0001')
    expect(result.ownerName).toBe('Farm Alpha')
    expect(result.bandNumbers).toEqual(['B-100'])
    expect(result.roosters).toEqual([
      {
        registrationId,
        entryName: 'Thunder',
        bandNumber: 'B-100',
        cockEntryBarcode: 'COCK-00000000-0001',
      },
    ])
    expect(setPublicRegistrationReceiptSession).toHaveBeenCalledWith({
      eventId,
      entryId,
      competitorId,
    })
    expect(clearPublicRegistrationSession).toHaveBeenCalled()
  })
})
