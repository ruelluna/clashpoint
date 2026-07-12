import { describe, expect, it } from 'vitest'

import { createMatchSchema, updateMatchBetSchema } from '@/features/matches/schema'

const eventId = '00000000-0000-4000-8000-000000000001'
const meronEntryId = '00000000-0000-4000-8000-000000000002'
const walaEntryId = '00000000-0000-4000-8000-000000000003'
const meronRoosterId = '00000000-0000-4000-8000-000000000004'
const walaRoosterId = '00000000-0000-4000-8000-000000000005'
const matchId = '00000000-0000-4000-8000-000000000006'

describe('createMatchSchema', () => {
  it('accepts valid match with optional bets', () => {
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

  it('rejects matching the same rooster on both sides', () => {
    const result = createMatchSchema.safeParse({
      eventId,
      meronEntryId,
      meronRoosterId,
      walaEntryId,
      walaRoosterId: meronRoosterId,
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
    })

    expect(result.success).toBe(false)
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
