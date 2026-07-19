import { Badge, Box, Stack, Text } from '@chakra-ui/react'
import { notFound } from 'next/navigation'

import { getEntryFormEligibilityContext } from '@/features/eligibility/registration-bridge'
import {
  DERBY_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
} from '@/features/events/schema'
import { getRegistrationClosedReason } from '@/features/events/utils'
import { PublicRegistrationWizard } from '@/features/public/components/public-registration-wizard'
import { PublicEventNav } from '@/features/public/components/public-event-nav'
import { getPublicRegistrationEntryContext } from '@/features/public/owner-registration-service'
import { getPublicRegistrationEvent } from '@/features/public/queries'
import {
  getPublicReferenceOptions,
  getRoosterEntryCatalog,
} from '@/features/reference-values/catalog'
import { sanitizeHtml } from '@/lib/sanitize-html'

type PublicRegisterPageProps = {
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

export default async function PublicRegisterPage({ params }: PublicRegisterPageProps) {
  const { id } = await params
  const event = await getPublicRegistrationEvent(id)

  if (!event) notFound()

  const eligibilityContext = await getEntryFormEligibilityContext(id, {
    useAdminClient: true,
  })

  const [catalog, publicReferenceOptions, sessionContext] = await Promise.all([
    getRoosterEntryCatalog(),
    getPublicReferenceOptions(),
    event.registration_open
      ? getPublicRegistrationEntryContext(id)
      : Promise.resolve(null),
  ])

  const navEvent = {
    id: event.id,
    name: event.name,
    venue: event.venue,
    event_date: event.event_date,
    event_type: event.event_type,
    derby_type: event.derby_type,
    status: event.status,
    cocks_per_entry: event.cocks_per_entry,
    tax_per_fight: event.tax_per_fight,
    registration_rules: event.registration_rules,
    promoter_name: event.promoter_name,
    publish_matches: false,
    publish_standings: false,
    publish_winners: false,
    publish_prize_amounts: false,
    registration_open: event.registration_open,
  }

  return (
    <Stack gap={6}>
      <PublicEventNav event={navEvent} />

      {!event.registration_open ? (
        <Stack
          gap={4}
          borderWidth="1px"
          borderColor="border"
          rounded="lg"
          p={6}
          maxW="2xl"
        >
          <Text fontSize="lg" fontWeight="semibold">
            Registration closed
          </Text>
          <Text color="fg.muted">{getRegistrationClosedReason(event)}</Text>
          <Box>
            <Text fontSize="sm" color="fg.muted">
              Event date
            </Text>
            <Text fontWeight="medium">{formatDate(event.event_date)}</Text>
          </Box>
          {event.registration_deadline ? (
            <Box>
              <Text fontSize="sm" color="fg.muted">
                Registration deadline
              </Text>
              <Text>{formatDate(event.registration_deadline)}</Text>
            </Box>
          ) : null}
          <Box display="flex" alignItems="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              Status
            </Text>
            <Badge variant="subtle">{EVENT_STATUS_LABELS[event.status]}</Badge>
          </Box>
          {event.registration_rules ? (
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
      ) : (
        <Stack gap={6}>
          <Stack
            gap={3}
            borderWidth="1px"
            borderColor="border"
            rounded="lg"
            p={6}
            fontSize="sm"
          >
            <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              <Box>
                <Text color="fg.muted">Event type</Text>
                <Text>
                  {EVENT_TYPE_LABELS[event.event_type]}
                  {event.derby_type
                    ? ` · ${DERBY_TYPE_LABELS[event.derby_type]}`
                    : ''}
                </Text>
              </Box>
              <Box>
                <Text color="fg.muted">Entry fee</Text>
                <Text>{formatCurrency(event.entry_fee)}</Text>
              </Box>
              <Box>
                <Text color="fg.muted">Cocks per entry</Text>
                <Text>{event.cocks_per_entry}</Text>
              </Box>
              {event.registration_deadline ? (
                <Box>
                  <Text color="fg.muted">Registration deadline</Text>
                  <Text>{formatDate(event.registration_deadline)}</Text>
                </Box>
              ) : null}
            </Box>
            {event.registration_rules ? (
              <Box>
                <Text color="fg.muted" mb={2}>
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
            <Text color="fg.muted" fontSize="xs">
              One registration per game farm. Existing farms must verify by email before adding
              roosters.
            </Text>
          </Stack>

          <PublicRegistrationWizard
            eventId={event.id}
            eventName={event.name}
            eventType={event.event_type}
            cocksPerEntry={event.cocks_per_entry}
            entryFee={event.entry_fee}
            minWeightGrams={event.min_weight_grams}
            maxWeightGrams={event.max_weight_grams}
            catalog={catalog}
            publicReferenceOptions={publicReferenceOptions}
            eligibilityContext={eligibilityContext}
            sessionContext={sessionContext}
          />
        </Stack>
      )}
    </Stack>
  )
}
