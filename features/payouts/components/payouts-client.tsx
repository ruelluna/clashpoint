'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  NativeSelect,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useActionState, useState } from 'react'

import {
  recordPayoutAction,
  type PayoutActionState,
} from '@/features/payouts/actions'
import { PAYOUT_METHOD_LABELS } from '@/features/payouts/schema'
import type { PayoutListItem } from '@/features/payouts/types'
import type { PrizePoolBreakdown } from '@/features/prizes/types'

type PayoutsClientProps = {
  eventId: string
  payouts: PayoutListItem[]
  prizePool: PrizePoolBreakdown
  canManage: boolean
}

const initialState: PayoutActionState = {}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function ReleasePayoutForm({
  payout,
  eventId,
}: {
  payout: PayoutListItem
  eventId: string
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(recordPayoutAction, initialState)

  if (payout.isReleased) {
    return (
      <Text fontSize="xs" color="fg.muted">
        {payout.releasedAt
          ? new Date(payout.releasedAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : 'Released'}
      </Text>
    )
  }

  if (!open) {
    return (
      <Button size="xs" variant="outline" onClick={() => setOpen(true)}>
        Release payout
      </Button>
    )
  }

  return (
    <form action={action} className="mt-2">
      <input type="hidden" name="payoutId" value={payout.id} />
      <input type="hidden" name="eventId" value={eventId} />
      <NativeSelect.Root size="sm" mb={2}>
        <NativeSelect.Field name="paymentMethod" defaultValue="cash">
          {Object.entries(PAYOUT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect.Field>
      </NativeSelect.Root>
      <Textarea name="notes" placeholder="Optional notes" rows={2} size="sm" mb={2} />
      <Flex gap={2}>
        <Button size="xs" type="submit" colorPalette="green" loading={pending}>
          Confirm release
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </Flex>
      {state.error ? (
        <Text fontSize="xs" color="red.500" mt={1}>
          {state.error}
        </Text>
      ) : null}
      {state.success ? (
        <Text fontSize="xs" color="green.600" mt={1}>
          {state.success}
        </Text>
      ) : null}
    </form>
  )
}

export function PayoutsClient({
  eventId,
  payouts,
  prizePool,
  canManage,
}: PayoutsClientProps) {
  const totalPending = payouts
    .filter((row) => !row.isReleased)
    .reduce((sum, row) => sum + row.amount, 0)
  const totalReleased = payouts
    .filter((row) => row.isReleased)
    .reduce((sum, row) => sum + row.amount, 0)

  return (
    <Box className="space-y-6">
      <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
        <Text fontWeight="medium">Prize pool</Text>
        <Flex wrap="wrap" gap={4} mt={3} fontSize="sm">
          <Box>
            <Text color="fg.muted">Gross collection</Text>
            <Text fontWeight="medium">{formatCurrency(prizePool.grossCollection)}</Text>
          </Box>
          <Box>
            <Text color="fg.muted">Deductions</Text>
            <Text fontWeight="medium">{formatCurrency(prizePool.totalDeductions)}</Text>
          </Box>
          <Box>
            <Text color="fg.muted">Promoter commission</Text>
            <Text fontWeight="medium">
              {formatCurrency(prizePool.promoterCommission)}
            </Text>
          </Box>
          <Box>
            <Text color="fg.muted">Prize pool</Text>
            <Text fontWeight="semibold">{formatCurrency(prizePool.prizePool)}</Text>
          </Box>
          <Box>
            <Text color="fg.muted">Pending payouts</Text>
            <Text fontWeight="medium">{formatCurrency(totalPending)}</Text>
          </Box>
          <Box>
            <Text color="fg.muted">Released</Text>
            <Text fontWeight="medium">{formatCurrency(totalReleased)}</Text>
          </Box>
        </Flex>
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        <Box p={4} borderBottomWidth="1px" borderColor="border">
          <Text fontWeight="medium">Prize payouts</Text>
        </Box>
        {payouts.length === 0 ? (
          <Box p={4}>
            <Text fontSize="sm" color="fg.muted">
              No payouts yet. Finalize winners to generate prize payout rows.
            </Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Box as="table" width="full" fontSize="sm">
              <Box as="thead" bg="bg.subtle">
                <Box as="tr">
                  {[
                    'Reference',
                    'Rank',
                    'Entry',
                    'Recipient',
                    'Amount',
                    'Status',
                    'Action',
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
                {payouts.map((row) => (
                  <Box as="tr" key={row.id} borderTopWidth="1px" borderColor="border">
                    <Box as="td" px={4} py={3}>
                      {row.payoutReference}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {row.rankLabel}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      <Text fontWeight="medium">{row.entryName}</Text>
                      <Text fontSize="xs" color="fg.muted">
                        #{row.entryNumber}
                      </Text>
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {row.recipientName}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {formatCurrency(row.amount)}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {row.isReleased ? (
                        <Badge colorPalette="green">Released</Badge>
                      ) : (
                        <Badge colorPalette="yellow">Pending</Badge>
                      )}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {canManage ? (
                        <ReleasePayoutForm payout={row} eventId={eventId} />
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
    </Box>
  )
}
