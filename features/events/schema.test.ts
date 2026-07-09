import { describe, expect, it } from 'vitest'

import { createEventSchema } from '@/features/events/schema'

const basePrizeStructure = {
  prizeType: 'percentage' as const,
  config: [{ place: 1, label: 'Champion', value: 100 }],
}

const baseEvent = {
  name: 'Summer Derby',
  venue: 'Main Arena',
  eventDate: '2026-08-01T10:00:00.000Z',
  entryFee: 1000,
  prizeStructure: basePrizeStructure,
}

describe('createEventSchema event_format', () => {
  it('defaults to derby format', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      derbyType: '5_cock',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.eventFormat).toBe('derby')
    }
  })

  it('requires a derby type for derby events', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventFormat: 'derby',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Derby type is required for derby events'
      )
    }
  })

  it('accepts a classic event without a derby type', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventFormat: 'classic',
      cocksPerEntry: 1,
      derbyType: null,
    })

    expect(result.success).toBe(true)
  })

  it('rejects a classic event with more than one cock per entry', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventFormat: 'classic',
      cocksPerEntry: 5,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Classic events must have exactly 1 cock per entry'
      )
    }
  })

  it('accepts a valid derby event with a derby type', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventFormat: 'derby',
      derbyType: '4_cock',
      cocksPerEntry: 4,
    })

    expect(result.success).toBe(true)
  })
})
