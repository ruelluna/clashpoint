import { describe, expect, it } from 'vitest'

import { normalizeReferenceValueName, searchReferenceValuesSchema } from '@/features/reference-values/schema'

describe('searchReferenceValuesSchema', () => {
  it('accepts breed kind with empty query', () => {
    const result = searchReferenceValuesSchema.safeParse({
      kind: 'breed',
      query: '',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid kind', () => {
    const result = searchReferenceValuesSchema.safeParse({
      kind: 'invalid',
      query: 'Kelso',
    })

    expect(result.success).toBe(false)
  })
})

describe('normalizeReferenceValueName', () => {
  it('lowercases and trims names', () => {
    expect(normalizeReferenceValueName('  Kelso  ')).toBe('kelso')
  })
})
