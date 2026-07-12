'use client'

import { Box, Grid, Link as ChakraLink, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'

import { EVENT_STATUS_LABELS } from '@/features/events/schema'
import type { PromoterEventSummary } from '@/features/promoter-portal/types'
import { StandingsTableClient } from '@/features/standings/components/standings-table-client'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function PortalEventSummaryClient({
  summary,
}: {
  summary: PromoterEventSummary
}) {
  const { event, settlement } = summary

  return (
    <Stack gap={6}>
      <Box>
        <ChakraLink asChild fontSize="sm" color="fg.muted">
          <Link href="/portal/events">← Back to events</Link>
        </ChakraLink>
        <Text fontSize="2xl" fontWeight="semibold" mt={2}>
          {event.name}
        </Text>
        <Text color="fg.muted">
          {event.venue} · {formatDate(event.event_date)} ·{' '}
          {EVENT_STATUS_LABELS[event.status]}
        </Text>
      </Box>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
          <Text fontSize="sm" color="fg.muted">
            Referred entries
          </Text>
          <Text fontSize="3xl" fontWeight="semibold" mt={1}>
            {summary.referred_entries_count}
          </Text>
        </Box>
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
          <Text fontSize="sm" color="fg.muted">
            Settlement status
          </Text>
          <Text fontSize="lg" fontWeight="semibold" mt={1}>
            {settlement?.settlement_status ?? 'Not available'}
          </Text>
        </Box>
      </Grid>

      {settlement ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
          <Text fontWeight="medium" mb={3}>
            Settlement summary
          </Text>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3} fontSize="sm">
            <Box>
              <Text color="fg.muted">Reference</Text>
              <Text fontWeight="medium">{settlement.settlement_reference}</Text>
            </Box>
            <Box>
              <Text color="fg.muted">Gross collection</Text>
              <Text>{formatCurrency(settlement.gross_collection)}</Text>
            </Box>
            <Box>
              <Text color="fg.muted">Eligible collection</Text>
              <Text>{formatCurrency(settlement.eligible_collection)}</Text>
            </Box>
            <Box>
              <Text color="fg.muted">Prize pool</Text>
              <Text>{formatCurrency(settlement.prize_pool)}</Text>
            </Box>
            <Box>
              <Text color="fg.muted">Promoter commission</Text>
              <Text>{formatCurrency(settlement.promoter_commission)}</Text>
            </Box>
            <Box>
              <Text color="fg.muted">Amount payable</Text>
              <Text>{formatCurrency(settlement.amount_payable)}</Text>
            </Box>
            <Box>
              <Text color="fg.muted">Amount receivable</Text>
              <Text>{formatCurrency(settlement.amount_receivable)}</Text>
            </Box>
            {settlement.settled_at ? (
              <Box>
                <Text color="fg.muted">Settled at</Text>
                <Text>{formatDate(settlement.settled_at)}</Text>
              </Box>
            ) : null}
          </Grid>
        </Box>
      ) : null}

      <StandingsTableClient standings={summary.standings} />
    </Stack>
  )
}
