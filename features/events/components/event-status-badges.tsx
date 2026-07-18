'use client'

import { Badge, Flex, type FlexProps } from '@chakra-ui/react'

import { EVENT_STATUS_LABELS } from '@/features/events/schema'
import type { EventStatus } from '@/features/events/types'

export function eventStatusColorPalette(status: EventStatus) {
  switch (status) {
    case 'draft':
      return 'gray'
    case 'open':
      return 'green'
    case 'ongoing':
      return 'blue'
    case 'completed':
      return 'purple'
    case 'cancelled':
      return 'red'
    case 'archived':
      return 'orange'
    default:
      return 'yellow'
  }
}

type EventStatusBadgesProps = FlexProps & {
  status: EventStatus
  isPublic?: boolean
}

export function EventStatusBadges({
  status,
  isPublic = false,
  ...props
}: EventStatusBadgesProps) {
  return (
    <Flex gap={1} wrap="wrap" align="center" {...props}>
      <Badge colorPalette={eventStatusColorPalette(status)} size="sm">
        {EVENT_STATUS_LABELS[status]}
      </Badge>
      {isPublic ? (
        <Badge variant="subtle" size="sm">
          Public
        </Badge>
      ) : null}
    </Flex>
  )
}
