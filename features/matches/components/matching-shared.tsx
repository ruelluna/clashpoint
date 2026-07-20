'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useActionState } from 'react'

import { FormField } from '@/components/dashboard'
import {
  cancelMatchAction,
  updateFightQueueStatusAction,
  updateMatchBetAmountsAction,
  type MatchActionState,
} from '@/features/matches/actions'
import {
  FIGHT_QUEUE_ADVANCE_ACTION_LABELS,
  FIGHT_QUEUE_STATUS_LABELS,
  MATCH_BET_PAYMENT_STATUS_LABELS,
} from '@/features/matches/schema'
import { fightQueueStatusColorPalette } from '@/features/matches/display-utils'
import type { EligibleRooster, MatchListItem } from '@/features/matches/types'
import {
  FIGHT_QUEUE_TRANSITIONS,
  canEditMatchBetAmounts,
  getMatchBetAdjustmentDelta,
  isMatchBetSideSettled,
  previousQueueStatus,
} from '@/features/matches/utils'

export const initialMatchActionState: MatchActionState = {}

export function formatWeight(weight: number | null) {
  if (weight == null) return '—'
  return `${weight.toFixed(2)} kg`
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyDetailed(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export function roosterLabel(rooster: EligibleRooster) {
  return `#${rooster.cock_number} · ${rooster.band_number} · ${rooster.entry_name} (${rooster.entry_number})`
}

export function nextQueueStatus(
  current: MatchListItem['queue_status']
): MatchListItem['queue_status'] | null {
  if (!current) return 'waiting'
  const options = FIGHT_QUEUE_TRANSITIONS[current]
  return options[0] ?? null
}

function betPaymentColor(
  status: MatchListItem['meron']['bet_payment_status']
): 'gray' | 'green' | 'orange' {
  switch (status) {
    case 'paid':
      return 'green'
    case 'refunded':
      return 'orange'
    default:
      return 'gray'
  }
}

export function SidePaymentBadges({ side }: { side: MatchListItem['meron'] }) {
  const adjustmentDelta = getMatchBetAdjustmentDelta(
    side.bet_amount,
    side.bet_collected_amount
  )
  const settled =
    side.bet_payment_status === 'unpaid' ||
    isMatchBetSideSettled(side.bet_amount, side.bet_collected_amount, side.bet_payment_status)

  return (
    <Flex gap={2} wrap="wrap" mt={1}>
      <Badge size="sm" colorPalette={betPaymentColor(side.bet_payment_status)}>
        Pledge {MATCH_BET_PAYMENT_STATUS_LABELS[side.bet_payment_status]}
      </Badge>
      {side.bet_payment_status === 'paid' && !settled && adjustmentDelta > 0 ? (
        <Badge size="sm" colorPalette="orange">
          Collect {formatCurrencyDetailed(adjustmentDelta)}
        </Badge>
      ) : null}
      {side.bet_payment_status === 'paid' && !settled && adjustmentDelta < 0 ? (
        <Badge size="sm" colorPalette="orange">
          Refund {formatCurrencyDetailed(Math.abs(adjustmentDelta))}
        </Badge>
      ) : null}
      {side.bet_barcode ? (
        <Text fontSize="xs" color="fg.muted">
          {side.bet_barcode}
        </Text>
      ) : null}
    </Flex>
  )
}

export function matchSideSettled(side: MatchListItem['meron']): boolean {
  if (side.bet_payment_status === 'unpaid') return false
  return isMatchBetSideSettled(
    side.bet_amount,
    side.bet_collected_amount,
    side.bet_payment_status
  )
}

export function matchPledgesSettled(match: MatchListItem): boolean {
  return matchSideSettled(match.meron) && matchSideSettled(match.wala)
}

export function AdjustPledgeForm({
  eventId,
  match,
  canManage,
}: {
  eventId: string
  match: MatchListItem
  canManage: boolean
}) {
  const [state, action, pending] = useActionState(
    updateMatchBetAmountsAction,
    initialMatchActionState
  )

  if (!canManage) return null
  if (!canEditMatchBetAmounts(match.status, match.queue_status)) return null

  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="matchId" value={match.id} />
      <Stack gap={2} mt={2} maxW="md">
        <Text fontSize="sm" fontWeight="medium">
          Adjust pledge
        </Text>
        <Flex direction={{ base: 'column', sm: 'row' }} gap={2}>
          <FormField label="Meron (₱)">
            <Input
              name="meronBet"
              type="number"
              min="0"
              step="0.01"
              defaultValue={String(match.meron.bet_amount)}
              size="sm"
            />
          </FormField>
          <FormField label="Wala (₱)">
            <Input
              name="walaBet"
              type="number"
              min="0"
              step="0.01"
              defaultValue={String(match.wala.bet_amount)}
              size="sm"
            />
          </FormField>
        </Flex>
        <Button type="submit" size="sm" variant="outline" loading={pending}>
          Save pledge changes
        </Button>
        {state.error ? (
          <Text fontSize="xs" color="red.500">
            {state.error}
          </Text>
        ) : null}
        {state.success ? (
          <Text fontSize="xs" color="green.600">
            {state.success}
          </Text>
        ) : null}
      </Stack>
    </form>
  )
}

export function CancelMatchForm({
  eventId,
  matchId,
  canManage,
}: {
  eventId: string
  matchId: string
  canManage: boolean
}) {
  const [state, action, pending] = useActionState(cancelMatchAction, initialMatchActionState)
  if (!canManage) return null

  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="matchId" value={matchId} />
      <Button type="submit" size="xs" variant="outline" colorPalette="red" loading={pending}>
        Cancel match
      </Button>
      {state.error ? (
        <Text fontSize="xs" color="red.500" mt={1}>
          {state.error}
        </Text>
      ) : null}
    </form>
  )
}

export function FightQueueAdvanceForm({
  match,
  eventId,
  canManage,
  canManageQueueOverride = false,
}: {
  match: MatchListItem
  eventId: string
  canManage: boolean
  canManageQueueOverride?: boolean
}) {
  const [advanceState, advanceAction, advancePending] = useActionState(
    updateFightQueueStatusAction,
    initialMatchActionState
  )
  const [rollbackState, rollbackAction, rollbackPending] = useActionState(
    updateFightQueueStatusAction,
    initialMatchActionState
  )

  const nextStatus = nextQueueStatus(match.queue_status)
  const prevStatus = previousQueueStatus(match.queue_status)
  const callBlocked =
    match.queue_status === 'waiting' &&
    nextStatus === 'handlers_called' &&
    !matchPledgesSettled(match)

  const state = advanceState.error || advanceState.success ? advanceState : rollbackState

  if (!canManage) return null

  return (
    <Stack gap={2} align={{ base: 'flex-start', lg: 'flex-end' }}>
      <Flex gap={2} wrap="wrap">
        {nextStatus ? (
          <form action={advanceAction}>
            <input type="hidden" name="matchId" value={match.id} />
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="queueStatus" value={nextStatus} />
            <input type="hidden" name="direction" value="advance" />
            <Button type="submit" size="sm" loading={advancePending} disabled={callBlocked}>
              {FIGHT_QUEUE_ADVANCE_ACTION_LABELS[nextStatus]}
            </Button>
          </form>
        ) : null}
        {canManageQueueOverride && prevStatus ? (
          <form action={rollbackAction}>
            <input type="hidden" name="matchId" value={match.id} />
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="queueStatus" value={prevStatus} />
            <input type="hidden" name="direction" value="rollback" />
            <Button type="submit" size="sm" variant="outline" loading={rollbackPending}>
              Step back
            </Button>
          </form>
        ) : null}
      </Flex>
      {callBlocked ? (
        <Text fontSize="xs" color="orange.fg" maxW="xs">
          Settle pledge adjustments at Cashier Terminal before staff call handlers for this fight.
        </Text>
      ) : null}
      {state.error ? (
        <Text fontSize="xs" color="red.fg">
          {state.error}
        </Text>
      ) : null}
      {state.success ? (
        <Text fontSize="xs" color="green.600">
          {state.success}
        </Text>
      ) : null}
    </Stack>
  )
}

export function FightQueueRow({
  match,
  eventId,
  canManage,
  canManageQueueOverride = false,
}: {
  match: MatchListItem
  eventId: string
  canManage: boolean
  canManageQueueOverride?: boolean
}) {
  return (
    <Box px={4} py={3} borderBottomWidth="1px" borderColor="border" _last={{ borderBottomWidth: 0 }}>
      <Flex direction={{ base: 'column', lg: 'row' }} gap={4} align={{ lg: 'center' }}>
        <Flex align="center" gap={3} flexShrink={0}>
          <Text fontSize="lg" fontWeight="semibold">
            #{match.fight_number}
          </Text>
          {match.queue_status ? (
            <Badge colorPalette={fightQueueStatusColorPalette(match.queue_status)} size="sm">
              {FIGHT_QUEUE_STATUS_LABELS[match.queue_status]}
            </Badge>
          ) : null}
        </Flex>
        <Flex flex="1" direction={{ base: 'column', md: 'row' }} gap={4}>
          <Box flex="1">
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
              Meron
            </Text>
            <Text fontWeight="medium">{match.meron.entry_name}</Text>
            <Text fontSize="sm" color="fg.muted">
              Bet {formatCurrencyDetailed(match.meron.bet_amount)}
            </Text>
            <SidePaymentBadges side={match.meron} />
          </Box>
          <Box flex="1">
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
              Wala
            </Text>
            <Text fontWeight="medium">{match.wala.entry_name}</Text>
            <Text fontSize="sm" color="fg.muted">
              Bet {formatCurrencyDetailed(match.wala.bet_amount)}
            </Text>
            <SidePaymentBadges side={match.wala} />
          </Box>
        </Flex>
        <FightQueueAdvanceForm
          match={match}
          eventId={eventId}
          canManage={canManage}
          canManageQueueOverride={canManageQueueOverride}
        />
        <AdjustPledgeForm eventId={eventId} match={match} canManage={canManage} />
      </Flex>
    </Box>
  )
}
