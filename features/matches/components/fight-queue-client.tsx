'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Text,
} from '@chakra-ui/react'
import { useActionState } from 'react'

import { PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import {
  updateFightQueueStatusAction,
  type MatchActionState,
} from '@/features/matches/actions'
import {
  fightQueueStatusColorPalette,
  matchStatusColorPalette,
} from '@/features/matches/display-utils'
import {
  FIGHT_QUEUE_ADVANCE_ACTION_LABELS,
  FIGHT_QUEUE_STATUS_LABELS,
  MATCH_STATUS_LABELS,
} from '@/features/matches/schema'
import type { MatchListItem } from '@/features/matches/types'
import { FIGHT_QUEUE_TRANSITIONS } from '@/features/matches/utils'

type FightQueueClientProps = {
  eventId: string
  eventName: string
  matches: MatchListItem[]
  canManage: boolean
}

const initialState: MatchActionState = {}

function formatWeight(weight: number | null) {
  if (weight == null) return '—'
  return `${weight.toFixed(2)} kg`
}

function nextQueueStatus(
  current: MatchListItem['queue_status']
): MatchListItem['queue_status'] | null {
  if (!current) return 'waiting'
  const options = FIGHT_QUEUE_TRANSITIONS[current]
  return options[0] ?? null
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
    <Box
      px={4}
      py={3}
      borderBottomWidth="1px"
      borderColor="border"
      _last={{ borderBottomWidth: 0 }}
    >
      <Flex direction={{ base: 'column', lg: 'row' }} gap={4} align={{ lg: 'center' }}>
        <Flex align="center" gap={3} flexShrink={0}>
          <Text fontSize="lg" fontWeight="semibold">
            #{match.fight_number}
          </Text>
          {match.queue_status ? (
            <Badge colorPalette={fightQueueStatusColorPalette(match.queue_status)} size="sm">
              {FIGHT_QUEUE_STATUS_LABELS[match.queue_status]}
            </Badge>
          ) : (
            <Badge colorPalette={matchStatusColorPalette(match.status)} size="sm">
              {MATCH_STATUS_LABELS[match.status]}
            </Badge>
          )}
        </Flex>

        <Flex flex="1" direction={{ base: 'column', md: 'row' }} gap={4}>
          <Box flex="1">
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
              Meron
            </Text>
            <Text fontWeight="medium">{match.meron.entry_name}</Text>
            <Text fontSize="sm" color="fg.muted">
              #{match.meron.cock_number} · {match.meron.band_number} ·{' '}
              {formatWeight(match.meron.weight)}
            </Text>
          </Box>
          <Box flex="1">
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
              Wala
            </Text>
            <Text fontWeight="medium">{match.wala.entry_name}</Text>
            <Text fontSize="sm" color="fg.muted">
              #{match.wala.cock_number} · {match.wala.band_number} ·{' '}
              {formatWeight(match.wala.weight)}
            </Text>
          </Box>
        </Flex>

        {canManage && nextStatus ? (
          <form action={action}>
            <input type="hidden" name="matchId" value={match.id} />
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="queueStatus" value={nextStatus} />
            <Button type="submit" size="md" loading={pending} width={{ base: 'full', lg: 'auto' }}>
              {FIGHT_QUEUE_ADVANCE_ACTION_LABELS[nextStatus]}
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

export function FightQueueClient({
  eventId,
  eventName,
  matches,
  canManage,
}: FightQueueClientProps) {
  const fighting = matches.find((match) => match.queue_status === 'fighting')

  return (
    <PageStack>
      <PageHeader
        title="Fight queue"
        description={`Advance fights through Waiting → Handlers called → Birds at pit → Fighting for ${eventName}.`}
      />

      {fighting ? (
        <Box
          borderWidth="1px"
          borderColor="green.emphasized"
          rounded="lg"
          p={4}
          bg="green.subtle"
        >
          <Text fontWeight="medium" color="green.fg">
            Now fighting: #{fighting.fight_number}
          </Text>
          <Text fontSize="sm" color="green.fg">
            {fighting.meron.entry_name} vs {fighting.wala.entry_name}
          </Text>
        </Box>
      ) : null}

      <PanelCard flush>
        {matches.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">
              No fights in the queue yet. Matches appear here after both sides pay at Cashier
              Terminal.
            </Text>
          </Box>
        ) : (
          matches.map((match) => (
            <FightQueueRow
              key={match.id}
              match={match}
              eventId={eventId}
              canManage={canManage}
            />
          ))
        )}
      </PanelCard>
    </PageStack>
  )
}
