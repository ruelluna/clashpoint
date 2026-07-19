'use client'

import { Button, Stack, Text } from '@chakra-ui/react'
import { useActionState } from 'react'

import { ButtonGroup, LAYOUT_GAP, PanelCard } from '@/components/dashboard'
import {
  clearEventActiveAction,
  setEventActiveAction,
  type ActionState,
} from '@/features/events/actions'
import { canActivateEvent } from '@/features/events/utils'
import type { EventStatus } from '@/features/events/types'

const initialState: ActionState = {}

type EventActiveControlsProps = {
  eventId: string
  eventName: string
  status: EventStatus
  isActive: boolean
  blockingActiveEvent?: { id: string; name: string } | null
  compact?: boolean
}

export function EventActiveControls({
  eventId,
  eventName,
  status,
  isActive,
  blockingActiveEvent = null,
  compact = false,
}: EventActiveControlsProps) {
  const [setState, setAction, setPending] = useActionState(
    setEventActiveAction,
    initialState
  )
  const [clearState, clearAction, clearPending] = useActionState(
    clearEventActiveAction,
    initialState
  )

  const canActivate = canActivateEvent(status)
  const blockedByOther =
    !isActive &&
    blockingActiveEvent != null &&
    blockingActiveEvent.id !== eventId
  const error = setState.error ?? clearState.error
  const success = setState.success ?? clearState.success

  const controls = (
    <Stack gap={LAYOUT_GAP.form}>
      {isActive ? (
        <Text fontSize="sm" color="fg.muted">
          This is the active event for staff operations. It appears first in the
          sidebar.
        </Text>
      ) : blockedByOther ? (
        <Text fontSize="sm" color="fg.muted">
          Another event is already active ({blockingActiveEvent.name}). Finish or
          clear that event before activating {eventName}.
        </Text>
      ) : !canActivate ? (
        <Text fontSize="sm" color="fg.muted">
          Archived events cannot be set as the active event.
        </Text>
      ) : (
        <Text fontSize="sm" color="fg.muted">
          Set this event as the active focus for staff operations. Only one event
          can be active at a time.
        </Text>
      )}

      <ButtonGroup>
        {isActive ? (
          <form action={clearAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <Button
              type="submit"
              size="md"
              variant="outline"
              loading={clearPending}
            >
              Clear active
            </Button>
          </form>
        ) : (
          <form action={setAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <Button
              type="submit"
              size="md"
              loading={setPending}
              disabled={!canActivate || blockedByOther}
            >
              Set as active event
            </Button>
          </form>
        )}
      </ButtonGroup>

      {error ? (
        <Text color="fg.error" fontSize="sm">
          {error}
        </Text>
      ) : null}
      {success ? (
        <Text color="fg.success" fontSize="sm">
          {success}
        </Text>
      ) : null}
    </Stack>
  )

  if (compact) return controls

  return <PanelCard title="Active event">{controls}</PanelCard>
}
