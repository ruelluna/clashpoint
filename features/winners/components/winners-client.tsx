'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useActionState } from 'react'

import { LAYOUT_GAP, PageStack, PanelCard } from '@/components/dashboard'
import {
  finalizeWinnersAction,
  type WinnersActionState,
} from '@/features/winners/actions'
import type { FinalizationSummary } from '@/features/winners/types'

type WinnersClientProps = {
  eventId: string
  summary: FinalizationSummary
  canManage: boolean
}

const initialState: WinnersActionState = {}

export function WinnersClient({ eventId, summary, canManage }: WinnersClientProps) {
  const [state, action, pending] = useActionState(finalizeWinnersAction, initialState)
  const isFinalized = summary.finalization != null
  const isLocked = summary.finalization?.is_locked ?? false

  return (
    <PageStack>
      <PanelCard title="Winner finalization">
        <Text fontSize="sm" color="fg.muted">
          Tie-breaker rule: {summary.tieBreakerRule.replace(/_/g, ' ')}
        </Text>
        {isFinalized ? (
          <Flex align="center" gap={2} mt={2}>
            <Badge colorPalette="green">Finalized</Badge>
            {isLocked ? <Badge colorPalette="orange">Locked</Badge> : null}
            <Text fontSize="sm" color="fg.muted">
              {new Date(summary.finalization!.finalized_at).toLocaleString()}
            </Text>
          </Flex>
        ) : (
          <Text fontSize="sm" color="fg.muted" mt={2}>
            Standings must be computed before finalizing winners.
          </Text>
        )}
      </PanelCard>

      <PanelCard flush title="Rankings & champions">
        {summary.winners.length === 0 ? (
          <Box p={4}>
            <Text fontSize="sm" color="fg.muted">
              No standings available yet.
            </Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Box as="table" width="full" fontSize="sm">
              <Box as="thead" bg="bg.subtle">
                <Box as="tr">
                  {['Rank', 'Entry', 'Owner', 'Points', 'Champion'].map((heading) => (
                    <Box
                      as="th"
                      key={heading}
                      textAlign="left"
                      px={4}
                      py={3}
                      fontWeight="medium"
                    >
                      {heading}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {summary.winners.map((row) => (
                  <Box as="tr" key={row.entryId} borderTopWidth="1px" borderColor="border">
                    <Box as="td" px={4} py={3}>
                      <Flex align="center" gap={2}>
                        {row.rank || '—'}
                        {row.isTied ? (
                          <Badge colorPalette="orange" size="sm">
                            Tied
                          </Badge>
                        ) : null}
                      </Flex>
                    </Box>
                    <Box as="td" px={4} py={3}>
                      <Text fontWeight="medium">{row.entryName}</Text>
                      <Text fontSize="xs" color="fg.muted">
                        #{row.entryNumber}
                      </Text>
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {row.ownerName}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {row.points}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {row.isChampion ? (
                        <Badge colorPalette="green">Champion</Badge>
                      ) : (
                        '—'
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </PanelCard>

      {canManage && !isLocked ? (
        <PanelCard title="Finalize winners">
          <Text fontSize="sm" color="fg.muted" mb={3}>
            Applies the event tie-breaker, locks results, and generates pending prize
            payouts.
          </Text>
          <form action={action}>
            <Stack gap={LAYOUT_GAP.form}>
            <input type="hidden" name="eventId" value={eventId} />
            <Textarea
              name="notes"
              placeholder="Optional notes for audit log"
              rows={2}
            />
            <Button type="submit" colorPalette="green" loading={pending} alignSelf="flex-start">
              Finalize winners
            </Button>
            {state.error ? (
              <Text fontSize="sm" color="red.500">
                {state.error}
              </Text>
            ) : null}
            {state.success ? (
              <Text fontSize="sm" color="green.600">
                {state.success}
              </Text>
            ) : null}
            </Stack>
          </form>
        </PanelCard>
      ) : null}

      {summary.finalization?.notes ? (
        <PanelCard title="Finalization notes">
          <Text fontSize="sm">{summary.finalization.notes}</Text>
        </PanelCard>
      ) : null}
    </PageStack>
  )
}
