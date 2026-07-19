import { describe, expect, it } from 'vitest'

import type { EventFeeSettings } from '@/features/events/fee-utils'
import {
  classifyCashierQuery,
  computeOutstandingDues,
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
  it('returns full dues when nothing paid', () => {
    const result = computeOutstandingDues(settings, 2, {})

    expect(result.totalOutstanding).toBe(500 + 400 + 1000)
    expect(result.suggestedCategory).toBe('registration')
    expect(result.suggestedAmount).toBe(500)
    expect(result.lines).toHaveLength(3)
  })

  it('skips fully paid categories and suggests the next open line', () => {
    const result = computeOutstandingDues(settings, 2, {
      registration: 500,
      rooster_entry: 100,
    })

    expect(result.suggestedCategory).toBe('rooster_entry')
    expect(result.suggestedAmount).toBe(300)
    expect(result.totalOutstanding).toBe(300 + 1000)
  })

  it('includes positive fee-adjustment collect amounts', () => {
    const result = computeOutstandingDues(settings, 1, { registration: 500 }, 200, 50)

    const adjustment = result.lines.find((line) => line.category === 'adjustment')
    expect(adjustment?.outstanding).toBe(150)
    expect(result.totalOutstanding).toBe(200 + 1000 + 150)
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
    expect(classifyCashierQuery('  Farm Luna  ', eventId)).toEqual({
      kind: 'search',
      value: 'Farm Luna',
    })
  })
})
