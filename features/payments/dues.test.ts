import { describe, expect, it } from 'vitest'

import type { EventFeeSettings } from '@/features/events/fee-utils'
import {
  classifyCashierQuery,
  computeOutstandingDues,
  getCashierPaymentCategoryOptions,
  getEntryFeesOutstanding,
  splitEntryFeesPayment,
} from '@/features/payments/dues'

const settings: EventFeeSettings = {
  registrationFeeEnabled: true,
  registrationFeeAmount: 500,
  roosterEntryFeeEnabled: true,
  roosterEntryFeeAmount: 200,
  cashBondEnabled: true,
  cashBondAmount: 1000,
}

describe('computeOutstandingDues', () => {
  it('returns full dues when nothing paid and suggests combined entry-fee amount', () => {
    const result = computeOutstandingDues(settings, 2, {})

    expect(result.totalOutstanding).toBe(500 + 400 + 1000)
    expect(result.suggestedCategory).toBeNull()
    expect(result.suggestedAmount).toBe(900)
    expect(result.lines).toHaveLength(3)
    expect(getEntryFeesOutstanding(result.lines)).toBe(900)
  })

  it('allocates legacy entry_fees payments to registration first then rooster entry', () => {
    const result = computeOutstandingDues(settings, 2, {
      entry_fees: 600,
    })

    const registration = result.lines.find((line) => line.category === 'registration')
    const rooster = result.lines.find((line) => line.category === 'rooster_entry')

    expect(registration?.outstanding).toBe(0)
    expect(registration?.amountPaid).toBe(500)
    expect(rooster?.outstanding).toBe(300)
    expect(rooster?.amountPaid).toBe(100)
    expect(result.suggestedCategory).toBeNull()
    expect(result.suggestedAmount).toBe(300)
  })

  it('combines direct category payments with legacy entry_fees allocation', () => {
    const result = computeOutstandingDues(settings, 2, {
      registration: 500,
      rooster_entry: 100,
      entry_fees: 200,
    })

    const rooster = result.lines.find((line) => line.category === 'rooster_entry')
    expect(rooster?.outstanding).toBe(100)
    expect(rooster?.amountPaid).toBe(300)
  })

  it('skips fully paid entry fees and suggests cash bond next', () => {
    const result = computeOutstandingDues(settings, 2, {
      registration: 500,
      rooster_entry: 400,
    })

    expect(result.suggestedCategory).toBe('cash_bond')
    expect(result.suggestedAmount).toBe(1000)
    expect(result.totalOutstanding).toBe(1000)
  })

  it('includes positive fee-adjustment collect amounts', () => {
    const result = computeOutstandingDues(settings, 1, { registration: 500, rooster_entry: 200 }, 200, 50)

    const adjustment = result.lines.find((line) => line.category === 'adjustment')
    expect(adjustment?.outstanding).toBe(150)
    expect(result.totalOutstanding).toBe(1000 + 150)
    expect(result.suggestedCategory).toBe('cash_bond')
  })

  it('returns zero outstanding when all categories are paid', () => {
    const result = computeOutstandingDues(settings, 1, {
      registration: 500,
      rooster_entry: 200,
      cash_bond: 1000,
    })

    expect(result.totalOutstanding).toBe(0)
    expect(result.suggestedCategory).toBeNull()
  })
})

describe('splitEntryFeesPayment', () => {
  it('applies registration first then rooster entry for partial payments', () => {
    const dues = computeOutstandingDues(settings, 2, {})

    expect(splitEntryFeesPayment(600, dues.lines)).toEqual({
      registration: 500,
      rooster_entry: 100,
    })
  })

  it('allocates only to registration when amount covers registration only', () => {
    const dues = computeOutstandingDues(settings, 2, {})

    expect(splitEntryFeesPayment(500, dues.lines)).toEqual({
      registration: 500,
      rooster_entry: 0,
    })
  })

  it('allocates across both categories for full payment', () => {
    const dues = computeOutstandingDues(settings, 2, {})

    expect(splitEntryFeesPayment(900, dues.lines)).toEqual({
      registration: 500,
      rooster_entry: 400,
    })
  })
})

describe('getCashierPaymentCategoryOptions', () => {
  it('excludes entry fees and only offers bond or adjustment', () => {
    const dues = computeOutstandingDues(settings, 2, {})
    const options = getCashierPaymentCategoryOptions(dues)

    expect(options.map((option) => option.category)).toEqual(['cash_bond'])
  })

  it('returns only bond when entry fees are paid', () => {
    const dues = computeOutstandingDues(settings, 2, {
      registration: 500,
      rooster_entry: 400,
    })
    const options = getCashierPaymentCategoryOptions(dues)

    expect(options.map((option) => option.category)).toEqual(['cash_bond'])
  })
})

describe('classifyCashierQuery', () => {
  const eventId = '00000000-0000-4000-8000-000000000001'

  it('classifies OWN barcode for this event', () => {
    expect(classifyCashierQuery('own-00000000-0003', eventId)).toEqual({
      kind: 'owner_barcode',
      value: 'OWN-00000000-0003',
    })
  })

  it('classifies COCK barcode for this event', () => {
    expect(classifyCashierQuery('COCK-00000000-0007', eventId)).toEqual({
      kind: 'cock_barcode',
      value: 'COCK-00000000-0007',
    })
  })

  it('treats wrong-event barcode prefixes as search text', () => {
    expect(classifyCashierQuery('OWN-ABCDEF12-0001', eventId).kind).toBe('search')
  })

  it('classifies free text as search', () => {
    expect(classifyCashierQuery('Smith Farm', eventId)).toEqual({
      kind: 'search',
      value: 'Smith Farm',
    })
  })
})
