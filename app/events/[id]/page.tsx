import { Badge, Box, Text } from '@chakra-ui/react'
import { notFound } from 'next/navigation'

import {
  DERBY_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
} from '@/features/events/schema'
import { PublicEventNav } from '@/features/public/components/public-event-nav'
import { getPublicEvent } from '@/features/public/queries'

type PublicEventPageProps = {
  params: Promise<{ id: string }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  })
}

export default async function PublicEventPage({ params }: PublicEventPageProps) {
  const { id } = await params
  const event = await getPublicEvent(id)

  if (!event) notFound()

  return (
    <div className="space-y-6">
      <PublicEventNav event={event} />
      <Box borderWidth="1px" borderColor="border" rounded="lg" p={6} className="space-y-4">
        <Box>
          <Text fontSize="sm" color="fg.muted">
            Event date
          </Text>
          <Text fontWeight="medium">{formatDate(event.event_date)}</Text>
        </Box>
        <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <Box>
            <Text fontSize="sm" color="fg.muted">
              Type
            </Text>
            <Text>{EVENT_TYPE_LABELS[event.event_type]}</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="fg.muted">
              Derby format
            </Text>
            <Text>{DERBY_TYPE_LABELS[event.derby_type]}</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="fg.muted">
              Status
            </Text>
            <Badge variant="subtle">{EVENT_STATUS_LABELS[event.status]}</Badge>
          </Box>
          <Box>
            <Text fontSize="sm" color="fg.muted">
              Cocks per entry
            </Text>
            <Text>{event.cocks_per_entry}</Text>
          </Box>
        </Box>
        {event.promoter_name ? (
          <Box>
            <Text fontSize="sm" color="fg.muted">
              Promoter
            </Text>
            <Text>{event.promoter_name}</Text>
          </Box>
        ) : null}
      </Box>
    </div>
  )
}
