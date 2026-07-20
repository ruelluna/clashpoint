'use client'

import { useActionState } from 'react'
import { Badge, Box, Button, Flex, Stack, Text } from '@chakra-ui/react'

import { PanelCard } from '@/components/dashboard'
import {
  completeMatchSettlementAction,
  postMatchSettlementObligationAction,
  type MatchActionState,
} from '@/features/matches/actions'
import { formatCurrency } from '@/features/matches/components/matching-shared'
import { allRequiredObligationsPosted } from '@/features/matches/match-settlement-obligations'
import type { SettlingMatchListItem } from '@/features/matches/types'

const initialState: MatchActionState = {}

type MatchingSettlingPanelProps = {
  eventId: string
  settlingMatches: SettlingMatchListItem[]
  canSettle: boolean
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

  const actionMessage =
    postState.error ??
    postState.success ??
    completeState.error ??
    completeState.success

  const readyToComplete = allRequiredObligationsPosted(match.obligations)

  return (
    <PanelCard title={`Fight #${match.fight_number} · Settling`}>
      <Stack gap={3}>
        <Flex gap={2} wrap="wrap">
          <Badge colorPalette="purple">Result: {match.result_type.replace('_', ' ')}</Badge>
          {readyToComplete ? (
            <Badge colorPalette="green">Ready to mark settled</Badge>
          ) : (
            <Badge colorPalette="orange">Revolving fund posts pending</Badge>
          )}
        </Flex>

        {actionMessage ? (
          <Text
            fontSize="sm"
            color={postState.error || completeState.error ? 'red.fg' : 'green.fg'}
          >
            {actionMessage}
          </Text>
        ) : null}

        <Stack gap={2}>
          {match.obligations.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              No settlement obligations were generated for this match.
            </Text>
          ) : (
            match.obligations.map((obligation) => (
              <Box
                key={obligation.id}
                borderWidth="1px"
                borderColor="border"
                rounded="md"
                p={3}
              >
                <Flex
                  justify="space-between"
                  align={{ base: 'stretch', sm: 'center' }}
                  direction={{ base: 'column', sm: 'row' }}
                  gap={2}
                >
                  <Box flex="1">
                    <Flex gap={2} align="center" wrap="wrap" mb={1}>
                      <Text fontWeight="medium">{obligation.label}</Text>
                      <Badge
                        size="sm"
                        colorPalette={obligation.status === 'posted' ? 'green' : 'orange'}
                      >
                        {obligation.status === 'posted' ? 'Posted' : 'Pending'}
                      </Badge>
                      {obligation.obligation_type === 'vip_palitada_payout_info' ? (
                        <Badge size="sm" colorPalette="gray">
                          Info only
                        </Badge>
                      ) : null}
                    </Flex>
                    {obligation.description ? (
                      <Text fontSize="sm" color="fg.muted">
                        {obligation.description}
                      </Text>
                    ) : null}
                    {obligation.requires_ledger_post && obligation.amount !== 0 ? (
                      <Text fontSize="sm" mt={1}>
                        Ledger amount: {formatCurrency(obligation.amount)}
                      </Text>
                    ) : null}
                  </Box>

                  {canSettle &&
                  obligation.requires_ledger_post &&
                  obligation.status !== 'posted' ? (
                    <form action={postAction}>
                      <input type="hidden" name="eventId" value={eventId} />
                      <input type="hidden" name="matchId" value={match.id} />
                      <input type="hidden" name="obligationId" value={obligation.id} />
                      <Button type="submit" size="sm" loading={postPending}>
                        Post to revolving fund
                      </Button>
                    </form>
                  ) : null}
                </Flex>
              </Box>
            ))
          )}
        </Stack>

        {canSettle ? (
          <form action={completeAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="matchId" value={match.id} />
            <Button
              type="submit"
              size="sm"
              colorPalette="green"
              loading={completePending}
              disabled={!readyToComplete}
            >
              Mark match settled
            </Button>
          </form>
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
          No matches are awaiting revolving fund settlement. After a result is recorded, Monton
          Palitada stakes, payouts, and house earnings appear here for posting.
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
