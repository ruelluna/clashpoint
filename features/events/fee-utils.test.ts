import { describe, expect, it } from 'vitest'

import {
  computeFeeAdjustmentLines,
  computePaymentStageAmountDue,
  computeRegistrationAmountDue,
  computeTotalEntryAmountDue,
  eventFeeSettingsFromRow,
  summarizeFeeAdjustments,
} from '@/features/events/fee-utils'

describe('eventFeeSettingsFromRow', () => {
  it('maps legacy entry_fee to registration fee when new columns absent', () => {
    const settings = eventFeeSettingsFromRow({ entry_fee: 500 })
    expect(settings.registrationFeeEnabled).toBe(true)
    expect(settings.registrationFeeAmount).toBe(500)
  })
})

describe('computeRegistrationAmountDue', () => {
  it('returns zero when disabled', () => {
    expect(
      computeRegistrationAmountDue({
        registrationFeeEnabled: false,
        registrationFeeAmount: 500,
        roosterEntryFeeEnabled: false,
        roosterEntryFeeAmount: 0,
        cashBondEnabled: false,
        cashBondAmount: 0,
      })
    ).toBe(0)
  })

  it('returns amount when enabled', () => {
    expect(
      computeRegistrationAmountDue({
        registrationFeeEnabled: true,
        registrationFeeAmount: 250,
        roosterEntryFeeEnabled: false,
        roosterEntryFeeAmount: 0,
        cashBondEnabled: false,
        cashBondAmount: 0,
      })
    ).toBe(250)
  })
})

describe('computePaymentStageAmountDue', () => {
  it('sums per-cock entry fee and cash bond', () => {
    expect(
      computePaymentStageAmountDue(
        {
          registrationFeeEnabled: false,
          registrationFeeAmount: 0,
          roosterEntryFeeEnabled: true,
          roosterEntryFeeAmount: 200,
          cashBondEnabled: true,
          cashBondAmount: 1000,
        },
        3
      )
    ).toBe(1600)
  })
})

describe('computeTotalEntryAmountDue', () => {
  it('combines registration and payment stage fees', () => {
    expect(
      computeTotalEntryAmountDue(
        {
          registrationFeeEnabled: true,
          registrationFeeAmount: 500,
          roosterEntryFeeEnabled: true,
          roosterEntryFeeAmount: 200,
          cashBondEnabled: true,
          cashBondAmount: 1000,
        },
        2
      )
    ).toBe(1900)
  })
})

describe('computeFeeAdjustmentLines', () => {
  const settings = {
    registrationFeeEnabled: true,
    registrationFeeAmount: 500,
    roosterEntryFeeEnabled: true,
    roosterEntryFeeAmount: 200,
    cashBondEnabled: false,
    cashBondAmount: 0,
  }

  it('computes collect delta when fees increase', () => {
    const newSettings = { ...settings, roosterEntryFeeAmount: 300 }
    const lines = computeFeeAdjustmentLines(
      [{ id: 'e1', feeSnapshot: settings, roosterCount: 2 }],
      settings,
      newSettings,
      new Map([['e1', 900]])
    )

    expect(lines).toHaveLength(1)
    expect(lines[0]?.delta).toBe(200)
    expect(summarizeFeeAdjustments(lines).totalCollectDue).toBe(200)
  })
})
