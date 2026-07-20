'use client'

import { Badge, Box, Button, Flex, Stack, Text } from '@chakra-ui/react'

import { LAYOUT_GAP, PanelCard } from '@/components/dashboard'
import { MatchBetBalancingPanel } from '@/features/matches/components/match-bet-balancing-panel'
import { MatchBirdDetailCard } from '@/features/matches/components/match-bird-detail-card'
import { MatchOutcomeActions } from '@/features/matches/components/match-outcome-actions'
import { FightQueueAdvanceForm } from '@/features/matches/components/matching-shared'
import { FIGHT_QUEUE_STATUS_LABELS } from '@/features/matches/schema'
import { fightQueueStatusColorPalette } from '@/features/matches/display-utils'
import type { MatchListItem } from '@/features/matches/types'

type MatchingActiveMatchPanelProps = {
  eventId: string
  activeMatch: MatchListItem | null
  taxPerFight: number
  taxCommissionRate: number
  canManage: boolean
  canRecordResult: boolean
  hasVerifiedResult: boolean
  onOpenFightQueue: () => void
}

export function MatchingActiveMatchPanel({
  eventId,
  activeMatch,
  taxPerFight,
  taxCommissionRate,
  canManage,
  canRecordResult,
  hasVerifiedResult,
  onOpenFightQueue,
}: MatchingActiveMatchPanelProps) {
  if (!activeMatch) {
    return (
      <PanelCard title="Active match">
        <Stack gap={3}>
          <Text fontSize="sm" color="fg.muted">
            No match is being called right now. Advance a fight in the queue to handlers called or
            beyond to see it here.
          </Text>
          <Button size="sm" variant="outline" alignSelf="flex-start" onClick={onOpenFightQueue}>
            Open fight queue
          </Button>
        </Stack>
      </PanelCard>
    )
  }

  return (
    <Stack gap={LAYOUT_GAP.section}>
      <PanelCard title={`Fight #${activeMatch.fight_number}`}>
        <Flex justify="flex-end" mb={3}>
          {activeMatch.queue_status ? (
            <Badge
              colorPalette={fightQueueStatusColorPalette(activeMatch.queue_status)}
              size="sm"
            >
              {FIGHT_QUEUE_STATUS_LABELS[activeMatch.queue_status]}
            </Badge>
          ) : null}
        </Flex>
        <Box
          borderWidth="2px"
          borderColor="green.muted"
          rounded="md"
          p={4}
          bg="green.subtle"
          mb={4}
        >
          <Text fontWeight="semibold" color="green.fg">
            Active match: #{activeMatch.fight_number}
          </Text>
          <Text fontSize="sm" color="green.fg">
            {activeMatch.meron.entry_name} vs {activeMatch.wala.entry_name}
          </Text>
        </Box>

        <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={4}>
          <MatchBirdDetailCard side="meron" details={activeMatch.meron} />
          <MatchBirdDetailCard side="wala" details={activeMatch.wala} />
        </Flex>

        {canManage ? (
          <Stack gap={LAYOUT_GAP.form}>
            <FightQueueAdvanceForm
              match={activeMatch}
              eventId={eventId}
              canManage={canManage}
            />
            <Box>
              <Button size="sm" variant="outline" disabled>
                Bet Balancing
              </Button>
              <Text fontSize="xs" color="fg.muted" mt={1}>
                Palitada workflow coming soon.
              </Text>
            </Box>
          </Stack>
        ) : null}
      </PanelCard>

      <MatchBetBalancingPanel
        match={activeMatch}
        taxPerFight={taxPerFight}
        taxCommissionRate={taxCommissionRate}
      />

      {!hasVerifiedResult ? (
        <PanelCard title="Match outcome">
          <MatchOutcomeActions
            eventId={eventId}
            matchId={activeMatch.id}
            canRecordResult={canRecordResult}
          />
        </PanelCard>
      ) : (
        <PanelCard title="Match outcome">
          <Text fontSize="sm" color="fg.muted">
            A verified result is already recorded for this match.
          </Text>
        </PanelCard>
      )}
    </Stack>
  )
}
