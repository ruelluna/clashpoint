import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge, Box, Button, Flex, Text } from '@chakra-ui/react'

import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEventWithPrize } from '@/features/events/queries'
import {
  DERBY_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  PRIZE_TYPE_LABELS,
} from '@/features/events/schema'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'
import { sanitizeHtml } from '@/lib/sanitize-html'

type EventDetailPageProps = {
  params: Promise<{ id: string }>
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatCurrency(amount: number | null) {
  if (amount == null) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  await requirePermission('events.view')
  const { id } = await params
  const event = await getEventWithPrize(id)

  if (!event) notFound()

  const user = await getUser()
  const canManage = user ? await hasPermission(user.id, 'events.manage') : false
  const isDerby = event.event_type === 'derby'

  return (
    <Flex direction="column" gap={8}>
      <EventDetailTabs eventId={event.id} eventName={event.name} />

      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
        <Flex align="center" gap={2}>
          <Badge>{EVENT_STATUS_LABELS[event.status]}</Badge>
          {event.is_public ? <Badge variant="subtle">Public</Badge> : null}
        </Flex>
        {canManage ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/events/${event.id}/edit`}>Edit event</Link>
          </Button>
        ) : null}
      </Flex>

      <Box borderWidth="1px" borderColor="border" rounded="lg" p={6}>
        <Text fontWeight="medium" mb={5}>
          Event details
        </Text>
        <Flex direction="column" gap={4} fontSize="sm">
          <Flex gap={4}>
            <Text color="fg.muted" minW="40">Venue</Text>
            <Text>{event.venue}</Text>
          </Flex>
          <Flex gap={4}>
            <Text color="fg.muted" minW="40">Date</Text>
            <Text>{formatDate(event.event_date)}</Text>
          </Flex>
          {isDerby ? (
            <Flex gap={4}>
              <Text color="fg.muted" minW="40">Registration deadline</Text>
              <Text>{formatDate(event.registration_deadline)}</Text>
            </Flex>
          ) : null}
          <Flex gap={4}>
            <Text color="fg.muted" minW="40">Event type</Text>
            <Text>
              {EVENT_TYPE_LABELS[event.event_type]}
              {isDerby && event.derby_type
                ? ` · ${DERBY_TYPE_LABELS[event.derby_type]}`
                : ''}
            </Text>
          </Flex>
          {isDerby ? (
            <Flex gap={4}>
              <Text color="fg.muted" minW="40">Promoter</Text>
              <Text>{event.promoter_name ?? '—'}</Text>
            </Flex>
          ) : null}
          <Flex gap={4}>
            <Text color="fg.muted" minW="40">Entry fee</Text>
            <Text>{formatCurrency(event.entry_fee)}</Text>
          </Flex>
          <Flex gap={4}>
            <Text color="fg.muted" minW="40">Tax per fight</Text>
            <Text>{formatCurrency(event.tax_per_fight)}</Text>
          </Flex>
          <Flex gap={4}>
            <Text color="fg.muted" minW="40">Cocks per entry</Text>
            <Text>{event.cocks_per_entry}</Text>
          </Flex>
          {event.notes ? (
            <Flex gap={4}>
              <Text color="fg.muted" minW="40">Notes</Text>
              <Text whiteSpace="pre-wrap">{event.notes}</Text>
            </Flex>
          ) : null}
          {isDerby && event.registration_rules ? (
            <Box>
              <Text color="fg.muted" mb={1}>
                Registration rules
              </Text>
              <Box
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(event.registration_rules),
                }}
              />
            </Box>
          ) : null}
        </Flex>
      </Box>

      {event.prize_structure ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={6}>
          <Text fontWeight="medium" mb={5}>
            Prize structure ({PRIZE_TYPE_LABELS[event.prize_structure.prize_type]})
          </Text>
          <Flex direction="column" gap={4}>
            {event.prize_structure.config.map((tier) => (
              <Flex key={tier.place} gap={4} fontSize="sm">
                <Text fontWeight="medium" minW="16">
                  #{tier.place}
                </Text>
                <Text flex="1">{tier.label}</Text>
                <Text color="fg.muted">
                  {tier.value != null
                    ? event.prize_structure?.prize_type === 'percentage'
                      ? `${tier.value}%`
                      : formatCurrency(tier.value)
                    : 'Manual'}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>
      ) : null}
    </Flex>
  )
}
