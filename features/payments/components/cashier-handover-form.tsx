'use client'

import { Button, Input, NativeSelect, Stack, Text, Textarea } from '@chakra-ui/react'
import { useActionState, useEffect } from 'react'

import { ButtonGroup, FormField, LAYOUT_GAP, PanelCard } from '@/components/dashboard'
import {
  recordAdminHandoverAction,
  type CashierSessionActionState,
} from '@/features/cashier-sessions/actions'
import type { AdminHandoverCandidate } from '@/features/cashier-sessions/types'

type CashierHandoverFormProps = {
  eventId: string
  sessionId: string
  adminCandidates: AdminHandoverCandidate[]
  onCancel: () => void
  onSuccess?: () => void
}

const initialState: CashierSessionActionState = {}

export function CashierHandoverForm({
  eventId,
  sessionId,
  adminCandidates,
  onCancel,
  onSuccess,
}: CashierHandoverFormProps) {
  const [state, action, pending] = useActionState(recordAdminHandoverAction, initialState)

  useEffect(() => {
    if (state.success) onSuccess?.()
  }, [state.success, onSuccess])

  return (
    <PanelCard title="Record admin handover">
      <Stack gap={LAYOUT_GAP.form} maxW="xl">
        <Text fontSize="sm" color="fg.muted">
          When an admin collects cash from your drawer (for example to replenish the revolving
          fund), record it here.
        </Text>

        <form action={action}>
          <Stack gap={LAYOUT_GAP.form}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="sessionId" value={sessionId} />

            <FormField label="Amount" required>
              <Input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                data-testid="cashier-handover-amount"
              />
            </FormField>

            <FormField label="Admin (optional)">
              <NativeSelect.Root>
                <NativeSelect.Field name="adminUserId" defaultValue="">
                  <option value="">Select admin</option>
                  {adminCandidates.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.displayName}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>

            <FormField label="Reason" required>
              <Textarea
                name="description"
                rows={2}
                maxLength={500}
                required
                minLength={3}
                placeholder="Revolving fund replenishment"
                data-testid="cashier-handover-reason"
              />
            </FormField>

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

            <ButtonGroup>
              <Button type="submit" loading={pending} data-testid="cashier-record-handover">
                Record handover
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </ButtonGroup>
          </Stack>
        </form>
      </Stack>
    </PanelCard>
  )
}
