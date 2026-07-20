'use client'

import { Badge, Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'

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
  palitadaTargetMatch: MatchListItem | null
  taxPerFight: number
  taxCommissionRate: number
  canManage: boolean
  canManagePalitada: boolean
  canRecordResult: boolean
  hasVerifiedResult: boolean
  onOpenFightQueue: () => void
}

export function MatchingActiveMatchPanel({
  eventId,
  activeMatch,
  palitadaTargetMatch,
  taxPerFight,
  taxCommissionRate,
  canManage,
  canManagePalitada,
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

        {!hasVerifiedResult ? (
          <Box mb={4}>
            <MatchOutcomeActions
              eventId={eventId}
              matchId={activeMatch.id}
              fightNumber={activeMatch.fight_number}
              meronEntryName={activeMatch.meron.entry_name}
              walaEntryName={activeMatch.wala.entry_name}
              canRecordResult={canRecordResult}
            />
          </Box>
        ) : canRecordResult ? (
          <Text fontSize="sm" color="fg.muted" mb={4}>
            A verified result is already recorded for this match.
          </Text>
        ) : null}

        {canManage ? (
          <Stack gap={LAYOUT_GAP.form} mb={4}>
            <FightQueueAdvanceForm
              match={activeMatch}
              eventId={eventId}
              canManage={canManage}
            />
          </Stack>
        ) : null}

        {canManagePalitada && palitadaTargetMatch ? (
          <Box mb={4} borderWidth="1px" borderColor="border" rounded="md" p={3}>
            <Text fontSize="sm" mb={2}>
              Bet Balancing is recorded on waiting fights at the pit before handlers are called.
            </Text>
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/events/${eventId}/matching/pit`}>
                Bet Balancing — Fight #{palitadaTargetMatch.fight_number}
              </Link>
            </Button>
          </Box>
        ) : null}

        <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={4}>
          <MatchBirdDetailCard side="meron" details={activeMatch.meron} />
          <MatchBirdDetailCard side="wala" details={activeMatch.wala} />
        </Flex>
      </PanelCard>

      <MatchBetBalancingPanel
        match={activeMatch}
        fightNumber={activeMatch.fight_number}
        taxPerFight={taxPerFight}
        taxCommissionRate={taxCommissionRate}
      />
    </Stack>
  )
}
