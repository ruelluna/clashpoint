import { describe, expect, it } from 'vitest'

import {
  canSubmitLineup,
  formatEntryNumber,
  getNextEntryNumber,
  parseEntryNumber,
} from '@/features/entries/schema'

describe('entry number helpers', () => {
  it('parses numeric entry numbers', () => {
    expect(parseEntryNumber('001')).toBe(1)
    expect(parseEntryNumber('42')).toBe(42)
    expect(parseEntryNumber('abc')).toBeNull()
  })

  it('formats entry numbers with zero padding', () => {
    expect(formatEntryNumber(1)).toBe('001')
    expect(formatEntryNumber(12)).toBe('012')
    expect(formatEntryNumber(120)).toBe('120')
  })

  it('rejects invalid sequences when formatting', () => {
    expect(() => formatEntryNumber(0)).toThrow()
    expect(() => formatEntryNumber(1.5)).toThrow()
  })

  it('returns the next sequential entry number for an event', () => {
    expect(getNextEntryNumber([])).toBe('001')
    expect(getNextEntryNumber(['001', '002', '010'])).toBe('011')
    expect(getNextEntryNumber(['003', '001', '002'])).toBe('004')
  })

  it('ignores non-numeric values when calculating the next number', () => {
    expect(getNextEntryNumber(['001', 'VIP-A', '002'])).toBe('003')
  })
})

describe('canSubmitLineup', () => {
  it('allows lineup when payment is paid', () => {
    expect(canSubmitLineup({ payment_status: 'paid' })).toBe(true)
  })

  it('blocks lineup when payment is not paid', () => {
    expect(canSubmitLineup({ payment_status: 'unpaid' })).toBe(false)
    expect(canSubmitLineup({ payment_status: 'partial' })).toBe(false)
    expect(canSubmitLineup({ payment_status: 'refunded' })).toBe(false)
  })
})
