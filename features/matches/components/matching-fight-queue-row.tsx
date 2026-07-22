'use client'

import { Badge, Box, Flex, Stack, Text } from '@chakra-ui/react'

import { MatchingMatchSideBlock } from '@/features/matches/components/matching-match-side-block'
import {
  AdjustPledgeForm,
  FightQueueAdvanceForm,
} from '@/features/matches/components/matching-shared'
import { FIGHT_QUEUE_STATUS_LABELS } from '@/features/matches/schema'
import { fightQueueStatusColorPalette } from '@/features/matches/display-utils'
import type { MatchListItem } from '@/features/matches/types'

type MatchingFightQueueRowProps = {
  match: MatchListItem
  eventId: string
  queueMatches: MatchListItem[]
  canManage: boolean
  canManageQueueOverride?: boolean
}

export function MatchingFightQueueRow({
  match,
  eventId,
  queueMatches,
  canManage,
  canManageQueueOverride = false,
}: MatchingFightQueueRowProps) {
  return (
    <Box
      px={4}
      py={{ base: 3, lg: 4 }}
      borderBottomWidth="1px"
      borderColor="border"
      data-testid="matching-fight-queue-row"
    >
      <Box display={{ base: 'block', lg: 'none' }}>
        <Box borderWidth="1px" borderColor="border" borderRadius="md" p={4}>
          <Flex justify="space-between" align="flex-start" gap={3} mb={4}>
            <Text fontSize="lg" fontWeight="semibold">
              Fight #{match.fight_number}
            </Text>
            {match.queue_status ? (
              <Badge
                flexShrink={0}
                colorPalette={fightQueueStatusColorPalette(match.queue_status)}
                size="sm"
              >
                {FIGHT_QUEUE_STATUS_LABELS[match.queue_status]}
              </Badge>
            ) : null}
          </Flex>

          <Stack gap={4}>
            <MatchingMatchSideBlock side="meron" details={match.meron} emphasizeBet />
            <MatchingMatchSideBlock side="wala" details={match.wala} emphasizeBet />
          </Stack>

          <Box mt={4}>
            <FightQueueAdvanceForm
              match={match}
              eventId={eventId}
              queueMatches={queueMatches}
              canManage={canManage}
              canManageQueueOverride={canManageQueueOverride}
              fullWidthButtons
            />
          </Box>
          <AdjustPledgeForm eventId={eventId} match={match} canManage={canManage} />
        </Box>
      </Box>

      <Flex display={{ base: 'none', lg: 'flex' }} gap={4} align="center">
        <Stack gap={1} flexShrink={0}>
          <Flex align="center" gap={3}>
            <Text fontSize="lg" fontWeight="semibold">
              #{match.fight_number}
            </Text>
            {match.queue_status ? (
              <Badge colorPalette={fightQueueStatusColorPalette(match.queue_status)} size="sm">
                {FIGHT_QUEUE_STATUS_LABELS[match.queue_status]}
              </Badge>
            ) : null}
          </Flex>
        </Stack>
        <Flex flex="1" direction="row" gap={4}>
          <Box flex="1">
            <MatchingMatchSideBlock side="meron" details={match.meron} />
          </Box>
          <Box flex="1">
            <MatchingMatchSideBlock side="wala" details={match.wala} />
          </Box>
        </Flex>
        <FightQueueAdvanceForm
          match={match}
          eventId={eventId}
          queueMatches={queueMatches}
          canManage={canManage}
          canManageQueueOverride={canManageQueueOverride}
        />
        <AdjustPledgeForm eventId={eventId} match={match} canManage={canManage} />
      </Flex>
    </Box>
  )
}
