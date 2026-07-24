import { describe, expect, it } from 'vitest'

import {
  resolveScanValueFromInput,
  shouldIdleSubmitBarcode,
} from '@/features/entries/barcode-scan-utils'

describe('useBarcodeScanInput submit logic', () => {
  it('uses DOM value on Enter (not stale state)', () => {
    const domValue = 'COCK-00000000-0001'
    expect(resolveScanValueFromInput(domValue)).toBe('COCK-00000000-0001')
  })

  it('idle submit triggers for complete barcode pattern', () => {
    expect(shouldIdleSubmitBarcode('OWN-00000000-0001')).toBe(true)
    expect(shouldIdleSubmitBarcode('O0001')).toBe(true)
  })

  it('idle submit does not trigger for partial input', () => {
    expect(shouldIdleSubmitBarcode('OWN-')).toBe(false)
    expect(shouldIdleSubmitBarcode('O00')).toBe(false)
  })
})
