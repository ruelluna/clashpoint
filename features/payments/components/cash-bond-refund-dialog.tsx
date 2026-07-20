'use client'

import {
  Button,
  Dialog,
  Portal,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useActionState, useEffect, useState } from 'react'

import { ButtonGroup } from '@/components/dashboard'
import {
  refundSelectedPaymentsAction,
  type PaymentActionState,
} from '@/features/payments/actions'
import type { CashBondRefundEligibility } from '@/features/payments/cash-bond-refund'

type CashBondRefundDialogProps = {
  eventId: string
  cashBondRefund: CashBondRefundEligibility
  canOperate: boolean
  onSuccess?: () => void
}

const initialState: PaymentActionState = {}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export function CashBondRefundDialog({
  eventId,
  cashBondRefund,
  canOperate,
  onSuccess,
}: CashBondRefundDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(refundSelectedPaymentsAction, initialState)

  useEffect(() => {
    if (state.success) {
      setOpen(false)
      onSuccess?.()
    }
  }, [state.success, onSuccess])

  if (!canOperate || !cashBondRefund.paymentId) return null
  if (cashBondRefund.reason === 'Cash bond not yet collected') return null
  if (cashBondRefund.reason === 'Already refunded') return null

  return (
    <Stack gap={2} pt={2}>
      {!cashBondRefund.eligible && cashBondRefund.reason ? (
        <Text fontSize="xs" color="fg.muted">
          {cashBondRefund.reason}
        </Text>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        colorPalette="red"
        alignSelf="flex-start"
        disabled={!cashBondRefund.eligible}
        onClick={() => setOpen(true)}
        data-testid="cashier-refund-cash-bond"
      >
        Refund cash bond
      </Button>

      <Dialog.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="md">
              <form action={action}>
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="paymentIds" value={cashBondRefund.paymentId} />
                <Dialog.Header>
                  <Dialog.Title>Refund cash bond</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap={4}>
                    <Text fontSize="sm">
                      Refund{' '}
                      {formatCurrency(cashBondRefund.refundableAmount ?? 0)} cash bond to the
                      owner.
                    </Text>
                    <Textarea
                      name="reason"
                      placeholder="Reason for refund"
                      rows={3}
                      required
                      minLength={3}
                    />
                    {state.error ? (
                      <Text fontSize="sm" color="red.500">
                        {state.error}
                      </Text>
                    ) : null}
                    {state.success ? (
                      <Text fontSize="sm" color="green.600">
                        {state.success}
                      </Text>
                    ) : null}
                  </Stack>
                </Dialog.Body>
                <Dialog.Footer>
                  <ButtonGroup>
                    <Dialog.ActionTrigger asChild>
                      <Button variant="ghost" type="button">
                        Cancel
                      </Button>
                    </Dialog.ActionTrigger>
                    <Button type="submit" colorPalette="red" loading={pending}>
                      Confirm refund
                    </Button>
                  </ButtonGroup>
                </Dialog.Footer>
              </form>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Stack>
  )
}
