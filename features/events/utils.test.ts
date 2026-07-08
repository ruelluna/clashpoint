import { describe, expect, it } from 'vitest'

import type { EventStatus } from '@/features/events/types'
import {
  getNextStatuses,
  isValidStatusTransition,
  STATUS_TRANSITIONS,
} from '@/features/events/utils'

describe('event status transitions', () => {
  it('allows forward lifecycle from draft to completed', () => {
    const path: EventStatus[] = [
      'draft',
      'open',
      'registration_closed',
      'ready_for_weighing',
      'ready_for_matching',
      'ongoing',
      'completed',
      'archived',
    ]

    for (let i = 0; i < path.length - 1; i += 1) {
      expect(isValidStatusTransition(path[i], path[i + 1])).toBe(true)
    }
  })

  it('allows cancellation from active pre-completion statuses', () => {
    const cancellable: EventStatus[] = [
      'draft',
      'open',
      'registration_closed',
      'ready_for_weighing',
      'ready_for_matching',
      'ongoing',
    ]

    for (const status of cancellable) {
      expect(isValidStatusTransition(status, 'cancelled')).toBe(true)
    }
  })

  it('blocks invalid skips and backwards moves', () => {
    expect(isValidStatusTransition('draft', 'ongoing')).toBe(false)
    expect(isValidStatusTransition('open', 'draft')).toBe(false)
    expect(isValidStatusTransition('completed', 'ongoing')).toBe(false)
    expect(isValidStatusTransition('archived', 'completed')).toBe(false)
  })

  it('blocks self-transitions', () => {
    expect(isValidStatusTransition('open', 'open')).toBe(false)
  })

  it('returns next statuses from transition map', () => {
    expect(getNextStatuses('draft')).toEqual(['open', 'cancelled'])
    expect(getNextStatuses('ongoing')).toEqual(['completed', 'cancelled'])
    expect(getNextStatuses('archived')).toEqual([])
  })

  it('covers every status in the transition map', () => {
    const statuses = Object.keys(STATUS_TRANSITIONS) as EventStatus[]
    expect(statuses).toHaveLength(9)
  })
})
