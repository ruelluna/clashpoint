'use client'

import { Fragment, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Link,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useActionState } from 'react'

import { LAYOUT_GAP, FormField, PageStack, PanelCard } from '@/components/dashboard'
import { formatCurrency } from '@/features/matches/components/matching-shared'
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

function settlementBadge(result: ResultListItem): {
  label: string
  color: 'gray' | 'green' | 'orange'
} {
  if (
    result.vip_settlements.length === 0 &&
    result.handler_settlements.length === 0 &&
    result.match_status !== 'settling'
  ) {
    return { label: '—', color: 'gray' }
  }
  if (result.settlement_completed_at) {
    return { label: 'Settled', color: 'green' }
  }
  if (result.match_status === 'settling') {
    return { label: 'Settling', color: 'orange' }
  }
  return { label: '—', color: 'gray' }
}

function formatPaidAt(value: string | null): string {
  if (!value) return 'Pending'
  return new Date(value).toLocaleString()
}

function ResultSettlementDetails({
  eventId,
  result,
}: {
  eventId: string
  result: ResultListItem
}) {
  const settled = Boolean(result.settlement_completed_at)

  return (
    <Stack gap={3} fontSize="sm">
      <Text fontWeight="medium">Settlement details</Text>
      <Text color="fg.muted">
        Result: {FIGHT_RESULT_TYPE_LABELS[result.result_type]}
        {result.under_protest ? ' · Under protest' : ''}
      </Text>

      {result.handler_settlements.length > 0 ? (
        <Stack gap={2}>
          <Text fontWeight="medium">Match Winners</Text>
          {result.handler_settlements.map((handler) => (
            <Flex
              key={`${handler.name}-${handler.side}-${handler.totalPayout}`}
              justify="space-between"
              gap={2}
              wrap="wrap"
            >
              <Text>
                {handler.name} ({handler.side})
                {handler.kind === 'win'
                  ? ` · Bet ${formatCurrency(handler.betAmount)} + won ${formatCurrency(handler.winnings)}`
                  : ' · Draw refund'}
              </Text>
              <Text>
                {formatCurrency(handler.totalPayout)} ·{' '}
                {handler.status === 'paid' ? formatPaidAt(handler.paid_at) : 'Pending'}
              </Text>
            </Flex>
          ))}
        </Stack>
      ) : null}

      {result.vip_settlements.length > 0 ? (
        <Stack gap={2}>
          <Text fontWeight="medium">VIP Palitada</Text>
          {result.vip_settlements.map((vip) => (
            <Flex
              key={`${vip.name}-${vip.action}-${vip.amount}`}
              justify="space-between"
              gap={2}
              wrap="wrap"
            >
              <Text>
                {vip.action} {vip.name}
              </Text>
              <Text>
                {formatCurrency(vip.amount)} ·{' '}
                {vip.status === 'paid' ? formatPaidAt(vip.paid_at) : 'Pending'}
              </Text>
            </Flex>
          ))}
        </Stack>
      ) : (
        <Text color="fg.muted">No VIP Palitada payments for this fight.</Text>
      )}

      <Text>
        Revolving fund:{' '}
        {result.revolving_fund_complete ? 'All posts complete' : 'Posts pending'}
      </Text>

      {settled ? (
        <Text color="fg.muted">
          Match settled {formatPaidAt(result.settlement_completed_at)}
        </Text>
      ) : (
        <Link
          href={`/dashboard/events/${eventId}/matching?view=settling`}
          color="blue.fg"
          fontWeight="medium"
        >
          Open Matching → Settling
        </Link>
      )}
    </Stack>
  )
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
  const [expandedResultIds, setExpandedResultIds] = useState<Set<string>>(new Set())
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

  function toggleExpanded(resultId: string) {
    setExpandedResultIds((current) => {
      const next = new Set(current)
      if (next.has(resultId)) next.delete(resultId)
      else next.add(resultId)
      return next
    })
  }

  return (
    <PageStack>
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
        <PanelCard title="Record result">
          {pendingMatches.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              No matches are waiting for a result.
            </Text>
          ) : (
            <form action={recordFormAction}>
              <Stack gap={LAYOUT_GAP.form}>
              <input type="hidden" name="eventId" value={eventId} />
              <FormField label="Match" required>
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
              </FormField>
              <FormField label="Result" required>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field name="resultType" defaultValue="meron_win">
                    {Object.entries(FIGHT_RESULT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </FormField>
              <FormField label="Notes">
                <Textarea name="notes" rows={2} placeholder="Optional notes" />
              </FormField>
              <Checkbox.Root name="underProtest">
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>Under protest</Checkbox.Label>
              </Checkbox.Root>
              <Button type="submit" loading={recordPending} alignSelf={{ base: 'stretch', sm: 'flex-start' }} size="md" width={{ base: 'full', sm: 'auto' }}>
                Submit result
              </Button>
              </Stack>
            </form>
          )}
        </PanelCard>
      ) : null}

      <PanelCard flush title="Recorded results">
        <Text fontSize="sm" color="fg.muted" px={{ base: 4, lg: LAYOUT_GAP.cardPadding }} pb={LAYOUT_GAP.cardTitle}>
          Verified results update event standings. Expand a row to view settlement details after a fight is marked settled.
          <Text as="span" display={{ base: 'inline', lg: 'none' }}>
            {' '}
            Swipe horizontally to see all columns.
          </Text>
        </Text>
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
                  {['Fight', 'Meron', 'Wala', 'Result', 'Status', 'Settlement', 'Actions'].map(
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
                {results.map((result) => {
                  const settlement = settlementBadge(result)
                  const expanded = expandedResultIds.has(result.id)
                  const showDetails =
                    expanded &&
                    (result.settlement_completed_at ||
                      result.match_status === 'settling' ||
                      result.vip_settlements.length > 0 ||
                      result.handler_settlements.length > 0)

                  return (
                    <Fragment key={result.id}>
                      <Box as="tr" borderTopWidth="1px" borderColor="border">
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
                          {settlement.label === '—' ? (
                            <Text color="fg.muted">—</Text>
                          ) : (
                            <Badge colorPalette={settlement.color} size="sm">
                              {settlement.label}
                            </Badge>
                          )}
                        </Box>
                        <Box as="td" px={4} py={3}>
                          <Stack gap={2}>
                            {canManage && result.result_status === 'submitted' ? (
                              <form action={verifyFormAction}>
                                <input type="hidden" name="resultId" value={result.id} />
                                <input type="hidden" name="eventId" value={eventId} />
                                <Button
                                  type="submit"
                                  size="md"
                                  variant="outline"
                                  loading={verifyPending}
                                  width={{ base: 'full', sm: 'auto' }}
                                >
                                  Verify
                                </Button>
                              </form>
                            ) : (
                              <Text color="fg.muted">—</Text>
                            )}
                            {showDetails || settlement.label !== '—' ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleExpanded(result.id)}
                                width={{ base: 'full', sm: 'auto' }}
                              >
                                {expanded ? 'Hide details' : 'View details'}
                              </Button>
                            ) : null}
                          </Stack>
                        </Box>
                      </Box>
                      {showDetails ? (
                        <Box as="tr" borderTopWidth="1px" borderColor="border">
                          <td colSpan={7}>
                            <Box px={4} py={4} bg="bg.subtle">
                              <ResultSettlementDetails eventId={eventId} result={result} />
                            </Box>
                          </td>
                        </Box>
                      ) : null}
                    </Fragment>
                  )
                })}
              </Box>
            </Box>
          </Box>
        )}
      </PanelCard>
    </PageStack>
  )
}
