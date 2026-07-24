'use client'

import { useActionState } from 'react'
import { Badge, Button, Text } from '@chakra-ui/react'

import {
  markVipSettlementPaidAction,
  type MatchActionState,
} from '@/features/matches/actions'
import {
  SettlementRow,
  SettlementSection,
} from '@/features/matches/components/matching-settlement-rows'
import {
  countVipObligations,
  isVipSettlementObligationType,
  vipObligationActionLabel,
} from '@/features/matches/match-settlement-obligations'
import { useSettlementActionRefresh } from '@/features/matches/hooks/use-settlement-action-refresh'
import type { MatchSettlementObligationItem } from '@/features/matches/types'

const initialState: MatchActionState = {}

type MatchingVipSettlementListProps = {
  eventId: string
  matchId: string
  obligations: MatchSettlementObligationItem[]
  canSettle: boolean
}

function vipSideFromDescription(description: string | null): string {
  if (!description) return '—'
  const side = description.split(' · ')[0]?.trim()
  return side === 'Meron' || side === 'Wala' ? side : '—'
}

function vipContributorName(label: string): string {
  const prefixes = ['Pay VIP — ', 'Collect from VIP — ', 'Refund VIP — ']
  for (const prefix of prefixes) {
    if (label.startsWith(prefix)) return label.slice(prefix.length)
  }
  return label
}

export function MatchingVipSettlementList({
  eventId,
  matchId,
  obligations,
  canSettle,
}: MatchingVipSettlementListProps) {
  const [markState, markAction, markPending] = useActionState(
    markVipSettlementPaidAction,
    initialState
  )

  useSettlementActionRefresh(eventId, matchId, markState)

  const vipObligations = obligations.filter((row) =>
    isVipSettlementObligationType(row.obligation_type)
  )
  const { total, paid } = countVipObligations(obligations)

  const feedback =
    markState.error || markState.success ? (
      <Text fontSize="sm" color={markState.error ? 'red.fg' : 'green.fg'}>
        {markState.error ?? markState.success}
      </Text>
    ) : null

  return (
    <SettlementSection
      title="VIP payments"
      progressLabel={total > 0 ? `${paid} of ${total} complete` : undefined}
      progressColor={paid === total && total > 0 ? 'green' : 'orange'}
      feedback={feedback}
      emptyMessage={
        <Text fontSize="sm" color="fg.muted">
          No VIP contributors on this fight. Monton Palitada is settled through Revolving fund
          below. To track pay/collect per person, record Palitada as{' '}
          <Text as="span" fontWeight="medium">
            VIP
          </Text>{' '}
          (not Monton) in Bet Balancing before the result is recorded.
        </Text>
      }
    >
      {vipObligations.length > 0
        ? vipObligations.map((obligation) => (
            <SettlementRow
              key={obligation.id}
              primary={vipContributorName(obligation.label)}
              secondary={obligation.description}
              meta={
                <>
                  <Badge size="sm" colorPalette="purple">
                    {vipSideFromDescription(obligation.description)}
                  </Badge>
                  <Badge size="sm" colorPalette="blue">
                    {vipObligationActionLabel(obligation.obligation_type)}
                  </Badge>
                </>
              }
              amount={obligation.amount}
              statusLabel={obligation.status === 'paid' ? 'Paid' : 'Pending'}
              statusColor={obligation.status === 'paid' ? 'green' : 'orange'}
              action={
                canSettle && obligation.status !== 'paid' ? (
                  <form action={markAction} style={{ width: '100%' }}>
                    <input type="hidden" name="eventId" value={eventId} />
                    <input type="hidden" name="matchId" value={matchId} />
                    <input type="hidden" name="obligationId" value={obligation.id} />
                    <Button
                      type="submit"
                      size="md"
                      loading={markPending}
                      width={{ base: 'full', md: 'auto' }}
                    >
                      Mark paid
                    </Button>
                  </form>
                ) : undefined
              }
            />
          ))
        : null}
    </SettlementSection>
  )
}
