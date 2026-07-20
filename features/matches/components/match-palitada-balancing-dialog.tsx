'use client'

import { useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Stack,
  Text,
} from '@chakra-ui/react'

import {
  calculatePledgeSettlement,
  getPledgeBaseAmount,
} from '@/features/matches/bet-balancing'
import { MatchPalitadaRecordForm } from '@/features/matches/components/match-palitada-record-form'
import { formatCurrency } from '@/features/matches/components/matching-shared'
import { FIGHT_SIDE_LABELS } from '@/features/matches/schema'
import type { MatchListItem } from '@/features/matches/types'

type MatchPalitadaBalancingDialogProps = {
  eventId: string
  match: MatchListItem
  taxPerFight: number
  taxCommissionRate: number
  disabled?: boolean
}

export function MatchPalitadaBalancingDialog({
  eventId,
  match,
  taxPerFight,
  taxCommissionRate,
  disabled = false,
}: MatchPalitadaBalancingDialogProps) {
  const [open, setOpen] = useState(false)

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

  return (
    <>
      <Box>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || settlement.isBalanced}
          onClick={() => setOpen(true)}
        >
          Bet Balancing
        </Button>
        <Text fontSize="xs" color="fg.muted" mt={1}>
          {settlement.isBalanced
            ? 'Sides are balanced — Palitada not needed.'
            : settlement.underdogSide
              ? `${FIGHT_SIDE_LABELS[settlement.underdogSide]} needs up to ${formatCurrency(settlement.amountNeededToBalance)} Palitada.`
              : 'Record Palitada on the underdog side before handlers are called.'}
        </Text>
      </Box>

      <Dialog.Root open={open} onOpenChange={(details) => setOpen(details.open)} size="lg">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Bet Balancing · Fight #{match.fight_number}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Flex gap={2} wrap="wrap">
                  <Badge colorPalette={settlement.isBalanced ? 'green' : 'orange'}>
                    {settlement.isBalanced ? 'Balanced' : 'Imbalanced'}
                  </Badge>
                  {!settlement.isBalanced && settlement.underdogSide ? (
                    <Badge colorPalette="blue">
                      Underdog: {FIGHT_SIDE_LABELS[settlement.underdogSide]}
                    </Badge>
                  ) : null}
                  {!settlement.isBalanced ? (
                    <Badge colorPalette="yellow">
                      Remaining: {formatCurrency(settlement.amountNeededToBalance)}
                    </Badge>
                  ) : null}
                </Flex>

                <Box borderWidth="1px" borderColor="border" rounded="md" p={3}>
                  <MatchPalitadaRecordForm
                    eventId={eventId}
                    match={match}
                    underdogSide={settlement.underdogSide}
                    disabled={disabled}
                  />
                </Box>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="outline">Close</Button>
              </Dialog.CloseTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}
