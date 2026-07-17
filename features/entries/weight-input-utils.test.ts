import { describe, expect, it } from 'vitest'

import { clampGramWeightDigits } from '@/features/entries/weight-input-utils'

describe('clampGramWeightDigits', () => {
  it('keeps up to four digits', () => {
    expect(clampGramWeightDigits('2100')).toBe('2100')
    expect(clampGramWeightDigits('9999')).toBe('9999')
  })

  it('truncates input longer than four digits', () => {
    expect(clampGramWeightDigits('10000')).toBe('1000')
    expect(clampGramWeightDigits('123456')).toBe('1234')
  })

  it('strips non-digit characters', () => {
    expect(clampGramWeightDigits('2.1kg')).toBe('21')
    expect(clampGramWeightDigits('abc')).toBe('')
  })
})
