import { describe, expect, it } from 'vitest'

import {
  batchReceiptLineStatus,
  buildBatchReceiptLine,
  deriveEntryPaymentStatus,
} from '@/features/payments/batch-receipt'

describe('buildBatchReceiptLine', () => {
  it('marks line paid when previously paid and collected clear the due amount', () => {
    const line = buildBatchReceiptLine('registration', 400, 0, 400)
    expect(line).toMatchObject({
      previouslyPaid: 0,
      amountCollected: 400,
      lineBalance: 0,
      lineStatus: 'paid',
    })
  })

  it('marks line partial when collected leaves a balance', () => {
    const line = buildBatchReceiptLine('cash_bond', 2000, 400, 1500)
    expect(line).toMatchObject({
      previouslyPaid: 400,
      amountCollected: 1500,
      lineBalance: 100,
      lineStatus: 'partial',
    })
  })

  it('shows previously paid with zero collected on follow-up receipt lines', () => {
    const line = buildBatchReceiptLine('registration', 400, 400, 0)
    expect(line.lineStatus).toBe('paid')
    expect(line.amountCollected).toBe(0)
    expect(line.previouslyPaid).toBe(400)
  })
})

describe('batchReceiptLineStatus', () => {
  it('returns unpaid when nothing has been paid', () => {
    expect(batchReceiptLineStatus(500, 0, 0)).toBe('unpaid')
  })

  it('returns partial when balance remains', () => {
    expect(batchReceiptLineStatus(2000, 400, 1500)).toBe('partial')
  })
})

describe('deriveEntryPaymentStatus', () => {
  it('returns paid when all lines are paid', () => {
    const lines = [
      buildBatchReceiptLine('registration', 400, 0, 400),
      buildBatchReceiptLine('cash_bond', 2000, 400, 1600),
    ]
    expect(deriveEntryPaymentStatus(lines)).toBe('paid')
  })

  it('returns partial when any line has a remaining balance', () => {
    const lines = [
      buildBatchReceiptLine('registration', 400, 0, 400),
      buildBatchReceiptLine('cash_bond', 2000, 0, 1500),
    ]
    expect(deriveEntryPaymentStatus(lines)).toBe('partial')
  })
})
