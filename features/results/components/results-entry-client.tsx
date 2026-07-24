'use client'

import { Fragment, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Flex,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useActionState } from 'react'

import {
  ButtonGroup,
  LAYOUT_GAP,
  PageStack,
  PanelCard,
  SettlementRow,
  SettlementSection,
} from '@/components/dashboard'
import { formatCurrency } from '@/features/matches/components/matching-shared'
import {
  verifyResultAction,
  type ResultActionState,
} from '@/features/results/actions'
import {
  FIGHT_RESULT_TYPE_LABELS,
  RESULT_STATUS_LABELS,
} from '@/features/results/schema'
import type { ResultListItem } from '@/features/results/types'

const initialState: ResultActionState = {}

/** Matches MatchBirdDetailCard / outcome actions: Meron blue, Wala red. */
const SIDE_COLORS = {
  meron: 'blue',
  wala: 'red',
} as const

function statusColor(
  status: ResultListItem['result_status']
): 'gray' | 'blue' | 'green' | 'purple' {
  if (status === 'verified' || status === 'final') return 'green'
  if (status === 'submitted') return 'blue'
  if (status === 'draft') return 'gray'
  return 'purple'
}

function matchingLabel(result: ResultListItem): string {
  return result.matching_number ?? `Fight #${result.fight_number}`
}

function SideEntryName({
  side,
  name,
  result,
}: {
  side: 'meron' | 'wala'
  name: string
  result: ResultListItem
}) {
  const isWinner =
    result.winning_side === side ||
    (side === 'meron' && result.result_type === 'meron_win') ||
    (side === 'wala' && result.result_type === 'wala_win')

  if (!isWinner) {
    return <Text as="span">{name}</Text>
  }

  const palette = SIDE_COLORS[side]
  return (
    <Badge colorPalette={palette} size="sm" variant="subtle" fontWeight="semibold">
      {name}
    </Badge>
  )
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
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function hasSettlementDetails(result: ResultListItem): boolean {
  return (
    Boolean(result.settlement_completed_at) ||
    result.match_status === 'settling' ||
    result.vip_settlements.length > 0 ||
    result.handler_settlements.length > 0
  )
}

function ResultSettlementDetails({
  eventId,
  result,
}: {
  eventId: string
  result: ResultListItem
}) {
  const settled = Boolean(result.settlement_completed_at)
  const settlement = settlementBadge(result)
  const handlers = result.handler_settlements
  const vips = result.vip_settlements
  const handlersPaid = handlers.filter((row) => row.status === 'paid').length
  const vipsPaid = vips.filter((row) => row.status === 'paid').length

  return (
    <Stack gap={4} fontSize="sm">
      <Flex gap={2} wrap="wrap">
        <Badge colorPalette="purple">
          Result: {FIGHT_RESULT_TYPE_LABELS[result.result_type]}
        </Badge>
        <Badge colorPalette="gray">{matchingLabel(result)}</Badge>
        {result.under_protest ? (
          <Badge colorPalette="orange">Under protest</Badge>
        ) : null}
        {settlement.label !== '—' ? (
          <Badge colorPalette={settlement.color}>{settlement.label}</Badge>
        ) : null}
      </Flex>

      <SettlementSection
        title="Match Winners"
        actionHeader="Paid at"
        progressLabel={
          handlers.length > 0 ? `${handlersPaid} of ${handlers.length} paid` : undefined
        }
        progressColor={
          handlersPaid === handlers.length && handlers.length > 0 ? 'green' : 'orange'
        }
        emptyMessage={
          <Text fontSize="sm" color="fg.muted">
            No handler payout obligations for this fight result.
          </Text>
        }
      >
        {handlers.length > 0
          ? handlers.map((handler) => (
              <SettlementRow
                key={`${handler.name}-${handler.side}-${handler.totalPayout}`}
                primary={handler.name}
                secondary={
                  handler.kind === 'win'
                    ? `Bet ${formatCurrency(handler.betAmount)} + won ${formatCurrency(handler.winnings)} = ${formatCurrency(handler.totalPayout)}`
                    : 'Draw refund'
                }
                meta={
                  <Badge size="sm" colorPalette="purple">
                    {handler.side}
                  </Badge>
                }
                amount={handler.totalPayout}
                statusLabel={handler.status === 'paid' ? 'Paid at Cashier' : 'Pending'}
                statusColor={handler.status === 'paid' ? 'green' : 'orange'}
                action={
                  <Text fontSize="sm" color="fg.muted" textAlign={{ md: 'right' }} w="full">
                    {handler.status === 'paid' ? formatPaidAt(handler.paid_at) : '—'}
                  </Text>
                }
              />
            ))
          : null}
      </SettlementSection>

      <SettlementSection
        title="VIP payments"
        actionHeader="Paid at"
        progressLabel={
          vips.length > 0 ? `${vipsPaid} of ${vips.length} complete` : undefined
        }
        progressColor={vipsPaid === vips.length && vips.length > 0 ? 'green' : 'orange'}
        emptyMessage={
          <Text fontSize="sm" color="fg.muted">
            No VIP contributors on this fight. Monton Palitada is settled through Revolving
            fund below.
          </Text>
        }
      >
        {vips.length > 0
          ? vips.map((vip) => (
              <SettlementRow
                key={`${vip.name}-${vip.action}-${vip.amount}`}
                primary={vip.name}
                meta={
                  <>
                    {vip.side ? (
                      <Badge size="sm" colorPalette="purple">
                        {vip.side}
                      </Badge>
                    ) : null}
                    <Badge size="sm" colorPalette="blue">
                      {vip.action}
                    </Badge>
                  </>
                }
                amount={vip.amount}
                statusLabel={vip.status === 'paid' ? 'Paid' : 'Pending'}
                statusColor={vip.status === 'paid' ? 'green' : 'orange'}
                action={
                  <Text fontSize="sm" color="fg.muted" textAlign={{ md: 'right' }} w="full">
                    {vip.status === 'paid' ? formatPaidAt(vip.paid_at) : '—'}
                  </Text>
                }
              />
            ))
          : null}
      </SettlementSection>

      <SettlementSection
        title="Revolving fund"
        actionHeader="Paid at"
        progressLabel={result.revolving_fund_complete ? 'Complete' : 'Pending'}
        progressColor={result.revolving_fund_complete ? 'green' : 'orange'}
      >
        <SettlementRow
          primary={
            result.revolving_fund_complete
              ? 'All revolving fund posts complete'
              : 'Revolving fund posts pending'
          }
          amount={null}
          amountLabel="—"
          statusLabel={result.revolving_fund_complete ? 'Complete' : 'Pending'}
          statusColor={result.revolving_fund_complete ? 'green' : 'orange'}
        />
      </SettlementSection>

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

function ResultActions({
  eventId,
  result,
  canManage,
  expanded,
  onToggle,
  verifyFormAction,
  verifyPending,
  align = 'end',
}: {
  eventId: string
  result: ResultListItem
  canManage: boolean
  expanded: boolean
  onToggle: () => void
  verifyFormAction: (payload: FormData) => void
  verifyPending: boolean
  align?: 'start' | 'end'
}) {
  const settlement = settlementBadge(result)
  const canExpand = hasSettlementDetails(result) || settlement.label !== '—'
  const showVerify = canManage && result.result_status === 'submitted'

  if (!showVerify && !canExpand) return null

  return (
    <ButtonGroup
      justify={align === 'end' ? 'flex-end' : 'flex-start'}
      direction="row"
    >
      {showVerify ? (
        <form action={verifyFormAction}>
          <input type="hidden" name="resultId" value={result.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <Button type="submit" size="md" variant="outline" loading={verifyPending}>
            Verify
          </Button>
        </form>
      ) : null}
      {canExpand ? (
        <Button type="button" size="md" variant="outline" onClick={onToggle}>
          {expanded ? 'Hide details' : 'View details'}
        </Button>
      ) : null}
    </ButtonGroup>
  )
}

export function ResultsEntryClient({
  eventId,
  results,
  canManage,
}: {
  eventId: string
  results: ResultListItem[]
  canManage: boolean
}) {
  const [expandedResultIds, setExpandedResultIds] = useState<Set<string>>(new Set())
  const [verifyState, verifyFormAction, verifyPending] = useActionState(
    verifyResultAction,
    initialState
  )

  const feedback = verifyState.error ?? verifyState.success
  const feedbackTone = verifyState.error ? 'red' : 'green'

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

      <PanelCard flush title="Recorded results">
        <Text
          fontSize="sm"
          color="fg.muted"
          px={{ base: 4, lg: LAYOUT_GAP.cardPadding }}
          pb={LAYOUT_GAP.cardTitle}
        >
          Verified results update event standings. Expand a result to view a read-only
          settlement summary (Match Winners, VIP payments, Revolving fund).
        </Text>
        {results.length === 0 ? (
          <Box p={4}>
            <Text fontSize="sm" color="fg.muted">
              No results recorded yet.
            </Text>
          </Box>
        ) : (
          <>
            <Box display={{ base: 'block', lg: 'none' }}>
              {results.map((result) => {
                const settlement = settlementBadge(result)
                const expanded = expandedResultIds.has(result.id)
                const showDetails = expanded && hasSettlementDetails(result)

                return (
                  <Box
                    key={result.id}
                    px={4}
                    py={3}
                    borderTopWidth="1px"
                    borderColor="border"
                  >
                    <Box
                      borderWidth="1px"
                      borderColor="border"
                      borderRadius="md"
                      p={4}
                      bg="bg"
                    >
                      <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
                        <Text fontSize="lg" fontWeight="semibold">
                          {matchingLabel(result)}
                        </Text>
                        <Flex gap={2} wrap="wrap" justify="flex-end">
                          <Badge colorPalette={statusColor(result.result_status)} size="sm">
                            {RESULT_STATUS_LABELS[result.result_status]}
                          </Badge>
                          {settlement.label !== '—' ? (
                            <Badge colorPalette={settlement.color} size="sm">
                              {settlement.label}
                            </Badge>
                          ) : null}
                        </Flex>
                      </Flex>

                      <Flex
                        justify="space-between"
                        align="flex-end"
                        gap={3}
                        wrap="wrap"
                      >
                        <Stack gap={1} flex="1" minW={0}>
                          <Flex fontSize="sm" gap={1} align="center" wrap="wrap">
                            <Text as="span" color="fg.muted">
                              Meron:
                            </Text>
                            <SideEntryName
                              side="meron"
                              name={result.meron_entry_name}
                              result={result}
                            />
                          </Flex>
                          <Flex fontSize="sm" gap={1} align="center" wrap="wrap">
                            <Text as="span" color="fg.muted">
                              Wala:
                            </Text>
                            <SideEntryName
                              side="wala"
                              name={result.wala_entry_name}
                              result={result}
                            />
                          </Flex>
                          <Flex gap={2} align="center" wrap="wrap" mt={1}>
                            <Text fontSize="sm" fontWeight="medium">
                              {FIGHT_RESULT_TYPE_LABELS[result.result_type]}
                            </Text>
                            {result.under_protest ? (
                              <Badge colorPalette="orange" size="sm">
                                Protest
                              </Badge>
                            ) : null}
                          </Flex>
                        </Stack>

                        <Box flexShrink={0}>
                          <ResultActions
                            eventId={eventId}
                            result={result}
                            canManage={canManage}
                            expanded={expanded}
                            onToggle={() => toggleExpanded(result.id)}
                            verifyFormAction={verifyFormAction}
                            verifyPending={verifyPending}
                            align="end"
                          />
                        </Box>
                      </Flex>

                      {showDetails ? (
                        <Box mt={4} pt={4} borderTopWidth="1px" borderColor="border">
                          <ResultSettlementDetails eventId={eventId} result={result} />
                        </Box>
                      ) : null}
                    </Box>
                  </Box>
                )
              })}
            </Box>

            <Box display={{ base: 'none', lg: 'block' }} overflowX="auto">
              <Box as="table" width="full" fontSize="sm">
                <Box as="thead" bg="bg.subtle">
                  <Box as="tr">
                    {[
                      'Active Matching',
                      'Meron',
                      'Wala',
                      'Result',
                      'Status',
                      'Settlement',
                      'Actions',
                    ].map((heading) => (
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
                  {results.map((result) => {
                    const settlement = settlementBadge(result)
                    const expanded = expandedResultIds.has(result.id)
                    const showDetails = expanded && hasSettlementDetails(result)

                    return (
                      <Fragment key={result.id}>
                        <Box as="tr" borderTopWidth="1px" borderColor="border">
                          <Box as="td" px={4} py={3} fontWeight="medium">
                            {matchingLabel(result)}
                          </Box>
                          <Box as="td" px={4} py={3}>
                            <SideEntryName
                              side="meron"
                              name={result.meron_entry_name}
                              result={result}
                            />
                          </Box>
                          <Box as="td" px={4} py={3}>
                            <SideEntryName
                              side="wala"
                              name={result.wala_entry_name}
                              result={result}
                            />
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
                            <ResultActions
                              eventId={eventId}
                              result={result}
                              canManage={canManage}
                              expanded={expanded}
                              onToggle={() => toggleExpanded(result.id)}
                              verifyFormAction={verifyFormAction}
                              verifyPending={verifyPending}
                            />
                          </Box>
                        </Box>
                        {showDetails ? (
                          <Box as="tr" borderTopWidth="1px" borderColor="border">
                            <td colSpan={7}>
                              <Box px={4} py={4} bg="bg.subtle">
                                <ResultSettlementDetails
                                  eventId={eventId}
                                  result={result}
                                />
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
          </>
        )}
      </PanelCard>
    </PageStack>
  )
}
