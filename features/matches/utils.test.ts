import { describe, expect, it } from 'vitest'

import {
  canEditMatchBetAmounts,
  canEditMatchBets,
  canLockMatchList,
  collectUsedRoosterIds,
  filterFightQueueTabMatches,
  getFightQueueAdvanceBlockReason,
  getFightQueueConcurrentBlockReason,
  isMatchOccupyingArena,
  shouldAssignMatchingNumber,
  getMatchBetAdjustmentDelta,
  isMatchBetSideSettled,
  isMatchQueueReady,
  isPalitadaEditLocked,
  isRoosterEligibleForMatching,
  isValidFightQueueRollback,
  isValidFightQueueTransition,
  previousQueueStatus,
  resolveActiveMatch,
  resolveBetBalancingTargetMatch,
  resolvePalitadaTargetMatch,
  validateCockUsedOnce,
  validateNoSelfMatch,
  validateRoosterEligibility,
} from '@/features/matches/utils'
import type { MatchListItem } from '@/features/matches/types'

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

describe('getFightQueueConcurrentBlockReason', () => {
  const queueMatches = [
    { id: '1', fight_number: 1, status: 'fighting' as const, queue_status: 'fighting' as const },
    { id: '2', fight_number: 2, status: 'queued' as const, queue_status: 'handlers_called' as const },
  ]

  it('blocks birds at pit when another match is fighting', () => {
    expect(getFightQueueConcurrentBlockReason('2', 'birds_at_pit', queueMatches)).toMatch(
      /Finish fight #1 before birds can be sent to the pit/
    )
  })

  it('blocks birds at pit when another match is at the pit', () => {
    expect(
      getFightQueueConcurrentBlockReason('2', 'birds_at_pit', [
        { id: '1', fight_number: 3, status: 'at_pit', queue_status: 'birds_at_pit' },
        { id: '2', fight_number: 4, status: 'queued', queue_status: 'handlers_called' },
      ])
    ).toMatch(/Fight #3 is at the pit/)
  })

  it('allows birds at pit when arena is free', () => {
    expect(
      getFightQueueConcurrentBlockReason('2', 'birds_at_pit', [
        { id: '1', fight_number: 1, status: 'queued', queue_status: 'handlers_called' },
        { id: '2', fight_number: 2, status: 'queued', queue_status: 'handlers_called' },
      ])
    ).toBeNull()
  })

  it('blocks start fight when another match is fighting', () => {
    expect(getFightQueueConcurrentBlockReason('2', 'fighting', queueMatches)).toMatch(
      /Finish fight #1 before starting another fight/
    )
  })

  it('allows advance when no other match is fighting', () => {
    expect(
      getFightQueueConcurrentBlockReason('1', 'fighting', [
        { id: '1', fight_number: 1, status: 'at_pit', queue_status: 'birds_at_pit' },
        { id: '2', fight_number: 2, status: 'queued', queue_status: 'handlers_called' },
      ])
    ).toBeNull()
  })

  it('does not block when another match only has stale queue_status fighting', () => {
    expect(
      getFightQueueConcurrentBlockReason('2', 'birds_at_pit', [
        {
          id: '1',
          fight_number: 2,
          status: 'settling',
          queue_status: 'fighting',
        },
        { id: '2', fight_number: 6, status: 'queued', queue_status: 'handlers_called' },
      ])
    ).toBeNull()
  })

  it('does not block call handlers advance', () => {
    expect(
      getFightQueueConcurrentBlockReason('2', 'handlers_called', queueMatches)
    ).toBeNull()
  })
})

describe('shouldAssignMatchingNumber', () => {
  it('assigns on handlers_called to birds_at_pit when missing', () => {
    expect(shouldAssignMatchingNumber('handlers_called', 'birds_at_pit', null)).toBe(true)
  })

  it('does not reassign when already set', () => {
    expect(shouldAssignMatchingNumber('handlers_called', 'birds_at_pit', 'ABCD-0001')).toBe(
      false
    )
  })

  it('does not assign on call handlers or other queue transitions', () => {
    expect(shouldAssignMatchingNumber('waiting', 'handlers_called', null)).toBe(false)
    expect(shouldAssignMatchingNumber('birds_at_pit', 'fighting', null)).toBe(false)
  })
})

describe('isMatchOccupyingArena', () => {
  it('returns true for birds at pit and fighting', () => {
    expect(
      isMatchOccupyingArena({ status: 'at_pit', queue_status: 'birds_at_pit' })
    ).toBe(true)
    expect(
      isMatchOccupyingArena({ status: 'fighting', queue_status: 'fighting' })
    ).toBe(true)
  })

  it('returns false for handlers called and finished matches', () => {
    expect(
      isMatchOccupyingArena({ status: 'queued', queue_status: 'handlers_called' })
    ).toBe(false)
    expect(
      isMatchOccupyingArena({ status: 'settling', queue_status: 'fighting' })
    ).toBe(false)
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

function buildMatchListItem(
  overrides: Partial<MatchListItem> & Pick<MatchListItem, 'id' | 'fight_number' | 'queue_status'>
): MatchListItem {
  const side = {
    entry_id: 'entry',
    entry_number: '1',
    entry_name: 'Entry',
    owner_name: 'Owner',
    rooster_id: 'rooster',
    cock_number: 1,
    band_number: 'B1',
    weight: 2,
    bet_amount: 500,
    bet_collected_amount: 500,
    bet_barcode: null,
    bet_scan_code: null,
    bet_payment_status: 'paid' as const,
  }

  return {
    event_id: 'event',
    matching_number: overrides.matching_number ?? null,
    status: 'queued',
    round_number: null,
    meron: side,
    wala: { ...side, rooster_id: 'rooster-2', cock_number: 2 },
    ...overrides,
  }
}

describe('filterFightQueueTabMatches', () => {
  it('includes waiting and handlers_called only', () => {
    const matches = [
      buildMatchListItem({ id: '1', fight_number: 1, queue_status: 'waiting' }),
      buildMatchListItem({ id: '2', fight_number: 2, queue_status: 'handlers_called' }),
      buildMatchListItem({ id: '3', fight_number: 3, queue_status: 'birds_at_pit' }),
      buildMatchListItem({ id: '4', fight_number: 4, queue_status: 'fighting' }),
    ]

    expect(filterFightQueueTabMatches(matches).map((match) => match.id)).toEqual(['1', '2'])
  })
})

describe('resolveActiveMatch', () => {
  it('returns null when no called or in-progress matches exist', () => {
    expect(
      resolveActiveMatch([
        buildMatchListItem({ id: '1', fight_number: 1, queue_status: 'waiting' }),
      ])
    ).toBeNull()
  })

  it('prefers fighting over handlers_called', () => {
    const active = resolveActiveMatch([
      buildMatchListItem({ id: '1', fight_number: 2, queue_status: 'handlers_called' }),
      buildMatchListItem({ id: '2', fight_number: 1, queue_status: 'fighting' }),
    ])

    expect(active?.id).toBe('2')
  })

  it('uses lowest fight number as tie-breaker at same queue status', () => {
    const active = resolveActiveMatch([
      buildMatchListItem({ id: '1', fight_number: 3, queue_status: 'birds_at_pit' }),
      buildMatchListItem({ id: '2', fight_number: 2, queue_status: 'birds_at_pit' }),
    ])

    expect(active?.id).toBe('2')
  })

  it('ignores settling matches with stale queue_status fighting', () => {
    const active = resolveActiveMatch([
      buildMatchListItem({
        id: '1',
        fight_number: 2,
        status: 'settling',
        queue_status: 'fighting',
      }),
      buildMatchListItem({ id: '2', fight_number: 5, queue_status: 'handlers_called' }),
    ])

    expect(active?.id).toBe('2')
  })
})

describe('resolveBetBalancingTargetMatch', () => {
  it('prefers birds at pit over waiting', () => {
    const target = resolveBetBalancingTargetMatch([
      buildMatchListItem({ id: '1', fight_number: 1, queue_status: 'waiting' }),
      buildMatchListItem({ id: '2', fight_number: 2, queue_status: 'birds_at_pit' }),
    ])

    expect(target?.id).toBe('2')
  })

  it('returns the lowest fight number among waiting matches when no pit fight exists', () => {
    const target = resolveBetBalancingTargetMatch([
      buildMatchListItem({ id: '1', fight_number: 3, queue_status: 'waiting' }),
      buildMatchListItem({ id: '2', fight_number: 2, queue_status: 'waiting' }),
    ])

    expect(target?.id).toBe('2')
  })

  it('ignores fighting matches', () => {
    expect(
      resolveBetBalancingTargetMatch([
        buildMatchListItem({ id: '1', fight_number: 1, queue_status: 'fighting' }),
      ])
    ).toBeNull()
  })
})

describe('resolvePalitadaTargetMatch', () => {
  it('delegates to resolveBetBalancingTargetMatch', () => {
    const target = resolvePalitadaTargetMatch([
      buildMatchListItem({ id: '2', fight_number: 2, queue_status: 'birds_at_pit' }),
    ])

    expect(target?.id).toBe('2')
  })
})

describe('isPalitadaEditLocked', () => {
  it('allows palitada edits through birds at pit', () => {
    expect(isPalitadaEditLocked('at_pit', 'birds_at_pit')).toBe(false)
  })

  it('locks palitada once fighting starts', () => {
    expect(isPalitadaEditLocked('fighting', 'fighting')).toBe(true)
  })
})

describe('fight queue rollback helpers', () => {
  it('maps previous queue status', () => {
    expect(previousQueueStatus('birds_at_pit')).toBe('handlers_called')
    expect(previousQueueStatus('waiting')).toBeNull()
  })

  it('validates rollback transitions', () => {
    expect(isValidFightQueueRollback('birds_at_pit', 'handlers_called')).toBe(true)
    expect(isValidFightQueueRollback('birds_at_pit', 'waiting')).toBe(false)
    expect(isValidFightQueueTransition('birds_at_pit', 'fighting')).toBe(true)
  })
})
