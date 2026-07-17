import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { writeAuditLog, createExtendedClient, getRegistrationForEvent } = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
  createExtendedClient: vi.fn(),
  getRegistrationForEvent: vi.fn(),
}))

vi.mock('@/features/audit/service', () => ({ writeAuditLog }))
vi.mock('@/features/registrations/queries', () => ({ getRegistrationForEvent }))
vi.mock('@/lib/supabase/extended', () => ({ createExtendedClient }))

import {
  promoteInspectionClearedAfterPayment,
  recordInspection,
} from '@/features/inspection/service'

const eventId = '00000000-0000-4000-8000-000000000001'
const registrationId = '00000000-0000-4000-8000-000000000002'
const actorId = '00000000-0000-4000-8000-000000000099'

function chain(resolver: () => unknown) {
  const builder: Record<string, unknown> = {}
  const self = () => builder
  for (const method of ['select', 'eq', 'update', 'insert']) {
    builder[method] = vi.fn(self)
  }
  builder.maybeSingle = vi.fn(resolver)
  builder.single = vi.fn(resolver)
  return builder
}

describe('recordInspection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks pass when weight is not verified', async () => {
    vi.mocked(getRegistrationForEvent).mockResolvedValue({
      id: registrationId,
      event_id: eventId,
      registration_status: 'pending_inspection',
      reg_payment_status: 'not_required',
      weight_verified: false,
    } as never)

    const result = await recordInspection(actorId, {
      eventId,
      registrationId,
      inspectionStatus: 'passed',
    })

    expect(result.error).toBe('Official weight must be verified before inspection can pass')
  })

  it('promotes to conditionally_approved when inspection passes but payment is unpaid', async () => {
    vi.mocked(getRegistrationForEvent).mockResolvedValue({
      id: registrationId,
      event_id: eventId,
      registration_status: 'pending_inspection',
      reg_payment_status: 'unpaid',
      weight_verified: true,
    } as never)

    const registrationUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    const from = vi.fn((table: string) => {
      if (table === 'physical_inspections') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'inspection-1' }, error: null }),
            }),
          }),
        }
      }

      if (table === 'rooster_event_registrations') {
        return { update: registrationUpdate }
      }

      if (table === 'weighings') {
        return chain(() =>
          Promise.resolve({
            data: { weight_status: 'passed', verified_at: '2026-07-17T10:00:00.000Z' },
            error: null,
          })
        )
      }

      return chain(() => Promise.resolve({ data: null, error: null }))
    })

    createExtendedClient.mockResolvedValue({ from })

    const result = await recordInspection(actorId, {
      eventId,
      registrationId,
      inspectionStatus: 'passed',
    })

    expect(result.error).toBeUndefined()
    expect(registrationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        inspection_status: 'passed',
        registration_status: 'conditionally_approved',
        approval_status: 'conditionally_approved',
        eligibility_status: 'conditionally_eligible',
        status: 'verified',
      })
    )
  })

  it('promotes to approved when inspection passes and payment is not required', async () => {
    vi.mocked(getRegistrationForEvent).mockResolvedValue({
      id: registrationId,
      event_id: eventId,
      registration_status: 'pending_inspection',
      reg_payment_status: 'not_required',
      weight_verified: true,
    } as never)

    const registrationUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })

    const from = vi.fn((table: string) => {
      if (table === 'physical_inspections') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'inspection-1' }, error: null }),
            }),
          }),
        }
      }

      if (table === 'rooster_event_registrations') {
        return { update: registrationUpdate }
      }

      if (table === 'weighings') {
        return chain(() =>
          Promise.resolve({
            data: { weight_status: 'passed', verified_at: '2026-07-17T10:00:00.000Z' },
            error: null,
          })
        )
      }

      return chain(() => Promise.resolve({ data: null, error: null }))
    })

    createExtendedClient.mockResolvedValue({ from })

    const result = await recordInspection(actorId, {
      eventId,
      registrationId,
      inspectionStatus: 'passed',
    })

    expect(result.error).toBeUndefined()
    expect(registrationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        registration_status: 'approved',
        approval_status: 'approved',
        eligibility_status: 'eligible',
      })
    )
  })
})

describe('promoteInspectionClearedAfterPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('promotes conditionally approved passed inspections to approved after payment', async () => {
    const registrationUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const from = vi.fn((table: string) => {
      if (table === 'rooster_event_registrations') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: registrationId, registration_status: 'conditionally_approved' }],
                  error: null,
                }),
              }),
            }),
          }),
          update: registrationUpdate,
        }
      }
      return chain(() => Promise.resolve({ data: null, error: null }))
    })

    createExtendedClient.mockResolvedValue({ from })

    await promoteInspectionClearedAfterPayment('entry-1')

    expect(registrationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        registration_status: 'approved',
        approval_status: 'approved',
        eligibility_status: 'eligible',
        status: 'verified',
      })
    )
  })
})
