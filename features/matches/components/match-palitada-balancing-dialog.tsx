'use client'

import { useActionState, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react'

import { FormField } from '@/components/dashboard'
import {
  addPalitadaContributionAction,
  deletePalitadaContributionAction,
  type MatchActionState,
} from '@/features/matches/actions'
import {
  calculatePledgeSettlement,
  getPledgeBaseAmount,
} from '@/features/matches/bet-balancing'
import { formatCurrency } from '@/features/matches/components/matching-shared'
import { FIGHT_SIDE_LABELS } from '@/features/matches/schema'
import type { MatchListItem } from '@/features/matches/types'

const initialState: MatchActionState = {}

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
  const [addState, addAction, addPending] = useActionState(
    addPalitadaContributionAction,
    initialState
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    deletePalitadaContributionAction,
    initialState
  )

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

  const defaultSide = settlement.underdogSide ?? 'meron'
  const actionMessage = addState.error ?? addState.success ?? deleteState.error ?? deleteState.success

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

                {actionMessage ? (
                  <Text
                    fontSize="sm"
                    color={addState.error || deleteState.error ? 'red.fg' : 'green.fg'}
                  >
                    {actionMessage}
                  </Text>
                ) : null}

                <Box borderWidth="1px" borderColor="border" rounded="md" p={3}>
                  <Text fontWeight="semibold" mb={2}>
                    Record Palitada
                  </Text>
                  <form action={addAction}>
                    <input type="hidden" name="eventId" value={eventId} />
                    <input type="hidden" name="matchId" value={match.id} />
                    <Stack gap={3}>
                      <FormField label="Side" required>
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field name="side" defaultValue={defaultSide}>
                            <option value="meron">Meron</option>
                            <option value="wala">Wala</option>
                          </NativeSelect.Field>
                        </NativeSelect.Root>
                      </FormField>
                      <FormField label="Contributor name" required>
                        <Input name="contributorName" size="sm" required />
                      </FormField>
                      <FormField label="Contributor type" required>
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field name="contributorType" defaultValue="vip">
                            <option value="vip">VIP</option>
                            <option value="monton">Monton revolving fund</option>
                          </NativeSelect.Field>
                        </NativeSelect.Root>
                      </FormField>
                      <FormField label="Amount" required>
                        <Input
                          name="amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          size="sm"
                          required
                        />
                      </FormField>
                      <Button type="submit" size="sm" loading={addPending} alignSelf="flex-start">
                        Add Palitada
                      </Button>
                    </Stack>
                  </form>
                </Box>

                <Stack gap={2}>
                  <Text fontWeight="semibold">Recorded contributions</Text>
                  {[
                    ...match.meron_palitada.map((contributor) => ({
                      ...contributor,
                      side: 'meron' as const,
                    })),
                    ...match.wala_palitada.map((contributor) => ({
                      ...contributor,
                      side: 'wala' as const,
                    })),
                  ].length === 0 ? (
                    <Text fontSize="sm" color="fg.muted">
                      No Palitada recorded yet.
                    </Text>
                  ) : (
                    [
                      ...match.meron_palitada.map((contributor) => ({
                        ...contributor,
                        side: 'meron' as const,
                      })),
                      ...match.wala_palitada.map((contributor) => ({
                        ...contributor,
                        side: 'wala' as const,
                      })),
                    ].map((contributor) => (
                      <Flex
                        key={contributor.id}
                        justify="space-between"
                        align={{ base: 'stretch', sm: 'center' }}
                        direction={{ base: 'column', sm: 'row' }}
                        gap={2}
                        borderWidth="1px"
                        borderColor="border"
                        rounded="md"
                        p={3}
                      >
                        <Box>
                          <Text fontWeight="medium">{contributor.contributor_name}</Text>
                          <Text fontSize="sm" color="fg.muted">
                            {FIGHT_SIDE_LABELS[contributor.side]} ·{' '}
                            {contributor.contributor_type === 'monton' ? 'Monton' : 'VIP'} ·{' '}
                            {formatCurrency(contributor.amount)}
                          </Text>
                        </Box>
                        <form action={deleteAction}>
                          <input type="hidden" name="eventId" value={eventId} />
                          <input type="hidden" name="matchId" value={match.id} />
                          <input type="hidden" name="contributionId" value={contributor.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            colorPalette="red"
                            loading={deletePending}
                          >
                            Remove
                          </Button>
                        </form>
                      </Flex>
                    ))
                  )}
                </Stack>
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
