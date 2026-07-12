import { describe, expect, it } from 'vitest'

import {
  getRegistrationClosedReason,
  isRegistrationOpen,
  resolveCocksPerEntry,
} from '@/features/events/utils'

describe('resolveCocksPerEntry', () => {
  it('returns 1 for classic events', () => {
    expect(resolveCocksPerEntry('classic', null)).toBe(1)
  })

  it('derives cocks from preset derby types', () => {
    expect(resolveCocksPerEntry('derby', '2_cock')).toBe(2)
    expect(resolveCocksPerEntry('derby', '5_cock')).toBe(5)
  })

  it('uses custom value for custom derby type', () => {
    expect(resolveCocksPerEntry('derby', 'custom', 7)).toBe(7)
  })
})

describe('isRegistrationOpen', () => {
  it('allows open events without a deadline', () => {
    expect(
      isRegistrationOpen({ status: 'open', registration_deadline: null })
    ).toBe(true)
  })

  it('returns a message for closed draft events', () => {
    expect(
      getRegistrationClosedReason({ status: 'draft', registration_deadline: null })
    ).toMatch(/not open/i)
  })
})
