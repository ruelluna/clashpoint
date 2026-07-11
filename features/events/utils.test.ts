import { describe, expect, it } from 'vitest'

import { resolveCocksPerEntry } from '@/features/events/utils'

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
