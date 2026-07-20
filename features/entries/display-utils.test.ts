import { describe, expect, it } from 'vitest'

import { entryRegistrationStatusColorPalette } from '@/features/entries/display-utils'

describe('entryRegistrationStatusColorPalette', () => {
  it('maps positive statuses to green', () => {
    expect(entryRegistrationStatusColorPalette('approved')).toBe('green')
    expect(entryRegistrationStatusColorPalette('confirmed')).toBe('green')
  })

  it('maps negative statuses to red', () => {
    expect(entryRegistrationStatusColorPalette('rejected')).toBe('red')
    expect(entryRegistrationStatusColorPalette('cancelled')).toBe('red')
  })

  it('maps pending_review to orange and submitted to gray', () => {
    expect(entryRegistrationStatusColorPalette('pending_review')).toBe('orange')
    expect(entryRegistrationStatusColorPalette('submitted')).toBe('gray')
  })
})
