'use client'

import { Box, Text } from '@chakra-ui/react'

import { PanelCard } from '@/components/dashboard'
import { FightQueueRow } from '@/features/matches/components/matching-shared'
import type { MatchListItem } from '@/features/matches/types'

type MatchingFightQueuePanelProps = {
  eventId: string
  queueMatches: MatchListItem[]
  canManage: boolean
  canManageQueueOverride?: boolean
}

export function MatchingFightQueuePanel({
  eventId,
  queueMatches,
  canManage,
  canManageQueueOverride = false,
}: MatchingFightQueuePanelProps) {
  return (
    <PanelCard flush title="Fight queue">
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
            canManageQueueOverride={canManageQueueOverride}
          />
        ))
      )}
    </PanelCard>
  )
}
