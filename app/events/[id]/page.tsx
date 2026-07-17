import { Badge, Box, Button, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  DERBY_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
} from '@/features/events/schema'
import { PublicEventNav } from '@/features/public/components/public-event-nav'
import { getPublicEvent } from '@/features/public/queries'
import { sanitizeHtml } from '@/lib/sanitize-html'

type PublicEventPageProps = {
  params: Promise<{ id: string }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export default async function PublicEventPage({ params }: PublicEventPageProps) {
  const { id } = await params
  const event = await getPublicEvent(id)

  if (!event) notFound()

  const isDerby = event.event_type === 'derby'

  return (
    <Stack gap={6}>
      <PublicEventNav event={event} />
      {event.registration_open ? (
        <Button asChild alignSelf="flex-start">
          <Link href={`/events/${id}/register`}>Register for this event</Link>
        </Button>
      ) : null}
      <Stack
        gap={4}
        borderWidth="1px"
        borderColor="border"
        rounded="lg"
        p={6}
      >
        <Box>
          <Text fontSize="sm" color="fg.muted">
            Event date
          </Text>
          <Text fontWeight="medium">{formatDate(event.event_date)}</Text>
        </Box>
        <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <Box>
            <Text fontSize="sm" color="fg.muted">
              Event type
            </Text>
            <Text>
              {EVENT_TYPE_LABELS[event.event_type]}
              {isDerby && event.derby_type
                ? ` · ${DERBY_TYPE_LABELS[event.derby_type]}`
                : ''}
            </Text>
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
          <Box>
            <Text fontSize="sm" color="fg.muted">
              Tax per fight
            </Text>
            <Text>{formatCurrency(event.tax_per_fight)}</Text>
          </Box>
        </Box>
        {isDerby && event.promoter_name ? (
          <Box>
            <Text fontSize="sm" color="fg.muted">
              Promoter
            </Text>
            <Text>{event.promoter_name}</Text>
          </Box>
        ) : null}
        {isDerby && event.registration_rules ? (
          <Box>
            <Text fontSize="sm" color="fg.muted" mb={2}>
              Registration rules
            </Text>
            <Box
              className="rich-text-content text-sm"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(event.registration_rules),
              }}
            />
          </Box>
        ) : null}
      </Stack>
    </Stack>
  )
}
