import { describe, expect, it } from 'vitest'

describe('revolving fund balance math', () => {
  function computeBalance(entries: Array<{ amount: number }>): number {
    return Number(
      entries.reduce((sum, entry) => sum + entry.amount, 0).toFixed(2)
    )
  }

  it('tracks opening balance plus adjustments', () => {
    const balance = computeBalance([
      { amount: 1000 },
      { amount: 250 },
      { amount: -150 },
    ])

    expect(balance).toBe(1100)
  })
})
