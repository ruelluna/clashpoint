import { describe, expect, it } from 'vitest'

import { buildRefundBatchReceiptLine } from '@/features/payments/batch-refund-receipt'

describe('buildRefundBatchReceiptLine', () => {
  it('marks a fully refunded cash bond line as refunded', () => {
    const line = buildRefundBatchReceiptLine('cash_bond', 1000, 1000, 1000)

    expect(line.amountRefunded).toBe(1000)
    expect(line.remainingCollected).toBe(0)
    expect(line.lineBalance).toBe(1000)
    expect(line.lineStatus).toBe('refunded')
  })

  it('keeps non-refunded lines paid when nothing was refunded', () => {
    const line = buildRefundBatchReceiptLine('registration', 500, 500, 0)

    expect(line.remainingCollected).toBe(500)
    expect(line.lineBalance).toBe(0)
    expect(line.lineStatus).toBe('paid')
  })
})
