'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  Link,
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useMemo, useState } from 'react'

import {
  ButtonGroup,
  FormField,
  LAYOUT_GAP,
  PageHeader,
  PageStack,
  PanelCard,
} from '@/components/dashboard'
import { evaluateMatchCompatibilityAction } from '@/features/eligibility/actions'
import type { MatchCompatibilityEvaluation } from '@/features/compatibility/types'
import {
  cancelMatchAction,
  createMatchAction,
  updateFightQueueStatusAction,
  updateMatchBetAmountsAction,
  type MatchActionState,
} from '@/features/matches/actions'
import { MatchingRoosterScanRow } from '@/features/matches/components/matching-rooster-scan-row'
import {
  FIGHT_QUEUE_STATUS_LABELS,
  MATCH_BET_PAYMENT_STATUS_LABELS,
  MATCH_STATUS_LABELS,
} from '@/features/matches/schema'
import {
  fightQueueStatusColorPalette,
  matchStatusColorPalette,
} from '@/features/matches/display-utils'
import type { EligibleRooster, MatchListItem } from '@/features/matches/types'
import {
  FIGHT_QUEUE_TRANSITIONS,
  canEditMatchBetAmounts,
  getMatchBetAdjustmentDelta,
  isMatchBetSideSettled,
} from '@/features/matches/utils'
import { COMPATIBILITY_STATUS_LABELS } from '@/lib/derby/enums'
import type { CompatibilityStatus } from '@/lib/derby/enums'

type MatchingBoardClientProps = {
  eventId: string
  eventName: string
  awaitingPaymentMatches: MatchListItem[]
  queueMatches: MatchListItem[]
  eligibleRoosters: EligibleRooster[]
  canManage: boolean
}

const initialState: MatchActionState = {}

function statusColor(
  status: MatchListItem['status']
): 'gray' | 'blue' | 'green' | 'orange' | 'purple' | 'red' {
  switch (status) {
    case 'draft':
      return 'gray'
    case 'for_review':
      return 'orange'
    case 'confirmed':
      return 'blue'
    case 'locked':
      return 'purple'
    case 'ready':
    case 'ongoing':
      return 'green'
    case 'cancelled':
      return 'red'
    default:
      return 'gray'
  }
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

function queueColor(
  status: MatchListItem['queue_status']
): 'gray' | 'blue' | 'orange' | 'green' | 'purple' {
  switch (status) {
    case 'scheduled':
      return 'gray'
    case 'called':
      return 'blue'
    case 'ready':
      return 'orange'
    case 'ongoing':
      return 'green'
    default:
      return 'purple'
  }
}

function formatWeight(weight: number | null) {
  if (weight == null) return '—'
  return `${weight.toFixed(2)} kg`
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function roosterLabel(rooster: EligibleRooster) {
  return `#${rooster.cock_number} · ${rooster.band_number} · ${rooster.entry_name} (${rooster.entry_number})`
}

function nextQueueStatus(
  current: MatchListItem['queue_status']
): MatchListItem['queue_status'] | null {
  if (!current) return 'scheduled'
  const options = FIGHT_QUEUE_TRANSITIONS[current]
  return options[0] ?? null
}

function compatibilityColor(
  status: CompatibilityStatus
): 'green' | 'orange' | 'red' | 'gray' {
  switch (status) {
    case 'compatible':
      return 'green'
    case 'approval_required':
      return 'orange'
    case 'prohibited':
      return 'red'
    default:
      return 'gray'
  }
}

function SidePaymentBadges({ side }: { side: MatchListItem['meron'] }) {
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
          Collect {formatCurrency(adjustmentDelta)}
        </Badge>
      ) : null}
      {side.bet_payment_status === 'paid' && !settled && adjustmentDelta < 0 ? (
        <Badge size="sm" colorPalette="orange">
          Refund {formatCurrency(Math.abs(adjustmentDelta))}
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

function AdjustPledgeForm({
  eventId,
  match,
  canManage,
}: {
  eventId: string
  match: MatchListItem
  canManage: boolean
}) {
  const [state, action, pending] = useActionState(updateMatchBetAmountsAction, initialState)

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

function matchSideSettled(side: MatchListItem['meron']): boolean {
  if (side.bet_payment_status === 'unpaid') return false
  return isMatchBetSideSettled(
    side.bet_amount,
    side.bet_collected_amount,
    side.bet_payment_status
  )
}

function matchPledgesSettled(match: MatchListItem): boolean {
  return matchSideSettled(match.meron) && matchSideSettled(match.wala)
}

function CancelMatchForm({
  eventId,
  matchId,
  canManage,
}: {
  eventId: string
  matchId: string
  canManage: boolean
}) {
  const [state, action, pending] = useActionState(cancelMatchAction, initialState)
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

function FightQueueRow({
  match,
  eventId,
  canManage,
}: {
  match: MatchListItem
  eventId: string
  canManage: boolean
}) {
  const [state, action, pending] = useActionState(
    updateFightQueueStatusAction,
    initialState
  )

  const nextStatus = nextQueueStatus(match.queue_status)
  const callBlocked =
    match.queue_status === 'scheduled' &&
    nextStatus === 'called' &&
    !matchPledgesSettled(match)

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
              Bet {formatCurrency(match.meron.bet_amount)}
            </Text>
            <SidePaymentBadges side={match.meron} />
          </Box>
          <Box flex="1">
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
              Wala
            </Text>
            <Text fontWeight="medium">{match.wala.entry_name}</Text>
            <Text fontSize="sm" color="fg.muted">
              Bet {formatCurrency(match.wala.bet_amount)}
            </Text>
            <SidePaymentBadges side={match.wala} />
          </Box>
        </Flex>
        {canManage && nextStatus ? (
          <Stack gap={2} align={{ base: 'flex-start', lg: 'flex-end' }}>
            <form action={action}>
              <input type="hidden" name="matchId" value={match.id} />
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="queueStatus" value={nextStatus} />
              <Button type="submit" size="sm" loading={pending} disabled={callBlocked}>
                Mark {FIGHT_QUEUE_STATUS_LABELS[nextStatus].toLowerCase()}
              </Button>
            </form>
            {callBlocked ? (
              <Text fontSize="xs" color="orange.fg" maxW="xs">
                Settle pledge adjustments at Cashier Terminal before calling this fight.
              </Text>
            ) : null}
          </Stack>
        ) : null}
        <AdjustPledgeForm eventId={eventId} match={match} canManage={canManage} />
      </Flex>
      {state.error ? (
        <Text mt={2} fontSize="sm" color="red.fg">
          {state.error}
        </Text>
      ) : null}
    </Box>
  )
}

function RoosterCard({
  label,
  rooster,
  onClear,
}: {
  label: string
  rooster: EligibleRooster | undefined
  onClear: () => void
}) {
  if (!rooster) {
    return (
      <Text fontSize="sm" color="fg.muted">
        No {label.toLowerCase()} selected
      </Text>
    )
  }

  return (
    <Box p={3} rounded="md" borderWidth="1px" borderColor="border" bg="bg.subtle">
      <Flex justify="space-between" align="start" gap={2}>
        <Stack gap={1}>
          <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
            {label}
          </Text>
          <Text fontWeight="medium">{rooster.entry_name}</Text>
          <Text fontSize="sm" color="fg.muted">
            {roosterLabel(rooster)} · {formatWeight(rooster.official_weight)}
          </Text>
        </Stack>
        <Button size="xs" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </Flex>
    </Box>
  )
}

export function MatchingBoardClient({
  eventId,
  eventName,
  awaitingPaymentMatches,
  queueMatches,
  eligibleRoosters,
  canManage,
}: MatchingBoardClientProps) {
  const router = useRouter()
  const [createState, createAction, createPending] = useActionState(
    createMatchAction,
    initialState
  )

  const [meronRooster, setMeronRooster] = useState<EligibleRooster | null>(null)
  const [walaRooster, setWalaRooster] = useState<EligibleRooster | null>(null)
  const [compatibility, setCompatibility] = useState<MatchCompatibilityEvaluation | null>(
    null
  )
  const [compatibilityLoading, setCompatibilityLoading] = useState(false)
  const [compatibilityError, setCompatibilityError] = useState<string | null>(null)

  const roosterMap = useMemo(
    () => new Map(eligibleRoosters.map((rooster) => [rooster.rooster_id, rooster])),
    [eligibleRoosters]
  )

  useEffect(() => {
    if (createState.matchId) {
      router.push(`/dashboard/events/${eventId}/matching/${createState.matchId}/print`)
    }
  }, [createState.matchId, eventId, router])

  useEffect(() => {
    const meronId = meronRooster?.rooster_id
    const walaId = walaRooster?.rooster_id
    if (!meronId || !walaId) {
      setCompatibility(null)
      setCompatibilityError(null)
      return
    }

    let cancelled = false
    setCompatibilityLoading(true)
    setCompatibilityError(null)

    evaluateMatchCompatibilityAction(eventId, meronId, walaId)
      .then((result) => {
        if (cancelled) return
        if (result.error) {
          setCompatibility(null)
          setCompatibilityError(result.error)
          return
        }
        setCompatibility(result.evaluation ?? null)
      })
      .finally(() => {
        if (!cancelled) setCompatibilityLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [eventId, meronRooster?.rooster_id, walaRooster?.rooster_id])

  const ongoing = queueMatches.find((match) => match.queue_status === 'ongoing')

  const feedback = createState.error ?? (createState.matchId ? null : createState.success)

  function selectFromDropdown(roosterId: string, side: 'meron' | 'wala') {
    const rooster = roosterMap.get(roosterId)
    if (!rooster) return
    if (side === 'meron') setMeronRooster(rooster)
    else setWalaRooster(rooster)
  }

  return (
    <PageStack>
      <PageHeader
        title="Matching"
        description={`Pair roosters and record pledge amounts for ${eventName}. Handlers pay at Cashier Terminal — matching staff do not collect payments.`}
      />

      {feedback ? (
        <Box
          rounded="md"
          px={3}
          py={2}
          fontSize="sm"
          bg={createState.error ? 'red.subtle' : 'green.subtle'}
          color={createState.error ? 'red.fg' : 'green.fg'}
        >
          {feedback}
        </Box>
      ) : null}

      {canManage ? (
        <PanelCard title="Matching desk">
          <form action={createAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="meronEntryId" value={meronRooster?.entry_id ?? ''} />
            <input type="hidden" name="walaEntryId" value={walaRooster?.entry_id ?? ''} />
            <input type="hidden" name="meronRoosterId" value={meronRooster?.rooster_id ?? ''} />
            <input type="hidden" name="walaRoosterId" value={walaRooster?.rooster_id ?? ''} />

            <Flex direction={{ base: 'column', lg: 'row' }} gap={LAYOUT_GAP.form}>
              <Stack flex="1" gap={LAYOUT_GAP.form}>
                <MatchingRoosterScanRow
                  eventId={eventId}
                  label="Meron"
                  onResolved={setMeronRooster}
                />
                <FormField label="Or select meron">
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={meronRooster?.rooster_id ?? ''}
                      onChange={(event) =>
                        selectFromDropdown(event.currentTarget.value, 'meron')
                      }
                    >
                      <option value="">Select rooster</option>
                      {eligibleRoosters.map((rooster) => (
                        <option key={rooster.rooster_id} value={rooster.rooster_id}>
                          {roosterLabel(rooster)} · {formatWeight(rooster.official_weight)}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </FormField>
                <RoosterCard
                  label="Meron"
                  rooster={meronRooster ?? undefined}
                  onClear={() => setMeronRooster(null)}
                />
                <FormField label="Meron pledge (₱)" required>
                  <Input
                    name="meronBet"
                    type="number"
                    min={0.01}
                    step="0.01"
                    placeholder="Amount"
                    required
                  />
                </FormField>
              </Stack>

              <Stack flex="1" gap={LAYOUT_GAP.form}>
                <MatchingRoosterScanRow
                  eventId={eventId}
                  label="Wala"
                  onResolved={setWalaRooster}
                />
                <FormField label="Or select wala">
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={walaRooster?.rooster_id ?? ''}
                      onChange={(event) =>
                        selectFromDropdown(event.currentTarget.value, 'wala')
                      }
                    >
                      <option value="">Select rooster</option>
                      {eligibleRoosters.map((rooster) => (
                        <option key={rooster.rooster_id} value={rooster.rooster_id}>
                          {roosterLabel(rooster)} · {formatWeight(rooster.official_weight)}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </FormField>
                <RoosterCard
                  label="Wala"
                  rooster={walaRooster ?? undefined}
                  onClear={() => setWalaRooster(null)}
                />
                <FormField label="Wala pledge (₱)" required>
                  <Input
                    name="walaBet"
                    type="number"
                    min={0.01}
                    step="0.01"
                    placeholder="Amount"
                    required
                  />
                </FormField>
              </Stack>
            </Flex>

            {meronRooster && walaRooster ? (
              <Box
                mt={LAYOUT_GAP.form}
                p={3}
                rounded="md"
                borderWidth="1px"
                borderColor="border"
                bg="bg.subtle"
              >
                {compatibilityLoading ? (
                  <Text fontSize="sm" color="fg.muted">
                    Checking compatibility…
                  </Text>
                ) : compatibilityError ? (
                  <Text fontSize="sm" color="red.fg">
                    {compatibilityError}
                  </Text>
                ) : compatibility ? (
                  <Stack gap={2}>
                    <Flex align="center" gap={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        Match compatibility
                      </Text>
                      <Badge colorPalette={compatibilityColor(compatibility.status)} size="sm">
                        {COMPATIBILITY_STATUS_LABELS[compatibility.status]}
                      </Badge>
                    </Flex>
                    {compatibility.reasons.length > 0 ? (
                      <Stack gap={1}>
                        {compatibility.reasons.map((reason) => (
                          <Text key={reason} fontSize="sm" color="fg.muted">
                            · {reason}
                          </Text>
                        ))}
                      </Stack>
                    ) : (
                      <Text fontSize="sm" color="fg.muted">
                        No compatibility issues detected.
                      </Text>
                    )}
                  </Stack>
                ) : null}
              </Box>
            ) : null}

            <Button
              type="submit"
              size="md"
              loading={createPending}
              disabled={!meronRooster || !walaRooster}
              mt={LAYOUT_GAP.form}
            >
              Create match & print slips
            </Button>
          </form>

          {eligibleRoosters.length === 0 ? (
            <Text mt={3} fontSize="sm" color="fg.muted">
              No eligible roosters. Complete weighing and inspection first.
            </Text>
          ) : null}
        </PanelCard>
      ) : null}

      <PanelCard title="Awaiting cashier payment">
        <Stack gap={2} mb={3}>
          <Text fontSize="sm" color="fg.muted">
            Matching staff do not collect payments. Direct each handler to{' '}
            <Text as="span" fontWeight="medium">
              Cashier Terminal
            </Text>{' '}
            with their rooster COCK- barcode or printed BET- pledge slip.
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Matches enter the fight queue automatically after both sides pay pledges and any
            enabled entry fees are cleared.
          </Text>
          <Button asChild size="sm" variant="outline" alignSelf="flex-start">
            <Link href={`/dashboard/events/${eventId}/payments`}>Open Cashier Terminal</Link>
          </Button>
        </Stack>
        {awaitingPaymentMatches.length === 0 ? (
          <Text color="fg.muted" fontSize="sm">
            No matches awaiting cashier payment.
          </Text>
        ) : (
          awaitingPaymentMatches.map((match) => (
              <Box
                key={match.id}
                py={3}
                borderBottomWidth="1px"
                borderColor="border"
                _last={{ borderBottomWidth: 0 }}
              >
                <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                  <Text fontWeight="semibold" flex="0 0 4rem">
                    #{match.fight_number}
                  </Text>
                  <Box flex="1">
                    <Text fontWeight="medium">{match.meron.entry_name}</Text>
                    <Text fontSize="sm" color="fg.muted">
                      Cock #{match.meron.cock_number} · Bet {formatCurrency(match.meron.bet_amount)}
                    </Text>
                    <SidePaymentBadges side={match.meron} />
                  </Box>
                  <Box flex="1">
                    <Text fontWeight="medium">{match.wala.entry_name}</Text>
                    <Text fontSize="sm" color="fg.muted">
                      Cock #{match.wala.cock_number} · Bet {formatCurrency(match.wala.bet_amount)}
                    </Text>
                    <SidePaymentBadges side={match.wala} />
                  </Box>
                  <Stack gap={2} align={{ base: 'flex-start', md: 'flex-end' }}>
                    <Badge colorPalette={statusColor(match.status)} size="sm">
                      {MATCH_STATUS_LABELS[match.status]}
                    </Badge>
                    {canManage && match.meron.bet_barcode ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/events/${eventId}/matching/${match.id}/print`}>
                          Print slips
                        </Link>
                      </Button>
                    ) : null}
                    {canManage ? (
                      <CancelMatchForm
                        eventId={eventId}
                        matchId={match.id}
                        canManage={canManage}
                      />
                    ) : null}
                    <AdjustPledgeForm eventId={eventId} match={match} canManage={canManage} />
                  </Stack>
                </Flex>
              </Box>
            ))
        )}
      </PanelCard>

      <Stack gap={LAYOUT_GAP.section}>
        <Text fontSize="lg" fontWeight="semibold">
          Fight queue
        </Text>
        {ongoing ? (
          <PanelCard>
            <Text fontWeight="medium" color="green.fg">
              Now fighting: #{ongoing.fight_number}
            </Text>
            <Text fontSize="sm" color="green.fg">
              {ongoing.meron.entry_name} vs {ongoing.wala.entry_name}
            </Text>
          </PanelCard>
        ) : null}
        <PanelCard flush>
          {queueMatches.length === 0 ? (
            <Box px={4} py={8} textAlign="center">
              <Text color="fg.muted">
                No fights in the queue yet. Matches appear here after both sides pay.
              </Text>
            </Box>
          ) : (
            queueMatches.map((match) => (
              <FightQueueRow
                key={match.id}
                match={match}
                eventId={eventId}
                canManage={canManage}
              />
            ))
          )}
        </PanelCard>
      </Stack>
    </PageStack>
  )
}
