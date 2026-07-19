import { describe, expect, it } from 'vitest'

import {
  createMatchSchema,
  formatMatchBetBarcode,
  parseMatchBetBarcode,
  updateMatchBetSchema,
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

describe('updateMatchBetSchema', () => {
  it('accepts valid bet update', () => {
    const result = updateMatchBetSchema.safeParse({
      eventId,
      matchId,
      side: 'meron',
      amount: 1000,
    })

    expect(result.success).toBe(true)
  })

  it('rejects negative amounts', () => {
    const result = updateMatchBetSchema.safeParse({
      eventId,
      matchId,
      side: 'wala',
      amount: -1,
    })

    expect(result.success).toBe(false)
  })
})
