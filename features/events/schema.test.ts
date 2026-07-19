import { describe, expect, it } from 'vitest'

import {
  clearEventActiveSchema,
  createEventSchema,
  defaultTaxPerFight,
  setEventActiveSchema,
} from '@/features/events/schema'

const basePrizeStructure = {
  prizeType: 'percentage' as const,
  config: [{ place: 1, label: 'Champion', value: 100 }],
}

const baseEvent = {
  name: 'Summer Derby',
  eventDate: '2026-08-01T10:00:00.000Z',
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
        'Derby format is required for derby events'
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

  it('defaults legal authorization to true and cocks per entry to 2', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      derbyType: '2_cock',
      prizeStructure: basePrizeStructure,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.legalAuthorized).toBe(true)
      expect(result.data.cocksPerEntry).toBe(2)
    }
  })

  it('accepts tax commission and inspection fields', () => {
    const result = createEventSchema.safeParse({
      ...baseEvent,
      eventType: 'classic',
      cocksPerEntry: 1,
      taxCommission: 25,
      physicalInspectionRequired: true,
      revolvingFundInitial: 500,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.taxCommission).toBe(25)
      expect(result.data.physicalInspectionRequired).toBe(true)
      expect(result.data.revolvingFundInitial).toBe(500)
    }
  })

  it('uses type-aware default tax per fight helper', () => {
    expect(defaultTaxPerFight('classic')).toBe(50)
    expect(defaultTaxPerFight('derby')).toBe(100)
  })
})

describe('setEventActiveSchema / clearEventActiveSchema', () => {
  const eventId = '00000000-0000-4000-8000-000000000001'

  it('accepts a valid event id', () => {
    expect(setEventActiveSchema.safeParse({ eventId }).success).toBe(true)
    expect(clearEventActiveSchema.safeParse({ eventId }).success).toBe(true)
  })

  it('rejects missing or invalid event ids', () => {
    expect(setEventActiveSchema.safeParse({}).success).toBe(false)
    expect(setEventActiveSchema.safeParse({ eventId: 'not-a-uuid' }).success).toBe(
      false
    )
  })
})
