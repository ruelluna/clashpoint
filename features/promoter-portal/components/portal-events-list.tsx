'use client'

import { Badge, Box, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'

import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from '@/features/events/schema'
import type { PromoterAssignedEvent } from '@/features/promoter-portal/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function PortalEventsList({ events }: { events: PromoterAssignedEvent[] }) {
  return (
    <Box className="space-y-6">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          Assigned events
        </Text>
        <Text color="fg.muted">
          Events linked to your promoter profile and referral activity.
        </Text>
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        {events.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No assigned events yet.</Text>
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
              <Link href={`/portal/events/${event.id}`}>
                <Box flex="2">
                  <Text fontWeight="medium">{event.name}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {event.venue}
                  </Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">{formatDate(event.event_date)}</Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">{EVENT_TYPE_LABELS[event.event_type]}</Text>
                </Box>
                <Box flex="1">
                  <Badge variant="subtle">{EVENT_STATUS_LABELS[event.status]}</Badge>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">{event.referred_entries_count} referred</Text>
                </Box>
              </Link>
            </Flex>
          ))
        )}
      </Box>
    </Box>
  )
}
