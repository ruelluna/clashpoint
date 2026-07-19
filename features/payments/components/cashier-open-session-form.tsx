'use client'

import { Button, Input, Stack, Text, Textarea } from '@chakra-ui/react'
import { useActionState } from 'react'

import { ButtonGroup, FormField, LAYOUT_GAP, PanelCard } from '@/components/dashboard'
import {
  openCashierSessionAction,
  type CashierSessionActionState,
} from '@/features/cashier-sessions/actions'

type CashierOpenSessionFormProps = {
  eventId: string
  defaultOpeningFloat: number
}

const initialState: CashierSessionActionState = {}

export function CashierOpenSessionForm({
  eventId,
  defaultOpeningFloat,
}: CashierOpenSessionFormProps) {
  const [state, action, pending] = useActionState(openCashierSessionAction, initialState)

  return (
    <PanelCard title="Open cashier session">
      <Stack gap={LAYOUT_GAP.form} maxW="xl">
        <Text fontSize="sm" color="fg.muted">
          Record your opening float before collecting payments. You are responsible for all
          transactions during this session.
        </Text>

        <form action={action}>
          <Stack gap={LAYOUT_GAP.form}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="openingFloatDefault" value={defaultOpeningFloat} />

            <FormField
              label="Opening float"
              helpText={`Default for this event: ${defaultOpeningFloat.toLocaleString(undefined, {
                style: 'currency',
                currency: 'PHP',
              })}`}
              required
            >
              <Input
                name="openingFloatAmount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={defaultOpeningFloat}
                required
                data-testid="cashier-opening-float"
              />
            </FormField>

            <FormField
              label="Note if amount differs from default"
              helpText="Required when your opening float is not the event default."
            >
              <Textarea
                name="openingFloatNote"
                rows={2}
                maxLength={500}
                data-testid="cashier-opening-float-note"
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
              <Button type="submit" loading={pending} data-testid="cashier-open-session">
                Start session
              </Button>
            </ButtonGroup>
          </Stack>
        </form>
      </Stack>
    </PanelCard>
  )
}
