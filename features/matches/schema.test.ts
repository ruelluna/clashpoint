import { describe, expect, it } from 'vitest'

import {
  createMatchSchema,
  formatMatchBetBarcode,
  formatMatchingNumber,
  formatMatchingNumberSuffix,
  generateMatchingNumber,
  nextMatchingNumberSequence,
  parseMatchBetBarcode,
  parseMatchingNumberSequence,
} from '@/features/matches/schema'

const eventId = '00000000-0000-4000-8000-000000000001'
const meronEntryId = '00000000-0000-4000-8000-000000000002'
const walaEntryId = '00000000-0000-4000-8000-000000000003'
const meronRoosterId = '00000000-0000-4000-8000-000000000004'
const walaRoosterId = '00000000-0000-4000-8000-000000000005'
const matchId = '00000000-0000-4000-8000-000000000006'

describe('createMatchSchema', () => {
  it('accepts valid match with positive bets', () => {
    const result = createMatchSchema.safeParse({
      eventId,
      meronEntryId,
      meronRoosterId,
      walaEntryId,
      walaRoosterId,
      meronBet: 500,
      walaBet: 750,
    })

    expect(result.success).toBe(true)
  })

  it('requires positive bet amounts on both sides', () => {
    const missing = createMatchSchema.safeParse({
      eventId,
      meronEntryId,
      meronRoosterId,
      walaEntryId,
      walaRoosterId,
    })
    expect(missing.success).toBe(false)

    const zero = createMatchSchema.safeParse({
      eventId,
      meronEntryId,
      meronRoosterId,
      walaEntryId,
      walaRoosterId,
      meronBet: 0,
      walaBet: 100,
    })
    expect(zero.success).toBe(false)
  })

  it('rejects matching the same rooster on both sides', () => {
    const result = createMatchSchema.safeParse({
      eventId,
      meronEntryId,
      meronRoosterId,
      walaEntryId,
      walaRoosterId: meronRoosterId,
      meronBet: 100,
      walaBet: 100,
    })

    expect(result.success).toBe(false)
  })

  it('rejects negative bet amounts', () => {
    const result = createMatchSchema.safeParse({
      eventId,
      meronEntryId,
      meronRoosterId,
      walaEntryId,
      walaRoosterId,
      meronBet: -100,
      walaBet: 100,
    })

    expect(result.success).toBe(false)
  })
})

describe('match bet barcode helpers', () => {
  it('formats and parses BET barcodes for an event', () => {
    const barcode = formatMatchBetBarcode(eventId, 42, 'meron')
    expect(barcode).toBe('BET-00000000-0042-M')
    expect(parseMatchBetBarcode(barcode, eventId)).toEqual({
      fightNumber: 42,
      side: 'meron',
    })
  })
})

describe('matching number helpers', () => {
  it('formats suffix from active-match sequence', () => {
    expect(formatMatchingNumberSuffix(5)).toBe('-0005')
    expect(formatMatchingNumberSuffix(42)).toBe('-0042')
  })

  it('combines letters and sequence suffix', () => {
    expect(formatMatchingNumber('KQTM', 5)).toBe('KQTM-0005')
  })

  it('generates matching numbers with random letters and padded sequence', () => {
    const matchingNumber = generateMatchingNumber(12)
    expect(matchingNumber).toMatch(/^[A-Z]{4}-\d{4}$/)
    expect(matchingNumber.endsWith('-0012')).toBe(true)
  })

  it('parses matching number sequence suffix', () => {
    expect(parseMatchingNumberSequence('ABCD-0003')).toBe(3)
    expect(parseMatchingNumberSequence('abcd-0042')).toBe(42)
    expect(parseMatchingNumberSequence('invalid')).toBeNull()
  })

  it('computes next sequence from existing matching numbers', () => {
    expect(nextMatchingNumberSequence([])).toBe(1)
    expect(nextMatchingNumberSequence(['ABCD-0003', 'WTST-0001'])).toBe(4)
    expect(nextMatchingNumberSequence(['ABCD-0003', null, 'bad'])).toBe(4)
  })
})
