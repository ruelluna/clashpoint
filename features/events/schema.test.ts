import { describe, expect, it } from 'vitest'

import { createEventSchema } from '@/features/events/schema'

const basePrizeStructure = {
  prizeType: 'percentage' as const,
  config: [{ place: 1, label: 'Champion', value: 100 }],
}

const baseEvent = {
  name: 'Summer Derby',
  eventDate: '2026-08-01T10:00:00.000Z',
  entryFee: 1000,
  taxPerFight: 50,
}

describe('createEventSchema event_type', () => {
  it('defaults to derby type', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      derbyType: '5_cock',
      prizeStructure: basePrizeStructure,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.eventType).toBe('derby')
    }
  })

  it('requires a derby type for derby events', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventType: 'derby',
      prizeStructure: basePrizeStructure,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Derby type is required for derby events'
      )
    }
  })

  it('requires prize structure for derby events', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventType: 'derby',
      derbyType: '5_cock',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Prize structure is required for derby events'
      )
    }
  })

  it('accepts a classic event without a derby type or prize structure', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventType: 'classic',
      cocksPerEntry: 1,
      derbyType: null,
    })

    expect(result.success).toBe(true)
  })

  it('rejects a classic event with more than one cock per entry', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventType: 'classic',
      cocksPerEntry: 5,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Classic events must have exactly 1 cock per entry'
      )
    }
  })

  it('accepts a valid derby event with preset derby type', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventType: 'derby',
      derbyType: '4_cock',
      cocksPerEntry: 4,
      prizeStructure: basePrizeStructure,
    })

    expect(result.success).toBe(true)
  })

  it('accepts tax per fight for classic events', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventType: 'classic',
      cocksPerEntry: 1,
      taxPerFight: 25,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.taxPerFight).toBe(25)
    }
  })

  it('requires cocks per entry for custom derby type', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventType: 'derby',
      derbyType: 'custom',
      cocksPerEntry: 0,
      prizeStructure: basePrizeStructure,
    })

    expect(result.success).toBe(false)
  })
})
