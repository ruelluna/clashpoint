import { describe, expect, it } from 'vitest'

import type { EventFeeSettings } from '@/features/events/fee-utils'
import {
  aggregateAdjustmentCollectDue,
  aggregatePaidByCategoryForEntries,
  aggregateRoosterCounts,
  buildCashierSelectableEntry,
  type EventFeeRow,
} from '@/features/payments/cashier-selectable'

const eventFeeRow: EventFeeRow = {
  entry_fee: 0,
  registration_fee_enabled: true,
  registration_fee_amount: 500,
  rooster_entry_fee_enabled: true,
  rooster_entry_fee_amount: 200,
  cash_bond_enabled: true,
  cash_bond_amount: 1000,
}

const feeSnapshot: EventFeeSettings = {
  registrationFeeEnabled: true,
  registrationFeeAmount: 500,
  roosterEntryFeeEnabled: true,
  roosterEntryFeeAmount: 200,
  cashBondEnabled: true,
  cashBondAmount: 1000,
}

const baseSource = {
  id: '00000000-0000-4000-8000-000000000001',
  entryNumber: '001',
  entryName: 'Farm A',
  ownerName: 'Owner A',
  feeSnapshot: null as EventFeeSettings | null,
  roosterCount: 2,
  paidByCategory: {},
  adjustmentCollectDue: 0,
  adjustmentPaid: 0,
}

describe('buildCashierSelectableEntry', () => {
  it('includes entries with registration and rooster fees outstanding', () => {
    const result = buildCashierSelectableEntry(eventFeeRow, baseSource)

    expect(result).toEqual({
      id: baseSource.id,
      entryNumber: '001',
      entryName: 'Farm A',
      ownerName: 'Owner A',
      totalOutstanding: 1900,
    })
  })

  it('includes entries with cash bond outstanding after entry fees are paid', () => {
    const result = buildCashierSelectableEntry(eventFeeRow, {
      ...baseSource,
      paidByCategory: {
        registration: 500,
        rooster_entry: 400,
      },
    })

    expect(result?.totalOutstanding).toBe(1000)
  })

  it('excludes fully paid entries', () => {
    const result = buildCashierSelectableEntry(eventFeeRow, {
      ...baseSource,
      roosterCount: 1,
      paidByCategory: {
        registration: 500,
        rooster_entry: 200,
        cash_bond: 1000,
      },
    })

    expect(result).toBeNull()
  })

  it('excludes entries when no fees are configured', () => {
    const result = buildCashierSelectableEntry(
      {
        entry_fee: 0,
        registration_fee_enabled: false,
        registration_fee_amount: 0,
        rooster_entry_fee_enabled: false,
        rooster_entry_fee_amount: 0,
        cash_bond_enabled: false,
        cash_bond_amount: 0,
      },
      baseSource
    )

    expect(result).toBeNull()
  })

  it('respects entry fee snapshots', () => {
    const result = buildCashierSelectableEntry(eventFeeRow, {
      ...baseSource,
      feeSnapshot,
      roosterCount: 1,
    })

    expect(result?.totalOutstanding).toBe(1700)
  })
})

describe('cashier selectable aggregators', () => {
  it('groups paid amounts by entry and category', () => {
    const map = aggregatePaidByCategoryForEntries([
      {
        entry_id: 'entry-a',
        payment_category: 'registration',
        amount_paid: 500,
      },
      {
        entry_id: 'entry-a',
        payment_category: 'rooster_entry',
        amount_paid: 100,
      },
    ])

    expect(map.get('entry-a')).toEqual({
      registration: 500,
      rooster_entry: 100,
    })
  })

  it('counts roosters per entry', () => {
    const map = aggregateRoosterCounts([
      { entry_id: 'entry-a' },
      { entry_id: 'entry-a' },
      { entry_id: 'entry-b' },
    ])

    expect(map.get('entry-a')).toBe(2)
    expect(map.get('entry-b')).toBe(1)
  })

  it('sums positive adjustment deltas per entry', () => {
    const map = aggregateAdjustmentCollectDue([
      { entry_id: 'entry-a', delta: 150 },
      { entry_id: 'entry-a', delta: -50 },
      { entry_id: 'entry-b', delta: 75 },
    ])

    expect(map.get('entry-a')).toBe(150)
    expect(map.get('entry-b')).toBe(75)
  })
})
