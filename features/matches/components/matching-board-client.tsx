'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  NativeSelect,
  Text,
} from '@chakra-ui/react'
import { useActionState, useMemo, useState } from 'react'

import {
  createMatchAction,
  lockMatchListAction,
  type MatchActionState,
} from '@/features/matches/actions'
import {
  FIGHT_QUEUE_STATUS_LABELS,
  MATCH_STATUS_LABELS,
} from '@/features/matches/schema'
import type { EligibleRooster, MatchListItem } from '@/features/matches/types'

type MatchingBoardClientProps = {
  eventId: string
  eventName: string
  matches: MatchListItem[]
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

function formatWeight(weight: number | null) {
  if (weight == null) return '—'
  return `${weight.toFixed(2)} kg`
}

function roosterLabel(rooster: EligibleRooster) {
  return `#${rooster.cock_number} · ${rooster.band_number} · ${rooster.entry_name} (${rooster.entry_number})`
}

export function MatchingBoardClient({
  eventId,
  eventName,
  matches,
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

  const roosterMap = useMemo(
    () => new Map(eligibleRoosters.map((rooster) => [rooster.rooster_id, rooster])),
    [eligibleRoosters]
  )

  const meronRooster = roosterMap.get(meronRoosterId)
  const walaRooster = roosterMap.get(walaRoosterId)

  const hasLockableMatches = matches.some((match) =>
    ['draft', 'for_review', 'confirmed'].includes(match.status)
  )

  const feedback = createState.error ?? createState.success ?? lockState.error ?? lockState.success

  return (
    <Box className="space-y-6">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          Matching
        </Text>
        <Text color="fg.muted">
          Pair verified, weighed roosters for {eventName}.
        </Text>
      </Box>

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
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
          <Text fontWeight="medium" mb={4}>
            Create match
          </Text>
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
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={4}>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Meron
                </Text>
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
              </Box>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Wala
                </Text>
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
              </Box>
            </Flex>
            <Button
              type="submit"
              size="sm"
              loading={createPending}
              disabled={!meronRoosterId || !walaRoosterId}
            >
              Add match
            </Button>
          </form>
          {hasLockableMatches ? (
            <form action={lockAction} style={{ marginTop: '0.75rem' }}>
              <input type="hidden" name="eventId" value={eventId} />
              <Button type="submit" size="sm" variant="outline" loading={lockPending}>
                Lock match list
              </Button>
            </form>
          ) : null}
          {eligibleRoosters.length === 0 ? (
            <Text mt={3} fontSize="sm" color="fg.muted">
              No eligible roosters. Verify lineups and complete weighing first.
            </Text>
          ) : null}
        </Box>
      ) : null}

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
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
          matches.map((match) => (
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
              </Box>
              <Box flex="1">
                <Text fontWeight="medium">{match.wala.entry_name}</Text>
                <Text color="fg.muted">
                  Cock #{match.wala.cock_number} · {match.wala.band_number} ·{' '}
                  {formatWeight(match.wala.weight)}
                </Text>
              </Box>
              <Flex flex="0 0 6rem" align="center" gap={2}>
                <Badge colorPalette={statusColor(match.status)} size="sm">
                  {MATCH_STATUS_LABELS[match.status]}
                </Badge>
                {match.queue_status ? (
                  <Badge variant="subtle" size="sm">
                    {FIGHT_QUEUE_STATUS_LABELS[match.queue_status]}
                  </Badge>
                ) : null}
              </Flex>
            </Flex>
          ))
        )}
      </Box>
    </Box>
  )
}
