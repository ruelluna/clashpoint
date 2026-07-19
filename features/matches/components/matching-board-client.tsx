'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react'
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
  createMatchAction,
  lockMatchListAction,
  updateFightQueueStatusAction,
  updateMatchBetAction,
  type MatchActionState,
} from '@/features/matches/actions'
import {
  FIGHT_QUEUE_STATUS_LABELS,
  MATCH_STATUS_LABELS,
} from '@/features/matches/schema'
import {
  fightQueueStatusColorPalette,
  matchStatusColorPalette,
} from '@/features/matches/display-utils'
import type { EligibleRooster, MatchListItem } from '@/features/matches/types'
import { FIGHT_QUEUE_TRANSITIONS } from '@/features/matches/utils'
import { COMPATIBILITY_STATUS_LABELS } from '@/lib/derby/enums'
import type { CompatibilityStatus } from '@/lib/derby/enums'

type MatchingBoardClientProps = {
  eventId: string
  eventName: string
  matches: MatchListItem[]
  queueMatches: MatchListItem[]
  eligibleRoosters: EligibleRooster[]
  canManage: boolean
}

const initialState: MatchActionState = {}

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

function BetEditForm({
  eventId,
  match,
  side,
  amount,
}: {
  eventId: string
  match: MatchListItem
  side: 'meron' | 'wala'
  amount: number
}) {
  const [state, action, pending] = useActionState(updateMatchBetAction, initialState)

  return (
    <form action={action} className="mt-1">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="side" value={side} />
      <Flex gap={2} align="center">
        <Input
          name="amount"
          type="number"
          min={0}
          step="0.01"
          size="xs"
          width="24"
          defaultValue={String(amount)}
        />
        <Button type="submit" size="xs" variant="outline" loading={pending}>
          Save
        </Button>
      </Flex>
      {state.error ? (
        <Text fontSize="xs" color="red.500" mt={1}>
          {state.error}
        </Text>
      ) : null}
      {state.success ? (
        <Text fontSize="xs" color="green.600" mt={1}>
          {state.success}
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
          </Box>
          <Box flex="1">
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
              Wala
            </Text>
            <Text fontWeight="medium">{match.wala.entry_name}</Text>
            <Text fontSize="sm" color="fg.muted">
              Bet {formatCurrency(match.wala.bet_amount)}
            </Text>
          </Box>
        </Flex>
        {canManage && nextStatus ? (
          <form action={action}>
            <input type="hidden" name="matchId" value={match.id} />
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="queueStatus" value={nextStatus} />
            <Button type="submit" size="sm" loading={pending}>
              Mark {FIGHT_QUEUE_STATUS_LABELS[nextStatus].toLowerCase()}
            </Button>
          </form>
        ) : null}
      </Flex>
      {state.error ? (
        <Text mt={2} fontSize="sm" color="red.fg">
          {state.error}
        </Text>
      ) : null}
    </Box>
  )
}

export function MatchingBoardClient({
  eventId,
  eventName,
  matches,
  queueMatches,
  eligibleRoosters,
  canManage,
}: MatchingBoardClientProps) {
  const [createState, createAction, createPending] = useActionState(
    createMatchAction,
    initialState
  )
  const [lockState, lockAction, lockPending] = useActionState(
    lockMatchListAction,
    initialState
  )

  const [meronRoosterId, setMeronRoosterId] = useState('')
  const [walaRoosterId, setWalaRoosterId] = useState('')
  const [compatibility, setCompatibility] = useState<MatchCompatibilityEvaluation | null>(
    null
  )
  const [compatibilityLoading, setCompatibilityLoading] = useState(false)
  const [compatibilityError, setCompatibilityError] = useState<string | null>(null)

  const roosterMap = useMemo(
    () => new Map(eligibleRoosters.map((rooster) => [rooster.rooster_id, rooster])),
    [eligibleRoosters]
  )

  const meronRooster = roosterMap.get(meronRoosterId)
  const walaRooster = roosterMap.get(walaRoosterId)

  useEffect(() => {
    if (!meronRoosterId || !walaRoosterId) {
      setCompatibility(null)
      setCompatibilityError(null)
      return
    }

    let cancelled = false
    setCompatibilityLoading(true)
    setCompatibilityError(null)

    evaluateMatchCompatibilityAction(eventId, meronRoosterId, walaRoosterId)
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
  }, [eventId, meronRoosterId, walaRoosterId])

  const hasLockableMatches = matches.some((match) =>
    ['draft', 'for_review', 'confirmed'].includes(match.status)
  )

  const ongoing = queueMatches.find((match) => match.queue_status === 'ongoing')

  const feedback =
    createState.error ??
    createState.success ??
    lockState.error ??
    lockState.success

  return (
    <PageStack>
      <PageHeader
        title="Matching"
        description={`Pair weighed roosters, record side bets, and advance the fight queue for ${eventName}.`}
      />

      {feedback ? (
        <Box
          rounded="md"
          px={3}
          py={2}
          fontSize="sm"
          bg={createState.error || lockState.error ? 'red.subtle' : 'green.subtle'}
          color={createState.error || lockState.error ? 'red.fg' : 'green.fg'}
        >
          {feedback}
        </Box>
      ) : null}

      {canManage ? (
        <PanelCard title="Create match">
          <form action={createAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input
              type="hidden"
              name="meronEntryId"
              value={meronRooster?.entry_id ?? ''}
            />
            <input
              type="hidden"
              name="walaEntryId"
              value={walaRooster?.entry_id ?? ''}
            />
            <Flex direction={{ base: 'column', md: 'row' }} gap={LAYOUT_GAP.form} mb={LAYOUT_GAP.form}>
              <Stack flex="1" gap={LAYOUT_GAP.form}>
                <FormField label="Meron" required>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      name="meronRoosterId"
                      value={meronRoosterId}
                      onChange={(event) => setMeronRoosterId(event.currentTarget.value)}
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
                <FormField label="Meron bet">
                  <Input name="meronBet" type="number" min={0} step="0.01" defaultValue="0" />
                </FormField>
              </Stack>
              <Stack flex="1" gap={LAYOUT_GAP.form}>
                <FormField label="Wala" required>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      name="walaRoosterId"
                      value={walaRoosterId}
                      onChange={(event) => setWalaRoosterId(event.currentTarget.value)}
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
                <FormField label="Wala bet">
                  <Input name="walaBet" type="number" min={0} step="0.01" defaultValue="0" />
                </FormField>
              </Stack>
            </Flex>
            {meronRoosterId && walaRoosterId ? (
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
                    {compatibility.weightDifferenceGrams != null ? (
                      <Text fontSize="sm" color="fg.muted">
                        Weight difference: {compatibility.weightDifferenceGrams} g
                      </Text>
                    ) : null}
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
              size="sm"
              loading={createPending}
              disabled={!meronRoosterId || !walaRoosterId}
              mt={LAYOUT_GAP.form}
            >
              Add match
            </Button>
          </form>
          {hasLockableMatches ? (
            <form action={lockAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <ButtonGroup mt={LAYOUT_GAP.buttons}>
                <Button type="submit" size="sm" variant="outline" loading={lockPending}>
                  Lock match list
                </Button>
              </ButtonGroup>
            </form>
          ) : null}
          {eligibleRoosters.length === 0 ? (
            <Text mt={3} fontSize="sm" color="fg.muted">
              No eligible roosters. Add roosters with weight on Rooster Entries first.
            </Text>
          ) : null}
        </PanelCard>
      ) : null}

      <PanelCard flush>
        <Flex
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor="border"
          fontSize="sm"
          fontWeight="medium"
          color="fg.muted"
          display={{ base: 'none', md: 'flex' }}
        >
          <Text flex="0 0 4rem">Fight</Text>
          <Text flex="1">Meron</Text>
          <Text flex="1">Wala</Text>
          <Text flex="0 0 6rem">Status</Text>
        </Flex>
        {matches.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No matches yet.</Text>
          </Box>
        ) : (
          matches.map((match) => {
            const canEditBets = ['draft', 'for_review', 'confirmed'].includes(match.status)

            return (
              <Flex
                key={match.id}
                direction={{ base: 'column', md: 'row' }}
                gap={{ base: 2, md: 0 }}
                px={4}
                py={3}
                borderBottomWidth="1px"
                borderColor="border"
                _last={{ borderBottomWidth: 0 }}
                fontSize="sm"
              >
                <Text flex="0 0 4rem" fontWeight="semibold">
                  #{match.fight_number}
                </Text>
                <Box flex="1">
                  <Text fontWeight="medium">{match.meron.entry_name}</Text>
                  <Text color="fg.muted">
                    Cock #{match.meron.cock_number} · {match.meron.band_number} ·{' '}
                    {formatWeight(match.meron.weight)}
                  </Text>
                  <Text color="fg.muted">Bet {formatCurrency(match.meron.bet_amount)}</Text>
                  {canManage && canEditBets ? (
                    <BetEditForm
                      eventId={eventId}
                      match={match}
                      side="meron"
                      amount={match.meron.bet_amount}
                    />
                  ) : null}
                </Box>
                <Box flex="1">
                  <Text fontWeight="medium">{match.wala.entry_name}</Text>
                  <Text color="fg.muted">
                    Cock #{match.wala.cock_number} · {match.wala.band_number} ·{' '}
                    {formatWeight(match.wala.weight)}
                  </Text>
                  <Text color="fg.muted">Bet {formatCurrency(match.wala.bet_amount)}</Text>
                  {canManage && canEditBets ? (
                    <BetEditForm
                      eventId={eventId}
                      match={match}
                      side="wala"
                      amount={match.wala.bet_amount}
                    />
                  ) : null}
                </Box>
                <Flex flex="0 0 6rem" align="center" gap={2}>
                  <Badge colorPalette={matchStatusColorPalette(match.status)} size="sm">
                    {MATCH_STATUS_LABELS[match.status]}
                  </Badge>
                  {match.queue_status ? (
                    <Badge colorPalette={fightQueueStatusColorPalette(match.queue_status)} size="sm">
                      {FIGHT_QUEUE_STATUS_LABELS[match.queue_status]}
                    </Badge>
                  ) : null}
                </Flex>
              </Flex>
            )
          })
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
                No fights in the queue. Lock the match list after creating matches.
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
