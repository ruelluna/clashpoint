import type { FightQueueStatus, MatchStatus, RoosterEligibilityContext } from '@/features/matches/types'
import type { MatchBetPaymentStatus } from '@/features/matches/types'

const ACTIVE_MATCH_STATUSES: MatchStatus[] = [
  'draft',
  'for_review',
  'confirmed',
  'locked',
  'ready',
  'ongoing',
]

const LOCKABLE_MATCH_STATUSES: MatchStatus[] = ['draft', 'for_review', 'confirmed']

export const FIGHT_QUEUE_TRANSITIONS: Record<
  FightQueueStatus,
  FightQueueStatus[]
> = {
  scheduled: ['called'],
  called: ['ready'],
  ready: ['ongoing'],
  ongoing: [],
}

export function validateNoSelfMatch(
  meronRoosterId: string,
  walaRoosterId: string
): string | null {
  if (meronRoosterId === walaRoosterId) {
    return 'A rooster cannot be matched against itself'
  }
  return null
}

export function validateCockUsedOnce(
  roosterId: string,
  usedRoosterIds: Set<string>
): string | null {
  if (usedRoosterIds.has(roosterId)) {
    return 'This rooster is already assigned to a match'
  }
  return null
}

export function isRoosterEligibleForMatching(
  context: RoosterEligibilityContext
): boolean {
  if (context.lineup_status !== 'verified') return false
  if (context.weight_status !== 'passed') return false
  return true
}

export function validateRoosterEligibility(
  context: RoosterEligibilityContext
): string | null {
  if (context.lineup_status !== 'verified') {
    return 'Rooster lineup must be verified before matching'
  }
  if (context.weight_status !== 'passed') {
    return 'Rooster must pass weighing before matching'
  }
  return null
}

export function isActiveMatchStatus(status: MatchStatus): boolean {
  return ACTIVE_MATCH_STATUSES.includes(status)
}

export function canLockMatchList(statuses: MatchStatus[]): string | null {
  if (statuses.length === 0) {
    return 'No matches to lock'
  }

  if (
    statuses.some((status) =>
      ['locked', 'ready', 'ongoing', 'completed'].includes(status)
    )
  ) {
    return 'Match list is already locked or in progress'
  }

  const invalid = statuses.filter((status) => !LOCKABLE_MATCH_STATUSES.includes(status))
  if (invalid.length > 0) {
    return 'All matches must be draft, for review, or confirmed before locking'
  }

  return null
}

export function isValidFightQueueTransition(
  current: FightQueueStatus | null,
  next: FightQueueStatus
): boolean {
  if (current == null) {
    return next === 'scheduled'
  }
  return FIGHT_QUEUE_TRANSITIONS[current].includes(next)
}

export function matchStatusForQueueStatus(
  queueStatus: FightQueueStatus
): MatchStatus | null {
  if (queueStatus === 'ready') return 'ready'
  if (queueStatus === 'ongoing') return 'ongoing'
  return null
}

export function collectUsedRoosterIds(
  matches: Array<{ meron_rooster_id: string; wala_rooster_id: string; status: MatchStatus }>
): Set<string> {
  const used = new Set<string>()
  for (const match of matches) {
    if (!isActiveMatchStatus(match.status)) continue
    used.add(match.meron_rooster_id)
    used.add(match.wala_rooster_id)
  }
  return used
}

export type MatchSidePaymentReadiness = {
  betPaymentStatus: MatchBetPaymentStatus
  entryOutstanding: number
}

export function isMatchSideQueueReady(side: MatchSidePaymentReadiness): boolean {
  if (side.betPaymentStatus !== 'paid') return false
  return side.entryOutstanding <= 0
}

export function isMatchQueueReady(
  meron: MatchSidePaymentReadiness,
  wala: MatchSidePaymentReadiness
): boolean {
  return isMatchSideQueueReady(meron) && isMatchSideQueueReady(wala)
}

export function canEditMatchBets(
  matchStatus: MatchStatus,
  betPaymentStatuses: MatchBetPaymentStatus[]
): boolean {
  if (!['draft', 'for_review', 'confirmed'].includes(matchStatus)) return false
  return betPaymentStatuses.every((status) => status === 'unpaid')
}
