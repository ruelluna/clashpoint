import { describe, expect, it } from 'vitest'

import {
  canLockMatchList,
  collectUsedRoosterIds,
  isRoosterEligibleForMatching,
  isValidFightQueueTransition,
  validateCockUsedOnce,
  validateNoSelfMatch,
  validateRoosterEligibility,
} from '@/features/matches/utils'

describe('validateNoSelfMatch', () => {
  it('rejects matching a rooster against itself', () => {
    const id = '00000000-0000-4000-8000-000000000001'
    expect(validateNoSelfMatch(id, id)).toBe(
      'A rooster cannot be matched against itself'
    )
  })

  it('allows different roosters', () => {
    expect(
      validateNoSelfMatch(
        '00000000-0000-4000-8000-000000000001',
        '00000000-0000-4000-8000-000000000002'
      )
    ).toBeNull()
  })
})

describe('validateCockUsedOnce', () => {
  it('rejects roosters already in the match list', () => {
    const used = new Set(['00000000-0000-4000-8000-000000000003'])
    expect(
      validateCockUsedOnce('00000000-0000-4000-8000-000000000003', used)
    ).toBe('This rooster is already assigned to a match')
  })

  it('allows unused roosters', () => {
    const used = new Set(['00000000-0000-4000-8000-000000000003'])
    expect(
      validateCockUsedOnce('00000000-0000-4000-8000-000000000004', used)
    ).toBeNull()
  })
})

describe('rooster eligibility via weighing', () => {
  const base = {
    rooster_id: '00000000-0000-4000-8000-000000000001',
    entry_id: '00000000-0000-4000-8000-000000000010',
    event_id: '00000000-0000-4000-8000-000000000020',
  }

  it('requires verified lineup and passed weighing', () => {
    expect(
      isRoosterEligibleForMatching({
        ...base,
        lineup_status: 'verified',
        weight_status: 'passed',
      })
    ).toBe(true)
  })

  it('rejects unverified lineups', () => {
    expect(
      validateRoosterEligibility({
        ...base,
        lineup_status: 'submitted',
        weight_status: 'passed',
      })
    ).toBe('Rooster lineup must be verified before matching')
  })

  it('rejects roosters that failed weighing', () => {
    expect(
      validateRoosterEligibility({
        ...base,
        lineup_status: 'verified',
        weight_status: 'failed',
      })
    ).toBe('Rooster must pass weighing before matching')
  })

  it('rejects roosters pending weighing', () => {
    expect(
      isRoosterEligibleForMatching({
        ...base,
        lineup_status: 'verified',
        weight_status: 'pending',
      })
    ).toBe(false)
  })
})

describe('canLockMatchList', () => {
  it('requires at least one match', () => {
    expect(canLockMatchList([])).toBe('No matches to lock')
  })

  it('allows draft, for review, and confirmed matches', () => {
    expect(canLockMatchList(['draft', 'confirmed', 'for_review'])).toBeNull()
  })

  it('blocks already locked or in-progress lists', () => {
    expect(canLockMatchList(['locked'])).toBe(
      'Match list is already locked or in progress'
    )
    expect(canLockMatchList(['confirmed', 'ongoing'])).toBe(
      'Match list is already locked or in progress'
    )
  })
})

describe('fight queue status transitions', () => {
  it('starts at scheduled when unset', () => {
    expect(isValidFightQueueTransition(null, 'scheduled')).toBe(true)
    expect(isValidFightQueueTransition(null, 'called')).toBe(false)
  })

  it('follows scheduled → called → ready → ongoing', () => {
    expect(isValidFightQueueTransition('scheduled', 'called')).toBe(true)
    expect(isValidFightQueueTransition('called', 'ready')).toBe(true)
    expect(isValidFightQueueTransition('ready', 'ongoing')).toBe(true)
  })

  it('blocks skips and backwards moves', () => {
    expect(isValidFightQueueTransition('scheduled', 'ready')).toBe(false)
    expect(isValidFightQueueTransition('ongoing', 'ready')).toBe(false)
    expect(isValidFightQueueTransition('called', 'scheduled')).toBe(false)
  })
})

describe('collectUsedRoosterIds', () => {
  it('includes roosters from active matches only', () => {
    const used = collectUsedRoosterIds([
      {
        meron_rooster_id: 'meron-1',
        wala_rooster_id: 'wala-1',
        status: 'confirmed',
      },
      {
        meron_rooster_id: 'meron-2',
        wala_rooster_id: 'wala-2',
        status: 'cancelled',
      },
    ])

    expect(used.has('meron-1')).toBe(true)
    expect(used.has('wala-1')).toBe(true)
    expect(used.has('meron-2')).toBe(false)
    expect(used.has('wala-2')).toBe(false)
  })
})
