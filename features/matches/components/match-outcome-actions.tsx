'use client'

import { Button, Dialog, Portal, Stack, Text, Textarea } from '@chakra-ui/react'
import { useActionState, useEffect, useState } from 'react'

import { ButtonGroup, FormField, LAYOUT_GAP } from '@/components/dashboard'
import { recordResultAction, type ResultActionState } from '@/features/results/actions'
import { FIGHT_RESULT_TYPE_LABELS } from '@/features/results/schema'
import type { FightResultType } from '@/features/results/types'

const initialState: ResultActionState = {}

const OUTCOME_BUTTONS: Array<{
  resultType: FightResultType
  label: string
  colorPalette?: string
}> = [
  { resultType: 'meron_win', label: 'Declare Meron winner', colorPalette: 'blue' },
  { resultType: 'wala_win', label: 'Declare Wala winner', colorPalette: 'red' },
  { resultType: 'draw', label: 'Declare Draw' },
  { resultType: 'cancelled', label: 'Declare Cancelled', colorPalette: 'orange' },
]

type MatchOutcomeActionsProps = {
  eventId: string
  matchId: string
  fightNumber: number
  meronEntryName: string
  walaEntryName: string
  canRecordResult: boolean
}

export function MatchOutcomeActions({
  eventId,
  matchId,
  fightNumber,
  meronEntryName,
  walaEntryName,
  canRecordResult,
}: MatchOutcomeActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingResultType, setPendingResultType] = useState<FightResultType | null>(null)
  const [state, action, pending] = useActionState(recordResultAction, initialState)

  useEffect(() => {
    if (state.success) {
      setDialogOpen(false)
      setPendingResultType(null)
    }
  }, [state.success])

  function openConfirmDialog(resultType: FightResultType) {
    setPendingResultType(resultType)
    setDialogOpen(true)
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open && !pending) {
      setPendingResultType(null)
    }
  }

  if (!canRecordResult) return null

  const pendingLabel = pendingResultType
    ? FIGHT_RESULT_TYPE_LABELS[pendingResultType]
    : 'outcome'

  return (
    <>
      <Stack gap={LAYOUT_GAP.form}>
        <Text fontSize="sm" fontWeight="medium">
          Declare outcome
        </Text>
        <ButtonGroup>
          {OUTCOME_BUTTONS.map(({ resultType, label, colorPalette }) => (
            <Button
              key={resultType}
              type="button"
              size="sm"
              variant="outline"
              colorPalette={colorPalette}
              onClick={() => openConfirmDialog(resultType)}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
        <Text fontSize="xs" color="fg.muted">
          Outcomes are submitted for verification on the Results tab.
        </Text>
        {state.error && !dialogOpen ? (
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

      <Dialog.Root open={dialogOpen} onOpenChange={(details) => handleDialogOpenChange(details.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="md">
              {pendingResultType ? (
                <form action={action}>
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="matchId" value={matchId} />
                  <input type="hidden" name="resultType" value={pendingResultType} />
                  <Dialog.Header>
                    <Dialog.Title>Confirm {pendingLabel}</Dialog.Title>
                  </Dialog.Header>
                  <Dialog.Body>
                    <Stack gap={LAYOUT_GAP.form}>
                      <Text fontSize="sm">
                        Record this outcome for Fight #{fightNumber}: {meronEntryName} vs{' '}
                        {walaEntryName}? This will be submitted for verification on the Results
                        tab.
                      </Text>
                      <FormField label="Notes (optional)">
                        <Textarea
                          name="notes"
                          rows={3}
                          size="sm"
                          placeholder="Optional notes"
                        />
                      </FormField>
                      {state.error ? (
                        <Text fontSize="sm" color="red.500">
                          {state.error}
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
                      <Button type="submit" loading={pending}>
                        Confirm outcome
                      </Button>
                    </ButtonGroup>
                  </Dialog.Footer>
                </form>
              ) : null}
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
