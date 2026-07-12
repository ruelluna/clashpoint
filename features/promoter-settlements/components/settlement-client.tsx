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

import { ButtonGroup, LAYOUT_GAP, PageStack, PanelCard } from '@/components/dashboard'
import {
  computeSettlementAction,
  markSettledAction,
  type SettlementActionState,
} from '@/features/promoter-settlements/actions'
import { SETTLEMENT_STATUS_LABELS } from '@/features/promoter-settlements/schema'
import type { SettlementRow } from '@/features/promoter-settlements/types'

type SettlementClientProps = {
  eventId: string
  settlement: SettlementRow | null
  promoterName: string | null
  canManage: boolean
}

const initialState: SettlementActionState = {}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function statusColor(
  status: SettlementRow['settlementStatus']
): 'gray' | 'yellow' | 'green' | 'red' | 'orange' {
  switch (status) {
    case 'pending':
      return 'gray'
    case 'for_review':
      return 'yellow'
    case 'settled':
      return 'green'
    case 'disputed':
      return 'red'
    case 'cancelled':
      return 'orange'
    default:
      return 'gray'
  }
}

export function SettlementClient({
  eventId,
  settlement,
  promoterName,
  canManage,
}: SettlementClientProps) {
  const [computeState, computeAction, computePending] = useActionState(
    computeSettlementAction,
    initialState
  )
  const [settleState, settleAction, settlePending] = useActionState(
    markSettledAction,
    initialState
  )

  return (
    <PageStack>
      <PanelCard title="Promoter">
        <Text fontSize="sm">{promoterName ?? 'No promoter assigned'}</Text>
      </PanelCard>

      {!settlement ? (
        <PanelCard>
          <Text fontSize="sm" color="fg.muted" mb={3}>
            Compute settlement from entry fees, deductions, prize pool, and promoter
            commission.
          </Text>
          {canManage ? (
            <form action={computeAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <Button type="submit" loading={computePending}>
                Compute settlement
              </Button>
              {computeState.error ? (
                <Text fontSize="sm" color="red.500" mt={2}>
                  {computeState.error}
                </Text>
              ) : null}
              {computeState.success ? (
                <Text fontSize="sm" color="green.600" mt={2}>
                  {computeState.success}
                </Text>
              ) : null}
            </form>
          ) : null}
        </PanelCard>
      ) : (
        <>
          <PanelCard>
            <Flex align="center" gap={2} mb={3}>
              <Text fontWeight="medium">{settlement.settlementReference}</Text>
              <Badge colorPalette={statusColor(settlement.settlementStatus)}>
                {SETTLEMENT_STATUS_LABELS[settlement.settlementStatus]}
              </Badge>
            </Flex>
            <Flex wrap="wrap" gap={4} fontSize="sm">
              {[
                ['Gross collection', settlement.grossCollection],
                ['Eligible collection', settlement.eligibleCollection],
                ['Total expenses', settlement.totalExpenses],
                ['Prize pool', settlement.prizePool],
                ['Promoter commission', settlement.promoterCommission],
                ['Guaranteed prize', settlement.guaranteedPrize],
                ['Amount payable to promoter', settlement.amountPayable],
                ['Amount receivable from promoter', settlement.amountReceivable],
              ].map(([label, value]) => (
                <Box key={label as string}>
                  <Text color="fg.muted">{label as string}</Text>
                  <Text fontWeight="medium">{formatCurrency(value as number)}</Text>
                </Box>
              ))}
            </Flex>
          </PanelCard>

          {canManage && settlement.settlementStatus !== 'settled' ? (
            <PanelCard>
              <ButtonGroup wrap="wrap">
                <form action={computeAction}>
                  <input type="hidden" name="eventId" value={eventId} />
                  <Button type="submit" variant="outline" loading={computePending}>
                    Recompute
                  </Button>
                </form>
                <form action={settleAction} style={{ flex: 1, minWidth: '240px' }}>
                  <input type="hidden" name="settlementId" value={settlement.id} />
                  <input type="hidden" name="eventId" value={eventId} />
                  <Stack gap={LAYOUT_GAP.form}>
                    <Textarea
                      name="notes"
                      placeholder="Settlement notes (optional)"
                      rows={2}
                    />
                    <Button type="submit" colorPalette="green" loading={settlePending} alignSelf="flex-start">
                      Mark as settled
                    </Button>
                  </Stack>
                </form>
              </ButtonGroup>
              {computeState.error || settleState.error ? (
                <Text fontSize="sm" color="red.500" mt={2}>
                  {computeState.error ?? settleState.error}
                </Text>
              ) : null}
              {computeState.success || settleState.success ? (
                <Text fontSize="sm" color="green.600" mt={2}>
                  {computeState.success ?? settleState.success}
                </Text>
              ) : null}
            </PanelCard>
          ) : null}

          {settlement.settledAt ? (
            <Text fontSize="sm" color="fg.muted">
              Settled {new Date(settlement.settledAt).toLocaleString()}
            </Text>
          ) : null}
        </>
      )}
    </PageStack>
  )
}
