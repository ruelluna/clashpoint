'use client'

import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'

import {
  DERBY_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
} from '@/features/events/schema'
import type { EventListItem } from '@/features/events/types'

type EventsListClientProps = {
  events: EventListItem[]
  canManage: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function statusColor(status: EventListItem['status']) {
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

export function EventsListClient({ events, canManage }: EventsListClientProps) {
  return (
    <Box className="space-y-6">
      <Flex justify="space-between" align={{ base: 'stretch', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={3}>
        <Box>
          <Text fontSize="2xl" fontWeight="semibold">
            Events
          </Text>
          <Text color="fg.muted">Manage derby events and lifecycle.</Text>
        </Box>
        {canManage ? (
          <Button asChild alignSelf={{ base: 'flex-start', sm: 'auto' }}>
            <Link href="/dashboard/events/new">New event</Link>
          </Button>
        ) : null}
      </Flex>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        <Flex
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor="border"
          fontWeight="medium"
          fontSize="sm"
          display={{ base: 'none', lg: 'flex' }}
        >
          <Box flex="2">Event</Box>
          <Box flex="1">Date</Box>
          <Box flex="1">Type</Box>
          <Box flex="1">Status</Box>
        </Flex>

        {events.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No events yet.</Text>
            {canManage ? (
              <Button asChild mt={4} size="sm">
                <Link href="/dashboard/events/new">Create your first event</Link>
              </Button>
            ) : null}
          </Box>
        ) : (
          events.map((event) => (
            <Flex
              key={event.id}
              asChild
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor="border"
              direction={{ base: 'column', lg: 'row' }}
              gap={2}
              align={{ lg: 'center' }}
              _hover={{ bg: 'bg.subtle' }}
            >
              <Link href={`/dashboard/events/${event.id}`}>
                <Box flex="2">
                  <Text fontWeight="medium">{event.name}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {event.venue}
                    {event.promoter_name ? ` · ${event.promoter_name}` : ''}
                  </Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">{formatDate(event.event_date)}</Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">
                    {EVENT_TYPE_LABELS[event.event_type]}
                    {event.event_type === 'derby' && event.derby_type
                      ? ` · ${DERBY_TYPE_LABELS[event.derby_type]}`
                      : ''}
                  </Text>
                </Box>
                <Box flex="1">
                  <Badge colorPalette={statusColor(event.status)}>
                    {EVENT_STATUS_LABELS[event.status]}
                  </Badge>
                  {event.is_public ? (
                    <Badge ml={2} variant="subtle">
                      Public
                    </Badge>
                  ) : null}
                </Box>
              </Link>
            </Flex>
          ))
        )}
      </Box>
    </Box>
  )
}
