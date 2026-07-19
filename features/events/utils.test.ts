import { describe, expect, it } from 'vitest'

import {
  canActivateEvent,
  getNextStatuses,
  getRegistrationClosedReason,
  isRegistrationOpen,
  isValidStatusTransition,
  resolveCocksPerEntry,
} from '@/features/events/utils'

describe('resolveCocksPerEntry', () => {
  it('returns 1 for classic events', () => {
    expect(resolveCocksPerEntry('classic', null)).toBe(1)
  })

  it('derives cocks from preset derby types', () => {
    expect(resolveCocksPerEntry('derby', '2_cock')).toBe(2)
    expect(resolveCocksPerEntry('derby', '5_cock')).toBe(5)
  })

  it('uses custom value for custom derby type', () => {
    expect(resolveCocksPerEntry('derby', 'custom', 7)).toBe(7)
  })
})

describe('isRegistrationOpen', () => {
  it('allows open events without a deadline', () => {
    expect(
      isRegistrationOpen({ status: 'open', registration_deadline: null })
    ).toBe(true)
  })

  it('returns a message for closed draft events', () => {
    expect(
      getRegistrationClosedReason({ status: 'draft', registration_deadline: null })
    ).toMatch(/not open/i)
  })
})

describe('canActivateEvent', () => {
  it('allows non-archived statuses including open and draft', () => {
    expect(canActivateEvent('draft')).toBe(true)
    expect(canActivateEvent('open')).toBe(true)
    expect(canActivateEvent('in_progress')).toBe(true)
    expect(canActivateEvent('completed')).toBe(true)
  })

  it('blocks archived events', () => {
    expect(canActivateEvent('archived')).toBe(false)
  })
})

describe('event status transitions', () => {
  it('follows the simplified lifecycle', () => {
    expect(getNextStatuses('draft')).toEqual(['open', 'cancelled'])
    expect(getNextStatuses('open')).toEqual(['in_progress', 'cancelled'])
    expect(getNextStatuses('in_progress')).toEqual(['completed', 'cancelled'])
    expect(getNextStatuses('completed')).toEqual(['archived'])
  })

  it('rejects invalid transitions', () => {
    expect(isValidStatusTransition('draft', 'in_progress')).toBe(false)
    expect(isValidStatusTransition('open', 'completed')).toBe(false)
    expect(isValidStatusTransition('in_progress', 'open')).toBe(false)
  })

  it('allows valid transitions', () => {
    expect(isValidStatusTransition('open', 'in_progress')).toBe(true)
    expect(isValidStatusTransition('in_progress', 'completed')).toBe(true)
  })
})
