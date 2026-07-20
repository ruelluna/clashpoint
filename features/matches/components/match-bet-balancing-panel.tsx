'use client'

import { Badge, Box, Flex, Grid, Stack, Text } from '@chakra-ui/react'

import { PanelCard } from '@/components/dashboard'
import {
  computeBetBalancing,
  getPledgeBaseAmount,
} from '@/features/matches/bet-balancing'
import { formatCurrency } from '@/features/matches/components/matching-shared'
import type { MatchListItem } from '@/features/matches/types'

type MatchBetBalancingPanelProps = {
  match: MatchListItem
  taxPerFight: number
  taxCommissionRate: number
}

function StatCard({
  label,
  value,
  footer,
  colorPalette,
}: {
  label: string
  value: string
  footer?: string
  colorPalette?: string
}) {
  return (
    <Box
      p={4}
      rounded="md"
      borderWidth="1px"
      borderColor="border"
      bg={colorPalette ? `${colorPalette}.subtle` : 'bg.subtle'}
    >
      <Text fontSize="sm" color="fg.muted" mb={1}>
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="bold">
        {value}
      </Text>
      {footer ? (
        <Text fontSize="xs" color="fg.muted" mt={1}>
          {footer}
        </Text>
      ) : null}
    </Box>
  )
}

export function MatchBetBalancingPanel({
  match,
  taxPerFight,
  taxCommissionRate,
}: MatchBetBalancingPanelProps) {
  const snapshot = computeBetBalancing({
    meronBase: getPledgeBaseAmount(
      match.meron.bet_amount,
      match.meron.bet_collected_amount,
      match.meron.bet_payment_status
    ),
    walaBase: getPledgeBaseAmount(
      match.wala.bet_amount,
      match.wala.bet_collected_amount,
      match.wala.bet_payment_status
    ),
    commissionRatePercent: taxCommissionRate,
    taxPerFight,
  })

  const imbalanceLabel = snapshot.isBalanced
    ? 'Sides are balanced'
    : snapshot.imbalanceSide === 'meron'
      ? `Meron needs ${formatCurrency(snapshot.imbalance)}`
      : `Wala needs ${formatCurrency(snapshot.imbalance)}`

  return (
    <PanelCard title="Pledges & Bet Balancing (Palitada)">
      <Flex justify="flex-end" mb={3}>
        <Badge colorPalette={snapshot.isBalanced ? 'green' : 'orange'} size="sm">
          {snapshot.isBalanced ? 'Balanced' : 'Imbalanced'}
        </Badge>
      </Flex>
      <Stack gap={4}>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
          <StatCard
            label="Meron Total"
            value={formatCurrency(snapshot.meronTotal)}
            footer={`Base: ${formatCurrency(snapshot.meronBase)} | Palitada: ${formatCurrency(snapshot.meronPalitada)}`}
            colorPalette="blue"
          />
          <StatCard
            label="Wala Total"
            value={formatCurrency(snapshot.walaTotal)}
            footer={`Base: ${formatCurrency(snapshot.walaBase)} | Palitada: ${formatCurrency(snapshot.walaPalitada)}`}
            colorPalette="red"
          />
          <StatCard
            label="Imbalance"
            value={formatCurrency(snapshot.imbalance)}
            footer={imbalanceLabel}
            colorPalette="yellow"
          />
        </Grid>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
          <StatCard
            label="Total Commission"
            value={formatCurrency(snapshot.totalCommission)}
            footer={`Rate: ${snapshot.commissionRatePercent.toFixed(1)}% of total pledges`}
            colorPalette="yellow"
          />
          <StatCard
            label="Total Tax"
            value={formatCurrency(snapshot.taxPerFight)}
            footer={`Regular Event: ${formatCurrency(snapshot.taxPerFight)}`}
            colorPalette="green"
          />
        </Grid>

        <Box
          p={4}
          rounded="md"
          borderWidth="1px"
          borderColor="green.muted"
          bg="green.subtle"
        >
          <Text fontWeight="semibold" mb={3}>
            Winnings Potential
          </Text>
          <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={3} mb={4}>
            <Box p={3} rounded="md" bg="bg" borderWidth="1px" borderColor="border">
              <Text fontSize="xs" color="fg.muted">
                Meron Odds
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="blue.fg">
                {snapshot.meronOdds.toFixed(2)}
              </Text>
            </Box>
            <Box p={3} rounded="md" bg="bg" borderWidth="1px" borderColor="border">
              <Text fontSize="xs" color="fg.muted">
                Wala Odds
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="red.fg">
                {snapshot.walaOdds.toFixed(2)}
              </Text>
            </Box>
          </Grid>

          <Stack gap={2}>
            <Flex
              justify="space-between"
              align="center"
              p={2}
              rounded="md"
              bg="blue.subtle"
              gap={2}
              wrap="wrap"
            >
              <Text fontSize="sm">
                {formatCurrency(snapshot.meronTotal)} × {snapshot.meronOdds.toFixed(2)}
              </Text>
              <Text fontWeight="semibold">{formatCurrency(snapshot.meronWinningsPotential)}</Text>
            </Flex>
            <Flex
              justify="space-between"
              align="center"
              p={2}
              rounded="md"
              bg="red.subtle"
              gap={2}
              wrap="wrap"
            >
              <Text fontSize="sm">
                {formatCurrency(snapshot.walaTotal)} × {snapshot.walaOdds.toFixed(2)}
              </Text>
              <Text fontWeight="semibold">{formatCurrency(snapshot.walaWinningsPotential)}</Text>
            </Flex>
          </Stack>

          <Flex
            mt={3}
            pt={3}
            borderTopWidth="1px"
            borderColor="border"
            gap={4}
            wrap="wrap"
            fontSize="xs"
            color="fg.muted"
          >
            <Text>Commission: {snapshot.commissionRatePercent.toFixed(0)}%</Text>
            <Text>Tax: {formatCurrency(snapshot.taxPerFight)}</Text>
            <Text>
              Total Deduction: {snapshot.commissionRatePercent.toFixed(0)}% +{' '}
              {formatCurrency(snapshot.taxPerFight)}
            </Text>
          </Flex>
        </Box>
      </Stack>
    </PanelCard>
  )
}
