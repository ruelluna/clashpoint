import { describe, expect, it } from 'vitest'

import {
  looksLikeClashPointBarcode,
  normalizeScanInput,
  resolveScanValueFromInput,
  shouldIdleSubmitBarcode,
} from '@/features/entries/barcode-scan-utils'

describe('normalizeScanInput', () => {
  it('trims whitespace', () => {
    expect(normalizeScanInput('  COCK-ABC-0001  ')).toBe('COCK-ABC-0001')
  })
})

describe('resolveScanValueFromInput', () => {
  it('returns trimmed value for Enter submit', () => {
    expect(resolveScanValueFromInput('  BET-0001-M  ')).toBe('BET-0001-M')
  })
})

describe('looksLikeClashPointBarcode', () => {
  it('accepts OWN-, COCK-, and BET- prefixes', () => {
    expect(looksLikeClashPointBarcode('OWN-00000000-0001')).toBe(true)
    expect(looksLikeClashPointBarcode('COCK-00000000-0001')).toBe(true)
    expect(looksLikeClashPointBarcode('BET-00000000-0001-M')).toBe(true)
  })

  it('accepts short scan codes', () => {
    expect(looksLikeClashPointBarcode('O0001')).toBe(true)
    expect(looksLikeClashPointBarcode('C0001')).toBe(true)
    expect(looksLikeClashPointBarcode('B0042M')).toBe(true)
  })

  it('rejects short or unknown values', () => {
    expect(looksLikeClashPointBarcode('OWN-1')).toBe(false)
    expect(looksLikeClashPointBarcode('SEARCH TERM')).toBe(false)
    expect(looksLikeClashPointBarcode('')).toBe(false)
  })

  it('is case insensitive for prefix', () => {
    expect(looksLikeClashPointBarcode('own-00000000-0001')).toBe(true)
    expect(looksLikeClashPointBarcode('o0001')).toBe(true)
  })
})

describe('shouldIdleSubmitBarcode', () => {
  it('matches looksLikeClashPointBarcode', () => {
    expect(shouldIdleSubmitBarcode('COCK-00000000-0001')).toBe(true)
    expect(shouldIdleSubmitBarcode('O0001')).toBe(true)
    expect(shouldIdleSubmitBarcode('hello')).toBe(false)
  })
})
