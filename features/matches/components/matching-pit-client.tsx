'use client'

import { Badge, Box, Flex, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useMemo } from 'react'

import { LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import {
  calculatePledgeSettlement,
  getPledgeBaseAmount,
} from '@/features/matches/bet-balancing'
import { MatchBetBalancingPanel } from '@/features/matches/components/match-bet-balancing-panel'
import { MatchPalitadaRecordForm } from '@/features/matches/components/match-palitada-record-form'
import { MatchingLiveSyncProvider, useMatchingLiveSync } from '@/features/matches/components/matching-live-sync-provider'
import { formatCurrency } from '@/features/matches/components/matching-shared'
import { FIGHT_SIDE_LABELS } from '@/features/matches/schema'
import type { MatchListItem, SettlingMatchListItem } from '@/features/matches/types'
import { resolvePalitadaTargetMatch } from '@/features/matches/utils'

type MatchingPitClientProps = {
  eventId: string
  eventName: string
  queueMatches: MatchListItem[]
  taxPerFight: number
  taxCommissionRate: number
  canManagePalitada: boolean
}

function MatchingPitContent({
  eventId,
  eventName,
  taxPerFight,
  taxCommissionRate,
  canManagePalitada,
}: Omit<MatchingPitClientProps, 'queueMatches'>) {
  const { queueMatches } = useMatchingLiveSync()
  const targetMatch = useMemo(() => resolvePalitadaTargetMatch(queueMatches), [queueMatches])

  const settlement = targetMatch
    ? calculatePledgeSettlement({
        meronBasePledge: getPledgeBaseAmount(
          targetMatch.meron.bet_amount,
          targetMatch.meron.bet_collected_amount,
          targetMatch.meron.bet_payment_status
        ),
        walaBasePledge: getPledgeBaseAmount(
          targetMatch.wala.bet_amount,
          targetMatch.wala.bet_collected_amount,
          targetMatch.wala.bet_payment_status
        ),
        meronPalitadaContributors: targetMatch.meron_palitada.map((contributor) => ({
          id: contributor.id,
          contributorName: contributor.contributor_name,
          contributorType: contributor.contributor_type,
          amount: contributor.amount,
        })),
        walaPalitadaContributors: targetMatch.wala_palitada.map((contributor) => ({
          id: contributor.id,
          contributorName: contributor.contributor_name,
          contributorType: contributor.contributor_type,
          amount: contributor.amount,
        })),
        commissionRatePercent: taxCommissionRate,
        taxAmount: taxPerFight,
      })
    : null

  return (
    <PageStack>
      <PageHeader
        title="Bet Balancing"
        description={`Record Palitada on waiting fights for ${eventName}. Use this screen at the pit before handlers are called.`}
      />

      {!canManagePalitada ? (
        <PanelCard title="Access required">
          <Text fontSize="sm" color="fg.muted">
            You need Bet Balancing permission to record Palitada.
          </Text>
        </PanelCard>
      ) : !targetMatch ? (
        <PanelCard title="No waiting fight">
          <Stack gap={3}>
            <Text fontSize="sm" color="fg.muted">
              There is no fight in the queue with status Waiting. Advance a paid fight to the queue
              first.
            </Text>
            <Link href={`/dashboard/events/${eventId}/matching?view=queue`}>
              Open fight queue
            </Link>
          </Stack>
        </PanelCard>
      ) : (
        <Stack gap={LAYOUT_GAP.section}>
          <PanelCard title={`Fight #${targetMatch.fight_number}`}>
            <Flex gap={2} wrap="wrap" mb={3}>
              <Badge colorPalette="blue">Waiting</Badge>
              {settlement?.isBalanced ? (
                <Badge colorPalette="green">Balanced</Badge>
              ) : (
                <>
                  <Badge colorPalette="orange">Difference open</Badge>
                  {settlement?.underdogSide ? (
                    <Badge colorPalette="yellow">
                      Underdog: {FIGHT_SIDE_LABELS[settlement.underdogSide]} · up to{' '}
                      {formatCurrency(settlement.amountNeededToBalance)}
                    </Badge>
                  ) : null}
                </>
              )}
            </Flex>

            <Box borderWidth="1px" borderColor="border" rounded="md" p={3} mb={4}>
              <MatchPalitadaRecordForm
                eventId={eventId}
                match={targetMatch}
                defaultSide={settlement?.underdogSide ?? 'meron'}
              />
            </Box>

            <Text fontSize="sm" color="fg.muted">
              Meron: {targetMatch.meron.entry_name} · Wala: {targetMatch.wala.entry_name}
            </Text>
          </PanelCard>

          <MatchBetBalancingPanel
            match={targetMatch}
            fightNumber={targetMatch.fight_number}
            taxPerFight={taxPerFight}
            taxCommissionRate={taxCommissionRate}
          />
        </Stack>
      )}
    </PageStack>
  )
}

export function MatchingPitClient(props: MatchingPitClientProps) {
  const emptySettling: SettlingMatchListItem[] = []

  return (
    <MatchingLiveSyncProvider
      eventId={props.eventId}
      initialQueueMatches={props.queueMatches}
      initialAwaitingPaymentMatches={[]}
      initialSettlingMatches={emptySettling}
    >
      <MatchingPitContent
        eventId={props.eventId}
        eventName={props.eventName}
        taxPerFight={props.taxPerFight}
        taxCommissionRate={props.taxCommissionRate}
        canManagePalitada={props.canManagePalitada}
      />
    </MatchingLiveSyncProvider>
  )
}
