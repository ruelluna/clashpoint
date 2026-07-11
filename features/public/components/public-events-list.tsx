'use client'

import { Badge, Box, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'

import {
  DERBY_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
} from '@/features/events/schema'
import type { PublicEventListItem } from '@/features/public/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function statusColor(status: PublicEventListItem['status']) {
  switch (status) {
    case 'open':
      return 'green'
    case 'ongoing':
      return 'blue'
    case 'completed':
      return 'purple'
    case 'cancelled':
      return 'red'
    default:
      return 'gray'
  }
}

export function PublicEventsList({ events }: { events: PublicEventListItem[] }) {
  return (
    <Box className="space-y-6">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          Public events
        </Text>
        <Text color="fg.muted">
          Browse published derby events, match cards, standings, and winners.
        </Text>
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        {events.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No public events are published yet.</Text>
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
              direction={{ base: 'column', md: 'row' }}
              gap={2}
              align={{ md: 'center' }}
              _hover={{ bg: 'bg.subtle' }}
            >
              <Link href={`/events/${event.id}`}>
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
                </Box>
              </Link>
            </Flex>
          ))
        )}
      </Box>
    </Box>
  )
}
