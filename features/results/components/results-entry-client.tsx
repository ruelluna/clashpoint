'use client'

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  NativeSelect,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useActionState } from 'react'

import {
  recordResultAction,
  verifyResultAction,
  type ResultActionState,
} from '@/features/results/actions'
import {
  FIGHT_RESULT_TYPE_LABELS,
  RESULT_STATUS_LABELS,
} from '@/features/results/schema'
import type { MatchForResult, ResultListItem } from '@/features/results/types'

const initialState: ResultActionState = {}

function statusColor(
  status: ResultListItem['result_status']
): 'gray' | 'blue' | 'green' | 'purple' {
  if (status === 'verified' || status === 'final') return 'green'
  if (status === 'submitted') return 'blue'
  if (status === 'draft') return 'gray'
  return 'purple'
}

export function ResultsEntryClient({
  eventId,
  pendingMatches,
  results,
  canManage,
}: {
  eventId: string
  pendingMatches: MatchForResult[]
  results: ResultListItem[]
  canManage: boolean
}) {
  const [recordState, recordFormAction, recordPending] = useActionState(
    recordResultAction,
    initialState
  )
  const [verifyState, verifyFormAction, verifyPending] = useActionState(
    verifyResultAction,
    initialState
  )

  const feedback = recordState.error
    ? recordState.error
    : recordState.success
      ? recordState.success
      : verifyState.error
        ? verifyState.error
        : verifyState.success

  const feedbackTone = recordState.error || verifyState.error ? 'red' : 'green'

  return (
    <Box className="space-y-6">
      {feedback ? (
        <Box
          borderWidth="1px"
          borderColor={feedbackTone === 'red' ? 'red.500' : 'green.500'}
          rounded="md"
          p={3}
          fontSize="sm"
        >
          <Text color={feedbackTone === 'red' ? 'red.500' : 'green.600'}>
            {feedback}
          </Text>
        </Box>
      ) : null}

      {canManage ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
          <Text fontWeight="medium" mb={4}>
            Record result
          </Text>
          {pendingMatches.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              No matches are waiting for a result.
            </Text>
          ) : (
            <form action={recordFormAction} className="space-y-4">
              <input type="hidden" name="eventId" value={eventId} />
              <Flex direction="column" gap={2}>
                <Text fontSize="sm" fontWeight="medium">
                  Match
                </Text>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field name="matchId" defaultValue="">
                    <option value="" disabled>
                      Select match
                    </option>
                    {pendingMatches.map((match) => (
                      <option key={match.id} value={match.id}>
                        Fight #{match.fight_number}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Flex>
              <Flex direction="column" gap={2}>
                <Text fontSize="sm" fontWeight="medium">
                  Result
                </Text>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field name="resultType" defaultValue="meron_win">
                    {Object.entries(FIGHT_RESULT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Flex>
              <Flex direction="column" gap={2}>
                <Text fontSize="sm" fontWeight="medium">
                  Notes
                </Text>
                <Textarea name="notes" rows={2} placeholder="Optional notes" />
              </Flex>
              <Checkbox.Root name="underProtest">
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>Under protest</Checkbox.Label>
              </Checkbox.Root>
              <Button type="submit" loading={recordPending} alignSelf="flex-start">
                Submit result
              </Button>
            </form>
          )}
        </Box>
      ) : null}

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        <Box p={4} borderBottomWidth="1px" borderColor="border">
          <Text fontWeight="medium">Recorded results</Text>
          <Text fontSize="sm" color="fg.muted">
            Verified results update event standings.
          </Text>
        </Box>
        {results.length === 0 ? (
          <Box p={4}>
            <Text fontSize="sm" color="fg.muted">
              No results recorded yet.
            </Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Box as="table" width="full" fontSize="sm">
              <Box as="thead" bg="bg.subtle">
                <Box as="tr">
                  {['Fight', 'Meron', 'Wala', 'Result', 'Status', 'Actions'].map(
                    (heading) => (
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
                    )
                  )}
                </Box>
              </Box>
              <Box as="tbody">
                {results.map((result) => (
                  <Box as="tr" key={result.id} borderTopWidth="1px" borderColor="border">
                    <Box as="td" px={4} py={3}>
                      #{result.fight_number}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {result.meron_entry_name}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {result.wala_entry_name}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {FIGHT_RESULT_TYPE_LABELS[result.result_type]}
                      {result.under_protest ? (
                        <Badge ml={2} colorPalette="orange" size="sm">
                          Protest
                        </Badge>
                      ) : null}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      <Badge colorPalette={statusColor(result.result_status)} size="sm">
                        {RESULT_STATUS_LABELS[result.result_status]}
                      </Badge>
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {canManage && result.result_status === 'submitted' ? (
                        <form action={verifyFormAction}>
                          <input type="hidden" name="resultId" value={result.id} />
                          <input type="hidden" name="eventId" value={eventId} />
                          <Button
                            type="submit"
                            size="xs"
                            variant="outline"
                            loading={verifyPending}
                          >
                            Verify
                          </Button>
                        </form>
                      ) : (
                        <Text color="fg.muted">—</Text>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
