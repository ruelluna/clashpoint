'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useActionState } from 'react'

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
    <Box className="space-y-6">
      <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
        <Text fontWeight="medium">Winner finalization</Text>
        <Text fontSize="sm" color="fg.muted" mt={1}>
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
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        <Box p={4} borderBottomWidth="1px" borderColor="border">
          <Text fontWeight="medium">Rankings & champions</Text>
        </Box>
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
      </Box>

      {canManage && !isLocked ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
          <Text fontWeight="medium" mb={2}>
            Finalize winners
          </Text>
          <Text fontSize="sm" color="fg.muted" mb={3}>
            Applies the event tie-breaker, locks results, and generates pending prize
            payouts.
          </Text>
          <form action={action}>
            <input type="hidden" name="eventId" value={eventId} />
            <Textarea
              name="notes"
              placeholder="Optional notes for audit log"
              rows={2}
              mb={3}
            />
            <Button type="submit" colorPalette="green" loading={pending}>
              Finalize winners
            </Button>
            {state.error ? (
              <Text fontSize="sm" color="red.500" mt={2}>
                {state.error}
              </Text>
            ) : null}
            {state.success ? (
              <Text fontSize="sm" color="green.600" mt={2}>
                {state.success}
              </Text>
            ) : null}
          </form>
        </Box>
      ) : null}

      {summary.finalization?.notes ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
          <Text fontWeight="medium">Finalization notes</Text>
          <Text fontSize="sm" mt={1}>
            {summary.finalization.notes}
          </Text>
        </Box>
      ) : null}
    </Box>
  )
}
