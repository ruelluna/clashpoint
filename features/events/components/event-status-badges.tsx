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
    case 'in_progress':
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
  isActive?: boolean
}

export function EventStatusBadges({
  status,
  isPublic = false,
  isActive = false,
  ...props
}: EventStatusBadgesProps) {
  return (
    <Flex gap={1} wrap="wrap" align="center" {...props}>
      <Badge colorPalette={eventStatusColorPalette(status)} size="sm">
        {EVENT_STATUS_LABELS[status]}
      </Badge>
      {isActive ? (
        <Badge colorPalette="blue" size="sm">
          Active
        </Badge>
      ) : null}
      {isPublic ? (
        <Badge variant="subtle" size="sm">
          Public
        </Badge>
      ) : null}
    </Flex>
  )
}
