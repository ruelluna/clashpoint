'use client'

import Link from 'next/link'
import { Badge, Button, Text } from '@chakra-ui/react'

import {
  SettlementRow,
  SettlementSection,
} from '@/components/dashboard'
import {
    countHandlerObligations,
    handlerContributorName,
    handlerObligationSideFromDescription,
    isHandlerSettlementObligationType,
} from '@/features/matches/match-settlement-obligations'
import type { MatchSettlementObligationItem } from '@/features/matches/types'

type MatchingHandlerSettlementListProps = {
    eventId: string
    obligations: MatchSettlementObligationItem[]
}

function handlerBreakdown(description: string | null): string | null {
    if (!description) return null
    const winMatch = description.match(
        /Bet ₱([\d,.]+) \+ won ₱([\d,.]+) · Pay ₱([\d,.]+) from revolving fund/
    ) ?? description.match(
        /· Bet ₱([\d,.]+) \+ won ₱([\d,.]+) · Pay ₱([\d,.]+) from revolving fund/
    )
    if (winMatch) {
        return `Bet ${winMatch[1]} + won ${winMatch[2]} = ${winMatch[3]}`
    }
    return description
}

export function MatchingHandlerSettlementList({
    eventId,
    obligations,
}: MatchingHandlerSettlementListProps) {
    const handlerObligations = obligations.filter((row) =>
        isHandlerSettlementObligationType(row.obligation_type)
    )
    const { total, paid } = countHandlerObligations(obligations)

    return (
        <SettlementSection
            title="Match Winners"
            progressLabel={total > 0 ? `${paid} of ${total} paid` : undefined}
            progressColor={paid === total && total > 0 ? 'green' : 'orange'}
            emptyMessage={
                <Text fontSize="sm" color="fg.muted">
                    No handler payout obligations for this fight result.
                </Text>
            }
        >
            {handlerObligations.length > 0
                ? handlerObligations.map((obligation) => (
                    <SettlementRow
                        key={obligation.id}
                        primary={handlerContributorName(obligation.label)}
                        secondary={handlerBreakdown(obligation.description)}
                        meta={
                            <Badge size="sm" colorPalette="purple">
                                {handlerObligationSideFromDescription(obligation.description)}
                            </Badge>
                        }
                        amount={obligation.amount}
                        statusLabel={
                            obligation.status === 'paid' ? 'Paid at Cashier' : 'Pending'
                        }
                        statusColor={obligation.status === 'paid' ? 'green' : 'orange'}
                        action={
                            obligation.status !== 'paid' ? (
                                <Button asChild size="md" variant="outline" width={{ base: 'full', md: 'auto' }}>
                                    <Link href={`/dashboard/events/${eventId}/payments`}>
                                        Open Cashier Terminal
                                    </Link>
                                </Button>
                            ) : undefined
                        }
                    />
                ))
                : null}
        </SettlementSection>
    )
}
