import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { writeAuditLog, createClient, postRevolvingFundLedgerEntry } = vi.hoisted(() => ({
  writeAuditLog: vi.fn(),
  createClient: vi.fn(),
  postRevolvingFundLedgerEntry: vi.fn(),
}))

vi.mock('@/features/audit/service', () => ({ writeAuditLog }))
vi.mock('@/features/inspection/service', () => ({
  promoteInspectionClearedAfterPayment: vi.fn(),
}))
vi.mock('@/features/revolving-fund/service', () => ({
  postRevolvingFundLedgerEntry,
}))
vi.mock('@/lib/supabase/server', () => ({ createClient }))

import { refundPayment } from '@/features/payments/service'

const eventId = '00000000-0000-4000-8000-000000000001'
const entryId = '00000000-0000-4000-8000-000000000002'
const paymentId = '00000000-0000-4000-8000-000000000003'
const actorId = '00000000-0000-4000-8000-000000000099'

type PaymentRow = {
  id: string
  payment_reference: string
  entry_id: string
  event_id: string
  amount_due: number
  amount_paid: number
  payment_status: string
  amount_tendered: number | null
  change_given: number | null
  payment_category: string
}

function setupSupabaseMock(paymentRow: PaymentRow) {
  let capturedPaymentUpdate: Record<string, unknown> | null = null

  const from = vi.fn((table: string) => {
    if (table === 'payments') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((_col: string, value: string) => {
            if (value === paymentId) {
              return {
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: paymentRow, error: null }),
                }),
              }
            }

            return {
              neq: vi.fn().mockResolvedValue({
                data: [{ amount_paid: 0, payment_status: 'refunded' }],
                error: null,
              }),
            }
          }),
        }),
        update: vi.fn((payload: Record<string, unknown>) => {
          capturedPaymentUpdate = payload
          return {
            eq: vi.fn().mockResolvedValue({ error: null }),
          }
        }),
      }
    }

    if (table === 'entries') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { fee_snapshot: null },
                error: null,
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }
    }

    if (table === 'events') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
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
      }
    }

    if (table === 'rooster_event_registrations') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            count: 0,
            error: null,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }
    }

    throw new Error(`Unexpected table: ${table}`)
  })

  vi.mocked(createClient).mockResolvedValue({ from } as never)

  return {
    getCapturedPaymentUpdate: () => capturedPaymentUpdate,
  }
}

describe('refundPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(postRevolvingFundLedgerEntry).mockResolvedValue({})
  })

  it('clears tender fields when refunding a payment collected with cash change', async () => {
    const { getCapturedPaymentUpdate } = setupSupabaseMock({
      id: paymentId,
      payment_reference: 'PAY-0001',
      entry_id: entryId,
      event_id: eventId,
      amount_due: 10000,
      amount_paid: 10000,
      payment_status: 'paid',
      amount_tendered: 15000,
      change_given: 5000,
      payment_category: 'match_bet',
    })

    const result = await refundPayment(actorId, {
      paymentId,
      eventId,
      reason: 'Wrong side paid',
    })

    expect(result.error).toBeUndefined()
    expect(getCapturedPaymentUpdate()).toEqual({
      payment_status: 'refunded',
      balance: 10000,
      amount_paid: 0,
      amount_tendered: null,
      change_given: null,
    })
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        oldValues: expect.objectContaining({
          amount_paid: 10000,
          amount_tendered: 15000,
          change_given: 5000,
          payment_category: 'match_bet',
        }),
      })
    )
    expect(postRevolvingFundLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -10000,
        entryType: 'refund',
      })
    )
  })

  it('refunds payments that never stored tender fields', async () => {
    const { getCapturedPaymentUpdate } = setupSupabaseMock({
      id: paymentId,
      payment_reference: 'PAY-0002',
      entry_id: entryId,
      event_id: eventId,
      amount_due: 500,
      amount_paid: 500,
      payment_status: 'paid',
      amount_tendered: null,
      change_given: null,
      payment_category: 'entry_fees',
    })

    const result = await refundPayment(actorId, {
      paymentId,
      eventId,
      reason: 'Duplicate payment',
    })

    expect(result.error).toBeUndefined()
    expect(getCapturedPaymentUpdate()).toEqual({
      payment_status: 'refunded',
      balance: 500,
      amount_paid: 0,
      amount_tendered: null,
      change_given: null,
    })
  })
})
