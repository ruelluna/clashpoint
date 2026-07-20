import { describe, expect, it } from 'vitest'

import {
  canEditMatchBetAmounts,
  canEditMatchBets,
  canLockMatchList,
  collectUsedRoosterIds,
  getFightQueueAdvanceBlockReason,
  getMatchBetAdjustmentDelta,
  isMatchBetSideSettled,
  isMatchQueueReady,
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

  it('blocks already queued or in-progress lists', () => {
    expect(canLockMatchList(['queued'])).toBe(
      'Match list is already queued or in progress'
    )
    expect(canLockMatchList(['confirmed', 'fighting'])).toBe(
      'Match list is already queued or in progress'
    )
  })
})

describe('fight queue status transitions', () => {
  it('starts at waiting when unset', () => {
    expect(isValidFightQueueTransition(null, 'waiting')).toBe(true)
    expect(isValidFightQueueTransition(null, 'handlers_called')).toBe(false)
  })

  it('follows waiting → handlers_called → birds_at_pit → fighting', () => {
    expect(isValidFightQueueTransition('waiting', 'handlers_called')).toBe(true)
    expect(isValidFightQueueTransition('handlers_called', 'birds_at_pit')).toBe(true)
    expect(isValidFightQueueTransition('birds_at_pit', 'fighting')).toBe(true)
  })

  it('blocks skips and backwards moves', () => {
    expect(isValidFightQueueTransition('waiting', 'birds_at_pit')).toBe(false)
    expect(isValidFightQueueTransition('fighting', 'birds_at_pit')).toBe(false)
    expect(isValidFightQueueTransition('handlers_called', 'waiting')).toBe(false)
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

describe('isMatchQueueReady', () => {
  const paidSide = {
    betPaymentStatus: 'paid' as const,
    entryOutstanding: 0,
    agreedAmount: 500,
    collectedAmount: 500,
  }
  const unpaidBet = {
    betPaymentStatus: 'unpaid' as const,
    entryOutstanding: 0,
    agreedAmount: 500,
    collectedAmount: 0,
  }
  const unpaidFees = {
    betPaymentStatus: 'paid' as const,
    entryOutstanding: 100,
    agreedAmount: 500,
    collectedAmount: 500,
  }
  const pendingAdjustment = {
    betPaymentStatus: 'paid' as const,
    entryOutstanding: 0,
    agreedAmount: 750,
    collectedAmount: 500,
  }

  it('requires both sides paid, settled, with no entry fees outstanding', () => {
    expect(isMatchQueueReady(paidSide, paidSide)).toBe(true)
    expect(isMatchQueueReady(paidSide, unpaidBet)).toBe(false)
    expect(isMatchQueueReady(unpaidFees, paidSide)).toBe(false)
    expect(isMatchQueueReady(pendingAdjustment, paidSide)).toBe(false)
  })
})

describe('pledge settlement helpers', () => {
  it('computes adjustment delta from agreed minus collected', () => {
    expect(getMatchBetAdjustmentDelta(750, 500)).toBe(250)
    expect(getMatchBetAdjustmentDelta(400, 500)).toBe(-100)
  })

  it('treats paid sides as settled only when collected matches agreed', () => {
    expect(isMatchBetSideSettled(500, 500, 'paid')).toBe(true)
    expect(isMatchBetSideSettled(750, 500, 'paid')).toBe(false)
    expect(isMatchBetSideSettled(500, 0, 'unpaid')).toBe(false)
  })

  it('blocks call when waiting match has pending adjustments', () => {
    expect(
      getFightQueueAdvanceBlockReason(
        'waiting',
        'handlers_called',
        { betPaymentStatus: 'paid', entryOutstanding: 0, agreedAmount: 750, collectedAmount: 500 },
        { betPaymentStatus: 'paid', entryOutstanding: 0, agreedAmount: 500, collectedAmount: 500 }
      )
    ).toMatch(/Settle pledge adjustments/)
  })
})

describe('canEditMatchBets', () => {
  it('allows edits before handlers are called and blocks after', () => {
    expect(canEditMatchBets('draft', ['unpaid', 'unpaid'])).toBe(true)
    expect(canEditMatchBets('draft', ['paid', 'unpaid'])).toBe(true)
    expect(canEditMatchBets('queued', ['paid', 'paid'], 'waiting')).toBe(true)
    expect(canEditMatchBetAmounts('queued', 'handlers_called')).toBe(false)
    expect(canEditMatchBets('queued', ['paid', 'paid'], 'handlers_called')).toBe(false)
  })
})
