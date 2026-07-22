'use client'

import { Box, Text } from '@chakra-ui/react'
import { useMemo } from 'react'

import { PanelCard } from '@/components/dashboard'
import { MatchingFightQueueRow } from '@/features/matches/components/matching-fight-queue-row'
import type { MatchListItem } from '@/features/matches/types'
import { filterFightQueueTabMatches } from '@/features/matches/utils'

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
  const fightQueueTabMatches = useMemo(
    () => filterFightQueueTabMatches(queueMatches),
    [queueMatches]
  )

  return (
    <PanelCard flush title="Fight queue">
      {fightQueueTabMatches.length === 0 ? (
        <Box px={4} py={8} textAlign="center">
          <Text color="fg.muted">
            No fights in the queue yet. Matches appear here after both sides pay.
          </Text>
        </Box>
      ) : (
        fightQueueTabMatches.map((match) => (
          <MatchingFightQueueRow
            key={match.id}
            match={match}
            eventId={eventId}
            queueMatches={queueMatches}
            canManage={canManage}
            canManageQueueOverride={canManageQueueOverride}
          />
        ))
      )}
    </PanelCard>
  )
}
