'use client'

import { useActionState } from 'react'
import { Badge, Button, Flex, Stack, Text } from '@chakra-ui/react'

import { ButtonGroup, PanelCard } from '@/components/dashboard'
import {
    completeMatchSettlementAction,
    postMatchSettlementObligationAction,
    type MatchActionState,
} from '@/features/matches/actions'
import {
  SettlementRow,
  SettlementSection,
} from '@/components/dashboard'
import { MatchingHandlerSettlementList } from '@/features/matches/components/matching-handler-settlement-list'
import { MatchingVipSettlementList } from '@/features/matches/components/matching-vip-settlement-list'
import {
    allObligationsComplete,
    isHandlerSettlementObligationType,
    isVipSettlementObligationType,
} from '@/features/matches/match-settlement-obligations'
import { useSettlementActionRefresh } from '@/features/matches/hooks/use-settlement-action-refresh'
import type { SettlingMatchListItem } from '@/features/matches/types'

const initialState: MatchActionState = {}

type MatchingSettlingPanelProps = {
    eventId: string
    settlingMatches: SettlingMatchListItem[]
    canSettle: boolean
}

function countLedgerProgress(
    obligations: SettlingMatchListItem['obligations']
): { posted: number; total: number } {
    const rows = obligations.filter(
        (obligation) =>
            obligation.requires_ledger_post &&
            !isVipSettlementObligationType(obligation.obligation_type) &&
            !isHandlerSettlementObligationType(obligation.obligation_type)
    )
    return {
        total: rows.length,
        posted: rows.filter((row) => row.status === 'posted').length,
    }
}

function SettlingMatchCard({
    eventId,
    match,
    canSettle,
}: {
    eventId: string
    match: SettlingMatchListItem
    canSettle: boolean
}) {
    const [postState, postAction, postPending] = useActionState(
        postMatchSettlementObligationAction,
        initialState
    )
    const [completeState, completeAction, completePending] = useActionState(
        completeMatchSettlementAction,
        initialState
    )

    useSettlementActionRefresh(eventId, match.id, postState)
    useSettlementActionRefresh(eventId, match.id, completeState)

    const readyToComplete = allObligationsComplete(match.obligations)
    const ledgerObligations = match.obligations.filter(
        (obligation) =>
            obligation.requires_ledger_post &&
            !isVipSettlementObligationType(obligation.obligation_type) &&
            !isHandlerSettlementObligationType(obligation.obligation_type)
    )
    const ledgerProgress = countLedgerProgress(match.obligations)

    const postFeedback =
        postState.error || postState.success ? (
            <Text fontSize="sm" color={postState.error ? 'red.fg' : 'green.fg'}>
                {postState.error ?? postState.success}
            </Text>
        ) : null

    const cardTitle = match.matching_number
        ? `${match.matching_number} · Settling`
        : `Fight #${match.fight_number} · Settling`

    return (
        <PanelCard title={cardTitle}>
            <Stack gap={4}>
                <Flex gap={2} wrap="wrap">
                    <Badge colorPalette="purple">Result: {match.result_type.replace('_', ' ')}</Badge>
                    <Badge colorPalette="gray">Fight #{match.fight_number}</Badge>
                    {readyToComplete ? (
                        <Badge colorPalette="green">Ready to mark settled</Badge>
                    ) : (
                        <Badge colorPalette="orange">Settlement incomplete</Badge>
                    )}
                </Flex>

                {completeState.error || completeState.success ? (
                    <Text
                        fontSize="sm"
                        color={completeState.error ? 'red.fg' : 'green.fg'}
                    >
                        {completeState.error ?? completeState.success}
                    </Text>
                ) : null}

                <MatchingHandlerSettlementList eventId={eventId} obligations={match.obligations} />

                <MatchingVipSettlementList
                    eventId={eventId}
                    matchId={match.id}
                    obligations={match.obligations}
                    canSettle={canSettle}
                />

                <SettlementSection
                    title="Revolving fund"
                    progressLabel={
                        ledgerProgress.total > 0
                            ? `${ledgerProgress.posted} of ${ledgerProgress.total} posted`
                            : undefined
                    }
                    progressColor={
                        ledgerProgress.posted === ledgerProgress.total && ledgerProgress.total > 0
                            ? 'green'
                            : 'orange'
                    }
                    feedback={postFeedback}
                    emptyMessage={
                        <Text fontSize="sm" color="fg.muted">
                            No revolving fund obligations for this match.
                        </Text>
                    }
                >
                    {ledgerObligations.length > 0
                        ? ledgerObligations.map((obligation) => (
                            <SettlementRow
                                key={obligation.id}
                                primary={obligation.label}
                                secondary={obligation.description}
                                amount={obligation.amount !== 0 ? obligation.amount : null}
                                amountLabel={obligation.amount === 0 ? '—' : undefined}
                                statusLabel={obligation.status === 'posted' ? 'Posted' : 'Pending'}
                                statusColor={obligation.status === 'posted' ? 'green' : 'orange'}
                                action={
                                    canSettle && obligation.status !== 'posted' ? (
                                        <form action={postAction} style={{ width: '100%' }}>
                                            <input type="hidden" name="eventId" value={eventId} />
                                            <input type="hidden" name="matchId" value={match.id} />
                                            <input type="hidden" name="obligationId" value={obligation.id} />
                                            <Button
                                                type="submit"
                                                size="md"
                                                variant="outline"
                                                loading={postPending}
                                                width={{ base: 'full', md: 'auto' }}
                                            >
                                                Post
                                            </Button>
                                        </form>
                                    ) : undefined
                                }
                            />
                        ))
                        : null}
                </SettlementSection>

                {canSettle ? (
                    <Stack gap={2}>
                        {!readyToComplete ? (
                            <Text fontSize="sm" color="fg.muted">
                                Pay match winners at Cashier, complete VIP payments, and post revolving fund
                                entries before marking this fight settled.
                            </Text>
                        ) : null}
                        <form action={completeAction}>
                            <input type="hidden" name="eventId" value={eventId} />
                            <input type="hidden" name="matchId" value={match.id} />
                            <ButtonGroup>
                                <Button
                                    type="submit"
                                    size="md"
                                    colorPalette="green"
                                    loading={completePending}
                                    disabled={!readyToComplete}
                                    width={{ base: 'full', sm: 'auto' }}
                                >
                                    Mark match settled
                                </Button>
                            </ButtonGroup>
                        </form>
                    </Stack>
                ) : null}
            </Stack>
        </PanelCard>
    )
}

export function MatchingSettlingPanel({
    eventId,
    settlingMatches,
    canSettle,
}: MatchingSettlingPanelProps) {
    if (settlingMatches.length === 0) {
        return (
            <PanelCard title="Settling">
                <Text fontSize="sm" color="fg.muted">
                    No matches are awaiting settlement. After a result is recorded, match winner payouts
                    (Cashier), VIP Palitada payments, Monton Palitada stakes, payouts, and house earnings
                    appear here.
                </Text>
            </PanelCard>
        )
    }

    return (
        <Stack gap={4}>
            {settlingMatches.map((match) => (
                <SettlingMatchCard key={match.id} eventId={eventId} match={match} canSettle={canSettle} />
            ))}
        </Stack>
    )
}
