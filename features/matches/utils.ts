import type {
  FightQueueStatus,
  MatchBetPaymentStatus,
  MatchListItem,
  MatchStatus,
  RoosterEligibilityContext,
} from '@/features/matches/types'

const ACTIVE_MATCH_STATUSES: MatchStatus[] = [
  'draft',
  'for_review',
  'confirmed',
  'queued',
  'at_pit',
  'fighting',
]

const LOCKABLE_MATCH_STATUSES: MatchStatus[] = ['draft', 'for_review', 'confirmed']

export const FIGHT_QUEUE_TRANSITIONS: Record<
  FightQueueStatus,
  FightQueueStatus[]
> = {
  waiting: ['handlers_called'],
  handlers_called: ['birds_at_pit'],
  birds_at_pit: ['fighting'],
  fighting: [],
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
      ['queued', 'at_pit', 'fighting', 'completed'].includes(status)
    )
  ) {
    return 'Match list is already queued or in progress'
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
    return next === 'waiting'
  }
  return FIGHT_QUEUE_TRANSITIONS[current].includes(next)
}

export const FIGHT_QUEUE_ROLLBACK: Record<FightQueueStatus, FightQueueStatus | null> = {
  fighting: 'birds_at_pit',
  birds_at_pit: 'handlers_called',
  handlers_called: 'waiting',
  waiting: null,
}

export function previousQueueStatus(
  current: FightQueueStatus | null
): FightQueueStatus | null {
  if (!current) return null
  return FIGHT_QUEUE_ROLLBACK[current]
}

export function isValidFightQueueRollback(
  current: FightQueueStatus | null,
  previous: FightQueueStatus
): boolean {
  if (!current) return false
  return FIGHT_QUEUE_ROLLBACK[current] === previous
}

export function matchStatusForQueueStatus(
  queueStatus: FightQueueStatus
): MatchStatus | null {
  if (queueStatus === 'birds_at_pit') return 'at_pit'
  if (queueStatus === 'fighting') return 'fighting'
  return null
}

export function matchStatusForQueueStatusChange(
  targetQueue: FightQueueStatus,
  isRollback: boolean
): MatchStatus | null {
  if (isRollback) {
    if (targetQueue === 'waiting' || targetQueue === 'handlers_called') return 'queued'
    return matchStatusForQueueStatus(targetQueue)
  }
  return matchStatusForQueueStatus(targetQueue)
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

export const BLOCKED_BET_EDIT_QUEUE_STATUSES: FightQueueStatus[] = [
  'handlers_called',
  'birds_at_pit',
  'fighting',
]

export const PALITADA_EDITABLE_QUEUE_STATUSES: FightQueueStatus[] = [
  'waiting',
  'handlers_called',
  'birds_at_pit',
]

const MONEY_EPSILON = 0.005

export function roundMatchMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

export function isBetEditHardLocked(
  matchStatus: MatchStatus,
  queueStatus: FightQueueStatus | null
): boolean {
  if (matchStatus === 'completed' || matchStatus === 'cancelled' || matchStatus === 'settling') {
    return true
  }
  if (queueStatus && BLOCKED_BET_EDIT_QUEUE_STATUSES.includes(queueStatus)) return true
  return false
}

export function isPalitadaEditLocked(
  matchStatus: MatchStatus,
  queueStatus: FightQueueStatus | null
): boolean {
  if (matchStatus === 'completed' || matchStatus === 'cancelled' || matchStatus === 'settling') {
    return true
  }
  if (queueStatus === 'fighting') return true
  return false
}

export function canEditMatchBetAmounts(
  matchStatus: MatchStatus,
  queueStatus: FightQueueStatus | null
): boolean {
  return !isBetEditHardLocked(matchStatus, queueStatus)
}

export function getMatchBetAdjustmentDelta(
  agreedAmount: number,
  collectedAmount: number
): number {
  return roundMatchMoney(agreedAmount - collectedAmount)
}

export function isMatchBetSideSettled(
  agreedAmount: number,
  collectedAmount: number,
  paymentStatus: MatchBetPaymentStatus
): boolean {
  if (paymentStatus !== 'paid') return false
  return Math.abs(getMatchBetAdjustmentDelta(agreedAmount, collectedAmount)) < MONEY_EPSILON
}

export type MatchSideSettlement = {
  betPaymentStatus: MatchBetPaymentStatus
  entryOutstanding: number
  agreedAmount: number
  collectedAmount: number
}

export type MatchSidePaymentReadiness = MatchSideSettlement

export function isMatchSideQueueReady(side: MatchSideSettlement): boolean {
  if (!isMatchBetSideSettled(side.agreedAmount, side.collectedAmount, side.betPaymentStatus)) {
    return false
  }
  return side.entryOutstanding <= 0
}

export function isMatchQueueReady(
  meron: MatchSideSettlement,
  wala: MatchSideSettlement
): boolean {
  return isMatchSideQueueReady(meron) && isMatchSideQueueReady(wala)
}

export function getFightQueueAdvanceBlockReason(
  currentQueue: FightQueueStatus | null,
  nextQueue: FightQueueStatus,
  meron: MatchSideSettlement,
  wala: MatchSideSettlement
): string | null {
  if (currentQueue === 'waiting' && nextQueue === 'handlers_called') {
    if (!isMatchQueueReady(meron, wala)) {
      return 'Settle pledge adjustments at Cashier Terminal before staff call handlers for this fight.'
    }
  }
  return null
}

export function canEditMatchBets(
  matchStatus: MatchStatus,
  betPaymentStatuses: MatchBetPaymentStatus[],
  queueStatus: FightQueueStatus | null = null
): boolean {
  if (!canEditMatchBetAmounts(matchStatus, queueStatus)) return false
  if (betPaymentStatuses.every((status) => status === 'unpaid')) return true
  return canEditMatchBetAmounts(matchStatus, queueStatus)
}

export const ACTIVE_CALLED_QUEUE_STATUSES: FightQueueStatus[] = [
  'handlers_called',
  'birds_at_pit',
  'fighting',
]

const QUEUE_STATUS_PRIORITY: Record<FightQueueStatus, number> = {
  fighting: 3,
  birds_at_pit: 2,
  handlers_called: 1,
  waiting: 0,
}

const BET_BALANCING_QUEUE_PRIORITY: Record<FightQueueStatus, number> = {
  birds_at_pit: 3,
  handlers_called: 2,
  waiting: 1,
  fighting: 0,
}

export function palitadaContributionFingerprint(
  match: Pick<MatchListItem, 'meron_palitada' | 'wala_palitada'>
): string {
  return [...match.meron_palitada, ...match.wala_palitada]
    .map((contributor) => contributor.id)
    .sort()
    .join('|')
}

export function resolveBetBalancingTargetMatch(
  queueMatches: MatchListItem[]
): MatchListItem | null {
  const candidates = queueMatches.filter(
    (match) =>
      match.queue_status != null &&
      PALITADA_EDITABLE_QUEUE_STATUSES.includes(match.queue_status)
  )

  if (candidates.length === 0) return null

  return [...candidates].sort((left, right) => {
    const priorityDiff =
      BET_BALANCING_QUEUE_PRIORITY[right.queue_status!] -
      BET_BALANCING_QUEUE_PRIORITY[left.queue_status!]
    if (priorityDiff !== 0) return priorityDiff
    return left.fight_number - right.fight_number
  })[0]!
}

/** @deprecated Use resolveBetBalancingTargetMatch */
export function resolvePalitadaTargetMatch(queueMatches: MatchListItem[]): MatchListItem | null {
  return resolveBetBalancingTargetMatch(queueMatches)
}

export function resolveActiveMatch(queueMatches: MatchListItem[]): MatchListItem | null {
  const candidates = queueMatches.filter(
    (match) =>
      match.queue_status != null &&
      ACTIVE_CALLED_QUEUE_STATUSES.includes(match.queue_status)
  )

  if (candidates.length === 0) return null

  return [...candidates].sort((left, right) => {
    const priorityDiff =
      QUEUE_STATUS_PRIORITY[right.queue_status!] -
      QUEUE_STATUS_PRIORITY[left.queue_status!]
    if (priorityDiff !== 0) return priorityDiff
    return left.fight_number - right.fight_number
  })[0]
}
