'use client'

import { Button, Dialog, Portal, Stack, Text, Textarea } from '@chakra-ui/react'
import { useActionState, useEffect, useState } from 'react'

import { ButtonGroup, FormField, LAYOUT_GAP } from '@/components/dashboard'
import {
  rejectInspectionAction,
  recordInspectionAction,
  type InspectionActionState,
} from '@/features/inspection/actions'

type InspectionRejectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  registrationId: string
  inspectionId: string | null
  isForReview: boolean
  onSuccess: () => void
}

const initialState: InspectionActionState = {}

export function InspectionRejectDialog({
  open,
  onOpenChange,
  eventId,
  registrationId,
  inspectionId,
  isForReview,
  onSuccess,
}: InspectionRejectDialogProps) {
  const [reason, setReason] = useState('')
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectInspectionAction,
    initialState
  )
  const [recordState, recordAction, recordPending] = useActionState(
    recordInspectionAction,
    initialState
  )

  const pending = rejectPending || recordPending
  const state = isForReview ? rejectState : recordState

  useEffect(() => {
    if (state.success && state.inspectionClosed) {
      setReason('')
      onOpenChange(false)
      onSuccess()
    }
  }, [state.success, state.inspectionClosed, onOpenChange, onSuccess])

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) setReason('')
  }

  return (
    <Dialog.Root open={open} onOpenChange={(details) => handleOpenChange(details.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="md">
            {isForReview && inspectionId ? (
              <form action={rejectAction}>
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="inspectionId" value={inspectionId} />
                <Dialog.Header>
                  <Dialog.Title>Reject inspection</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap={LAYOUT_GAP.form}>
                    <FormField label="Rejection reason" required>
                      <Textarea
                        name="notes"
                        rows={3}
                        minLength={3}
                        maxLength={2000}
                        required
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Reason this cock failed inspection"
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
                      <Button variant="outline" type="button" size="md">
                        Cancel
                      </Button>
                    </Dialog.ActionTrigger>
                    <Button
                      type="submit"
                      colorPalette="red"
                      size="md"
                      loading={pending}
                      disabled={reason.trim().length < 3}
                    >
                      Confirm
                    </Button>
                  </ButtonGroup>
                </Dialog.Footer>
              </form>
            ) : (
              <form action={recordAction}>
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="registrationId" value={registrationId} />
                <input type="hidden" name="inspectionStatus" value="failed" />
                <Dialog.Header>
                  <Dialog.Title>Reject inspection</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Stack gap={LAYOUT_GAP.form}>
                    <FormField label="Rejection reason" required>
                      <Textarea
                        name="notes"
                        rows={3}
                        minLength={3}
                        maxLength={2000}
                        required
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Reason this cock failed inspection"
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
                      <Button variant="outline" type="button" size="md">
                        Cancel
                      </Button>
                    </Dialog.ActionTrigger>
                    <Button
                      type="submit"
                      colorPalette="red"
                      size="md"
                      loading={pending}
                      disabled={reason.trim().length < 3}
                    >
                      Confirm
                    </Button>
                  </ButtonGroup>
                </Dialog.Footer>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
