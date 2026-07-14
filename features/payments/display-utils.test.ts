import { describe, expect, it } from 'vitest'

import {
  getOwnerRegistrationPaymentDisplay,
  getRoosterEntryPaymentDisplay,
} from '@/features/payments/display-utils'
import type { EventFeeSettings } from '@/features/events/fee-utils'

const feesEnabled: EventFeeSettings = {
  registrationFeeEnabled: true,
  registrationFeeAmount: 500,
  roosterEntryFeeEnabled: true,
  roosterEntryFeeAmount: 200,
  cashBondEnabled: false,
  cashBondAmount: 0,
}

const feesDisabled: EventFeeSettings = {
  registrationFeeEnabled: false,
  registrationFeeAmount: 0,
  roosterEntryFeeEnabled: false,
  roosterEntryFeeAmount: 0,
  cashBondEnabled: false,
  cashBondAmount: 0,
}

describe('getOwnerRegistrationPaymentDisplay', () => {
  it('returns null when registration fee is disabled', () => {
    expect(getOwnerRegistrationPaymentDisplay('unpaid', feesDisabled)).toBeNull()
  })

  it('returns Unpaid when registration fee is enabled', () => {
    expect(getOwnerRegistrationPaymentDisplay('unpaid', feesEnabled)).toEqual({
      label: 'Unpaid',
      colorPalette: 'orange',
    })
  })
})

describe('getRoosterEntryPaymentDisplay', () => {
  it('returns null when rooster entry fee is disabled', () => {
    expect(getRoosterEntryPaymentDisplay('unpaid', feesDisabled)).toBeNull()
  })

  it('returns Unpaid when rooster entry fee is enabled', () => {
    expect(getRoosterEntryPaymentDisplay('unpaid', feesEnabled)).toEqual({
      label: 'Unpaid',
      colorPalette: 'orange',
    })
  })
})
