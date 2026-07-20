import { describe, expect, it } from 'vitest'

import { groupPaymentsForLedger } from '@/features/payments/ledger-grouping'
import type { PaymentLedgerItem } from '@/features/payments/types'

function makePayment(
  overrides: Partial<PaymentLedgerItem> & Pick<PaymentLedgerItem, 'id' | 'paymentCategory'>
): PaymentLedgerItem {
  return {
    paymentReference: `PAY-TEST-${overrides.id}`,
    entryId: 'entry-1',
    entryNumber: '1',
    entryName: 'Farm A',
    ownerName: 'Owner A',
    amountDue: 500,
    amountPaid: 500,
    amountTendered: 500,
    changeGiven: 0,
    balance: 0,
    paymentMethod: 'cash',
    receiptNumber: null,
    paymentStatus: 'paid',
    paidAt: '2026-07-20T10:00:00.000Z',
    notes: null,
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: '2026-07-20T10:00:00.000Z',
    cashierSessionId: 'session-1',
    cashierName: 'Cashier',
    collectionBatchId: null,
    refundBatchId: null,
    refundedAmount: null,
    matchId: null,
    fightSide: null,
    fightNumber: null,
    betBarcode: null,
    ...overrides,
  }
}

describe('groupPaymentsForLedger', () => {
  it('groups registration dues payments into one row with ordered item labels', () => {
    const batchId = 'batch-1'
    const payments = [
      makePayment({
        id: 'p1',
        paymentCategory: 'registration',
        amountPaid: 500,
        collectionBatchId: batchId,
      }),
      makePayment({
        id: 'p2',
        paymentCategory: 'rooster_entry',
        amountPaid: 400,
        collectionBatchId: batchId,
      }),
      makePayment({
        id: 'p3',
        paymentCategory: 'cash_bond',
        amountPaid: 1000,
        collectionBatchId: batchId,
      }),
    ]

    const rows = groupPaymentsForLedger(payments)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.rowKind).toBe('collection')
    expect(rows[0]?.isBatch).toBe(true)
    expect(rows[0]?.amountPaid).toBe(1900)
    expect(rows[0]?.itemsPaid).toEqual([
      'Registration fee',
      'Rooster entry fee',
      'Cash bond',
    ])
    expect(rows[0]?.childPayments).toHaveLength(3)
  })

  it('keeps non-batch payments as standalone rows', () => {
    const payments = [
      makePayment({
        id: 'p4',
        paymentCategory: 'adjustment',
        amountPaid: 200,
      }),
    ]

    const rows = groupPaymentsForLedger(payments)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.rowKind).toBe('collection')
    expect(rows[0]?.isBatch).toBe(false)
    expect(rows[0]?.itemsPaid).toEqual(['Fee adjustment'])
  })

  it('keeps collection rows unchanged and adds a separate refund batch row', () => {
    const batchId = 'batch-2'
    const refundBatchId = 'refund-batch-1'
    const payments = [
      makePayment({
        id: 'p5',
        paymentCategory: 'registration',
        amountPaid: 500,
        collectionBatchId: batchId,
      }),
      makePayment({
        id: 'p6',
        paymentCategory: 'cash_bond',
        amountPaid: 0,
        paymentStatus: 'refunded',
        refundedAmount: 1000,
        refundBatchId,
        collectionBatchId: batchId,
        updatedAt: '2026-07-20T12:00:00.000Z',
      }),
    ]

    const rows = groupPaymentsForLedger(payments)
    expect(rows).toHaveLength(2)

    const collectionRow = rows.find((row) => row.rowKind === 'collection')
    const refundRow = rows.find((row) => row.rowKind === 'refund')

    expect(collectionRow?.refundBatchId).toBeNull()
    expect(collectionRow?.amountPaid).toBe(1500)
    expect(collectionRow?.itemsPaid).toEqual(['Registration fee', 'Cash bond'])
    expect(collectionRow?.paymentStatus).toBe('paid')

    expect(refundRow?.refundBatchId).toBe(refundBatchId)
    expect(refundRow?.amountRefunded).toBe(1000)
    expect(refundRow?.itemsPaid).toEqual(['Cash bond (refunded)'])
    expect(refundRow?.paidAt).toBe('2026-07-20T12:00:00.000Z')
  })
})
