import { describe, expect, it } from 'vitest'

import {
  filterExactReferenceMatches,
  hasExactReferenceMatch,
  normalizeReferenceValueName,
  searchReferenceValuesSchema,
} from '@/features/reference-values/schema'

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

describe('hasExactReferenceMatch', () => {
  it('matches normalized catalog names', () => {
    const results = [{ id: '1', name: 'Kelso' }]
    expect(hasExactReferenceMatch(results, 'kelso')).toBe(true)
    expect(hasExactReferenceMatch(results, 'Roundhead')).toBe(false)
  })
})

describe('filterExactReferenceMatches', () => {
  it('returns only exact normalized matches', () => {
    const results = [
      { id: '1', name: 'Kelso' },
      { id: '2', name: 'Kelso Cross' },
    ]
    expect(filterExactReferenceMatches(results, 'Kelso')).toEqual([{ id: '1', name: 'Kelso' }])
  })
})
