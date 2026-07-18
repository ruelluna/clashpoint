'use client'

import { Box, Button, Flex, Grid, Text } from '@chakra-ui/react'
import Link from 'next/link'

import { PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import { EventStatusBadges } from '@/features/events/components/event-status-badges'
import {
  DERBY_TYPE_LABELS,
  EVENT_TYPE_LABELS,
} from '@/features/events/schema'
import type { EventListItem } from '@/features/events/types'
import { formatEventDateTime } from '@/lib/format/datetime'

type EventsListClientProps = {
  events: EventListItem[]
  canManage: boolean
}

function formatEventType(event: EventListItem) {
  const label = EVENT_TYPE_LABELS[event.event_type]
  if (event.event_type === 'derby' && event.derby_type) {
    return `${label} · ${DERBY_TYPE_LABELS[event.derby_type]}`
  }
  return label
}

function formatVenueLine(event: EventListItem) {
  return `${event.venue}${event.promoter_name ? ` · ${event.promoter_name}` : ''}`
}

function EventListRow({ event }: { event: EventListItem }) {
  const venueLine = formatVenueLine(event)
  const typeLine = formatEventType(event)
  const dateLine = formatEventDateTime(event.event_date)

  return (
    <Box
      px={4}
      py={3}
      borderBottomWidth="1px"
      borderColor="border"
      _hover={{ bg: 'bg.subtle' }}
    >
      <Link href={`/dashboard/events/${event.id}`}>
        <Grid
          w="full"
          templateColumns={{ base: '1fr auto', lg: '2fr 1fr 1fr 1fr' }}
          templateRows={{ base: 'repeat(3, auto)', lg: 'auto' }}
          columnGap={{ base: 4, lg: 2 }}
          rowGap={{ base: 1, lg: 0 }}
          alignItems={{ lg: 'center' }}
        >
          <Box gridColumn={1} gridRow={{ base: 1, lg: 1 }} minW={0}>
            <Text fontWeight={{ base: 'semibold', lg: 'medium' }} truncate>
              {event.name}
            </Text>
            <Text fontSize="sm" color="fg.muted" display={{ base: 'none', lg: 'block' }}>
              {venueLine}
            </Text>
          </Box>

          <Box
            gridColumn={{ base: 2, lg: 4 }}
            gridRow={{ base: 1, lg: 1 }}
            justifySelf={{ base: 'end', lg: 'start' }}
          >
            <EventStatusBadges
              status={event.status}
              isPublic={event.is_public}
              justify={{ base: 'flex-end', lg: 'flex-start' }}
            />
          </Box>

          <Text
            gridColumn={1}
            gridRow={2}
            fontSize="sm"
            color="fg.muted"
            display={{ base: 'block', lg: 'none' }}
            truncate
          >
            {venueLine}
          </Text>

          <Text
            gridColumn={2}
            gridRow={2}
            fontSize="sm"
            color="fg.muted"
            textAlign="right"
            display={{ base: 'block', lg: 'none' }}
          >
            {typeLine}
          </Text>

          <Text
            gridColumn={{ base: 1, lg: 2 }}
            gridRow={{ base: 3, lg: 1 }}
            fontSize="sm"
            display={{ base: 'block', lg: 'none' }}
          >
            {dateLine}
          </Text>

          <Text
            gridColumn={{ lg: 2 }}
            gridRow={{ lg: 1 }}
            fontSize="sm"
            display={{ base: 'none', lg: 'block' }}
          >
            {dateLine}
          </Text>

          <Text
            gridColumn={{ lg: 3 }}
            gridRow={{ lg: 1 }}
            fontSize="sm"
            display={{ base: 'none', lg: 'block' }}
          >
            {typeLine}
          </Text>
        </Grid>
      </Link>
    </Box>
  )
}

export function EventsListClient({ events, canManage }: EventsListClientProps) {
  return (
    <PageStack>
      <PageHeader
        title="Events"
        description="Manage derby events and lifecycle."
        actions={
          canManage ? (
            <Button asChild alignSelf={{ base: 'flex-start', sm: 'auto' }}>
              <Link href="/dashboard/events/new">New event</Link>
            </Button>
          ) : undefined
        }
      />

      <PanelCard flush>
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
          events.map((event) => <EventListRow key={event.id} event={event} />)
        )}
      </PanelCard>
    </PageStack>
  )
}
