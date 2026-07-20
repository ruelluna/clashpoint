'use client'

import { Button, Stack, Text, Textarea } from '@chakra-ui/react'
import { useActionState } from 'react'

import { ButtonGroup, FormField, LAYOUT_GAP } from '@/components/dashboard'
import { recordResultAction, type ResultActionState } from '@/features/results/actions'

const initialState: ResultActionState = {}

type MatchOutcomeActionsProps = {
  eventId: string
  matchId: string
  canRecordResult: boolean
}

export function MatchOutcomeActions({
  eventId,
  matchId,
  canRecordResult,
}: MatchOutcomeActionsProps) {
  const [state, action, pending] = useActionState(recordResultAction, initialState)

  if (!canRecordResult) return null

  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="matchId" value={matchId} />
      <Stack gap={LAYOUT_GAP.form}>
        <Text fontSize="sm" fontWeight="medium">
          Declare outcome
        </Text>
        <FormField label="Notes (optional)">
          <Textarea name="notes" rows={2} size="sm" placeholder="Optional notes" />
        </FormField>
        <ButtonGroup>
          <Button
            type="submit"
            name="resultType"
            value="meron_win"
            size="sm"
            variant="outline"
            colorPalette="blue"
            loading={pending}
          >
            Declare Meron winner
          </Button>
          <Button
            type="submit"
            name="resultType"
            value="wala_win"
            size="sm"
            variant="outline"
            colorPalette="red"
            loading={pending}
          >
            Declare Wala winner
          </Button>
          <Button
            type="submit"
            name="resultType"
            value="draw"
            size="sm"
            variant="outline"
            loading={pending}
          >
            Declare Draw
          </Button>
          <Button
            type="submit"
            name="resultType"
            value="cancelled"
            size="sm"
            variant="outline"
            colorPalette="orange"
            loading={pending}
          >
            Declare Cancelled
          </Button>
        </ButtonGroup>
        <Text fontSize="xs" color="fg.muted">
          Outcomes are submitted for verification on the Results tab.
        </Text>
        {state.error ? (
          <Text fontSize="xs" color="red.500">
            {state.error}
          </Text>
        ) : null}
        {state.success ? (
          <Text fontSize="xs" color="green.600">
            {state.success}
          </Text>
        ) : null}
      </Stack>
    </form>
  )
}
