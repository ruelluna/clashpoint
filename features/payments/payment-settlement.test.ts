import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient }))

import { updateEntryPaymentStatus } from '@/features/payments/service'

const entryId = '00000000-0000-4000-8000-000000000002'

function mockEntryPaymentTotals(totalPaid: number) {
  createClient.mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({
                data: [{ amount_paid: totalPaid, payment_status: 'paid' }],
                error: null,
              }),
            }),
          }),
        }
      }

      if (table === 'entries') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  })
}

describe('updateEntryPaymentStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an error when RLS blocks the update without raising a Supabase error', async () => {
    mockEntryPaymentTotals(500)

    const result = await updateEntryPaymentStatus(entryId, 500)

    expect(result.error).toBe('Failed to update entry payment status')
    expect(result.paymentStatus).toBeUndefined()
  })

  it('returns payment status when the entry row is updated', async () => {
    createClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'payments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({
                  data: [{ amount_paid: 500, payment_status: 'paid' }],
                  error: null,
                }),
              }),
            }),
          }
        }

        if (table === 'entries') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: entryId },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    })

    const result = await updateEntryPaymentStatus(entryId, 500)

    expect(result.error).toBeUndefined()
    expect(result.paymentStatus).toBe('paid')
  })
})
