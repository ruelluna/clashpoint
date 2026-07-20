'use client'

import { Badge, Box, Flex, Grid, Stack, Text } from '@chakra-ui/react'

import { LAYOUT_GAP, PanelCard } from '@/components/dashboard'
import {
  calculatePledgeSettlement,
  getPledgeBaseAmount,
  type SideSettlementBreakdown,
} from '@/features/matches/bet-balancing'
import { formatCurrency } from '@/features/matches/components/matching-shared'
import type { MatchListItem } from '@/features/matches/types'

function formatPalitadaFooter(contributors: MatchListItem['meron_palitada']): string {
  if (contributors.length === 0) return 'Palitada: none'
  return contributors
    .map(
      (contributor) =>
        `${contributor.contributor_type === 'monton' ? 'Monton' : 'VIP'} ${formatCurrency(contributor.amount)}`
    )
    .join(' · ')
}

function SideSettlementPanel({
  sideLabel,
  side,
  colorPalette,
  montonTotal,
  grossPool,
}: {
  sideLabel: string
  side: SideSettlementBreakdown
  colorPalette: string
  montonTotal: number
  grossPool: number
}) {
  const palitadaPayoutTotal = side.contributors.reduce(
    (sum, contributor) => sum + contributor.winnings,
    0
  )

  return (
    <Box
      p={4}
      rounded="md"
      borderWidth="1px"
      borderColor="border"
      bg={`${colorPalette}.subtle`}
    >
      <Text fontWeight="semibold" mb={3}>
        If {sideLabel} wins
      </Text>
      <Stack gap={3}>
        <StatCard
          label={`${sideLabel} side win total`}
          value={formatCurrency(side.sideWinTotal)}
          footer={`Monton ${formatCurrency(montonTotal)} + side win ${formatCurrency(side.sideWinTotal)} = gross pool ${formatCurrency(grossPool)}`}
          colorPalette={colorPalette}
          size="compact"
        />
        <StatCard
          label={`${sideLabel} inside odds`}
          value={side.odds.toFixed(2)}
          footer={`${formatCurrency(side.sideTotal)} total · pool ${formatCurrency(side.sideNet)} net`}
          colorPalette={colorPalette}
          size="compact"
        />
        <StatCard
          label={`${sideLabel} handler payout`}
          value={formatCurrency(side.handlerPayout)}
          footer={
            side.basePledge > 0
              ? `Net profit ${formatCurrency(side.handlerWinnings)} · stake ${formatCurrency(side.basePledge)} returned in payout`
              : 'No handler pledge on this side'
          }
          colorPalette={colorPalette}
          size="compact"
        />
        {side.contributors.length > 0 ? (
          <Stack gap={2}>
            <Text fontSize="xs" color="fg.muted">
              Palitada payouts ({formatCurrency(palitadaPayoutTotal)} of side win total)
            </Text>
            {side.contributors.map((contributor) => (
              <StatCard
                key={contributor.id ?? contributor.contributorName}
                label={`${contributor.contributorType === 'monton' ? 'Monton' : 'VIP'} Palitada payout`}
                value={formatCurrency(contributor.winnings)}
                footer={`${contributor.contributorName} · ${formatCurrency(contributor.amount)} accepted`}
                size="compact"
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  )
}

function StatCard({
  label,
  value,
  footer,
  colorPalette,
  size = 'default',
}: {
  label: string
  value: string
  footer?: string
  colorPalette?: string
  size?: 'default' | 'compact'
}) {
  return (
    <Box
      p={size === 'compact' ? 3 : 4}
      rounded="md"
      borderWidth="1px"
      borderColor="border"
      bg={colorPalette ? `${colorPalette}.subtle` : 'bg.subtle'}
    >
      <Text fontSize="sm" color="fg.muted" mb={1}>
        {label}
      </Text>
      <Text fontSize={size === 'compact' ? 'xl' : '2xl'} fontWeight="bold">
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

type MatchBetBalancingPanelProps = {
  match: MatchListItem
  taxPerFight: number
  taxCommissionRate: number
  fightNumber?: number
}

export function MatchBetBalancingPanel({
  match,
  taxPerFight,
  taxCommissionRate,
  fightNumber,
}: MatchBetBalancingPanelProps) {
  const settlement = calculatePledgeSettlement({
    meronBasePledge: getPledgeBaseAmount(
      match.meron.bet_amount,
      match.meron.bet_collected_amount,
      match.meron.bet_payment_status
    ),
    walaBasePledge: getPledgeBaseAmount(
      match.wala.bet_amount,
      match.wala.bet_collected_amount,
      match.wala.bet_payment_status
    ),
    meronPalitadaContributors: match.meron_palitada.map((contributor) => ({
      id: contributor.id,
      contributorName: contributor.contributor_name,
      contributorType: contributor.contributor_type,
      amount: contributor.amount,
    })),
    walaPalitadaContributors: match.wala_palitada.map((contributor) => ({
      id: contributor.id,
      contributorName: contributor.contributor_name,
      contributorType: contributor.contributor_type,
      amount: contributor.amount,
    })),
    commissionRatePercent: taxCommissionRate,
    taxAmount: taxPerFight,
  })

  const imbalanceLabel = settlement.isBalanced
    ? 'Sides are balanced'
    : settlement.underdogSide === 'meron'
      ? `Meron needs ${formatCurrency(settlement.amountNeededToBalance)} Palitada`
      : `Wala needs ${formatCurrency(settlement.amountNeededToBalance)} Palitada`

  const panelTitle = fightNumber
    ? `Pledges & Bet Balancing (Palitada) · Fight #${fightNumber}`
    : 'Pledges & Bet Balancing (Palitada)'

  return (
    <Stack gap={LAYOUT_GAP.section}>
      <PanelCard title={panelTitle}>
        <Flex justify="flex-end" mb={3}>
          <Badge colorPalette={settlement.isBalanced ? 'green' : 'orange'} size="sm">
            {settlement.isBalanced ? 'Balanced' : 'Imbalanced'}
          </Badge>
        </Flex>
        <Stack gap={4}>
          <Grid
            templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
            gap={3}
          >
            <StatCard
              label="Meron Total"
              value={formatCurrency(settlement.meronTotal)}
              footer={`Handler: ${formatCurrency(settlement.meronBasePledge)} · ${formatPalitadaFooter(match.meron_palitada)}`}
              colorPalette="blue"
            />
            <StatCard
              label="Wala Total"
              value={formatCurrency(settlement.walaTotal)}
              footer={`Handler: ${formatCurrency(settlement.walaBasePledge)} · ${formatPalitadaFooter(match.wala_palitada)}`}
              colorPalette="red"
            />
            <StatCard
              label="Total Pool"
              value={formatCurrency(settlement.totalPool)}
              footer={`${formatCurrency(settlement.meronTotal)} + ${formatCurrency(settlement.walaTotal)}`}
            />
            <StatCard
              label="Difference"
              value={formatCurrency(settlement.imbalance)}
              footer={imbalanceLabel}
              colorPalette="yellow"
            />
          </Grid>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
            <StatCard
              label="Meron net"
              value={formatCurrency(settlement.meronNet)}
              footer={`Commission ${formatCurrency(settlement.meronCommission)} · Tax ${formatCurrency(settlement.meronTax)}`}
              colorPalette="blue"
              size="compact"
            />
            <StatCard
              label="Wala net"
              value={formatCurrency(settlement.walaNet)}
              footer={`Commission ${formatCurrency(settlement.walaCommission)} · Tax ${formatCurrency(settlement.walaTax)}`}
              colorPalette="red"
              size="compact"
            />
          </Grid>

          <StatCard
            label="Total winning pool"
            value={formatCurrency(settlement.totalWinningPool)}
            footer={`Meron ${settlement.meronOdds.toFixed(2)} · Wala ${settlement.walaOdds.toFixed(2)} inside odds · after commission and split tax`}
            colorPalette="green"
          />

          {match.in_meron_odds != null && match.in_wala_odds != null ? (
            <StatCard
              label="Persisted inside odds"
              value={`M ${match.in_meron_odds.toFixed(2)} / W ${match.in_wala_odds.toFixed(2)}`}
              footer="Frozen when the fight result was declared"
              size="compact"
            />
          ) : null}

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
            <Text fontSize="sm" color="fg.muted" mb={3}>
              When a side wins, the entire winning pool is paid to that side (handler + Palitada).
              Monton earnings plus the side win total equals the gross pledge pool.
            </Text>
            <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={3}>
              <SideSettlementPanel
                sideLabel="Meron"
                side={settlement.meron}
                colorPalette="blue"
                montonTotal={settlement.montonHouseEarnings}
                grossPool={settlement.totalPool}
              />
              <SideSettlementPanel
                sideLabel="Wala"
                side={settlement.wala}
                colorPalette="red"
                montonTotal={settlement.montonHouseEarnings}
                grossPool={settlement.totalPool}
              />
            </Grid>
          </Box>
        </Stack>
      </PanelCard>

      <PanelCard title="Monton Earnings">
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
          <StatCard
            label="Total Commission"
            value={formatCurrency(settlement.totalCommission)}
            footer={`Rate: ${settlement.commissionRatePercentage.toFixed(1)}% per side gross`}
            colorPalette="yellow"
          />
          <StatCard
            label="Total Tax"
            value={formatCurrency(settlement.totalTax)}
            footer={`${formatCurrency(taxPerFight)} per fight split equally`}
            colorPalette="orange"
          />
          <StatCard
            label="Monton Total"
            value={formatCurrency(settlement.montonHouseEarnings)}
            footer={`${formatCurrency(settlement.totalCommission)} commission + ${formatCurrency(settlement.totalTax)} tax · ${formatCurrency(settlement.montonHouseEarnings)} + ${formatCurrency(settlement.totalWinningPool)} winning pool = ${formatCurrency(settlement.totalPool)} gross pool`}
            colorPalette="green"
          />
        </Grid>
      </PanelCard>
    </Stack>
  )
}
