'use client'

import { Button, Input, Stack, Text, Textarea } from '@chakra-ui/react'
import { useActionState, useEffect } from 'react'

import { ButtonGroup, FormField, LAYOUT_GAP, PanelCard } from '@/components/dashboard'
import {
  closeCashierSessionAction,
  type CashierSessionActionState,
} from '@/features/cashier-sessions/actions'

type CashierCloseSessionFormProps = {
  eventId: string
  sessionId: string
  onCancel: () => void
  onSuccess?: () => void
}

const initialState: CashierSessionActionState = {}

export function CashierCloseSessionForm({
  eventId,
  sessionId,
  onCancel,
  onSuccess,
}: CashierCloseSessionFormProps) {
  const [state, action, pending] = useActionState(closeCashierSessionAction, initialState)

  useEffect(() => {
    if (state.success) onSuccess?.()
  }, [state.success, onSuccess])

  return (
    <PanelCard title="End session">
      <form action={action}>
        <Stack gap={LAYOUT_GAP.form} maxW="xl">
          <Text fontSize="sm" color="fg.muted">
            Close your cashier access when you leave the terminal. You can open a new session
            later if needed.
          </Text>

          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="sessionId" value={sessionId} />

          <FormField label="Counted cash in drawer (optional)">
            <Input
              name="closingCountedCash"
              type="number"
              min={0}
              step="0.01"
              data-testid="cashier-closing-counted-cash"
            />
          </FormField>

          <FormField label="Closing notes (optional)">
            <Textarea name="closingNotes" rows={2} maxLength={500} />
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
            <Button
              type="submit"
              variant="outline"
              colorPalette="red"
              loading={pending}
              data-testid="cashier-end-session"
            >
              End access
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </ButtonGroup>
        </Stack>
      </form>
    </PanelCard>
  )
}
