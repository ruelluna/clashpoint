import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge, Box, Button, Flex, Stack, Text } from '@chakra-ui/react'

import {
  DetailFieldRow,
  LAYOUT_GAP,
  PanelCard,
} from '@/components/dashboard'
import { listAssociations } from '@/features/associations/queries'
import { EligibilityPolicySummaryPanel } from '@/features/eligibility/components/eligibility-policy-summary-panel'
import { getDerbyEligibilityPolicy } from '@/features/eligibility/queries'
import {
  buildEligibilityPolicySummary,
  hasEligibilityOptionsConfigured,
} from '@/features/eligibility/policy-summary'
import { getEntryFormEligibilityContext } from '@/features/eligibility/registration-bridge'
import { getEventWithPrize } from '@/features/events/queries'
import { getEventPrizePoolCollected } from '@/features/events/prize-pool'
import {
  DERBY_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  PRIZE_TYPE_LABELS,
} from '@/features/events/schema'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'
import { RegistrationShareLink } from '@/features/events/components/registration-share-link'
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

  const isDerby = event.event_type === 'derby'
  const prizePoolCollected = isDerby ? await getEventPrizePoolCollected(id) : null

  const user = await getUser()
  const canManage = user ? await hasPermission(user.id, 'events.manage') : false

  const eligibilityContext = isDerby ? await getEntryFormEligibilityContext(id) : null
  const eligibilityPolicy =
    isDerby && hasEligibilityOptionsConfigured(eligibilityContext)
      ? await getDerbyEligibilityPolicy(id)
      : null
  const associations =
    eligibilityPolicy?.approved_association_ids?.length
      ? await listAssociations()
      : []
  const approvedAssociationNames =
    eligibilityPolicy?.approved_association_ids?.length
      ? associations
          .filter((association) =>
            eligibilityPolicy.approved_association_ids.includes(association.id)
          )
          .map((association) => association.name)
      : []
  const eligibilitySummary =
    eligibilityContext && hasEligibilityOptionsConfigured(eligibilityContext)
      ? buildEligibilityPolicySummary(
          eligibilityContext,
          eligibilityPolicy,
          approvedAssociationNames
        )
      : null

  const eventTypeLabel =
    EVENT_TYPE_LABELS[event.event_type] +
    (isDerby && event.derby_type ? ` · ${DERBY_TYPE_LABELS[event.derby_type]}` : '')

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <Stack gap={LAYOUT_GAP.page}>
        <Box borderWidth="1px" borderColor="border" rounded="md" p={4}>
          <Flex
            justify="space-between"
            align={{ base: 'stretch', md: 'start' }}
            gap={4}
            direction={{ base: 'column', md: 'row' }}
          >
            <Stack gap={1} flex="1">
              <Text fontWeight="semibold">{event.name}</Text>
              <Text fontSize="sm" color="fg.muted">
                {event.venue} · {formatDate(event.event_date)} · {eventTypeLabel}
              </Text>
              <Flex gap={2} wrap="wrap">
                <Badge>{EVENT_STATUS_LABELS[event.status]}</Badge>
                {event.is_public ? <Badge variant="subtle">Public</Badge> : null}
              </Flex>
            </Stack>
            {canManage ? (
              <Button
                asChild
                size="md"
                variant="outline"
                alignSelf={{ base: 'stretch', md: 'flex-start' }}
              >
                <Link href={`/dashboard/events/${event.id}/edit`}>Edit event</Link>
              </Button>
            ) : null}
          </Flex>
        </Box>

        <Box borderWidth="1px" borderColor="border" rounded="md" p={4}>
          <Text fontWeight="semibold" mb={4}>
            Event details
          </Text>
          <Stack gap={LAYOUT_GAP.form} fontSize="sm">
            <DetailFieldRow label="Venue">{event.venue}</DetailFieldRow>
            <DetailFieldRow label="Date">{formatDate(event.event_date)}</DetailFieldRow>
            {isDerby ? (
              <DetailFieldRow label="Registration deadline">
                {formatDate(event.registration_deadline)}
              </DetailFieldRow>
            ) : null}
            <DetailFieldRow label="Event type">
              {EVENT_TYPE_LABELS[event.event_type]}
              {isDerby && event.derby_type
                ? ` · ${DERBY_TYPE_LABELS[event.derby_type]}`
                : ''}
            </DetailFieldRow>
            {isDerby ? (
              <DetailFieldRow label="Promoter">
                {event.promoter_name ?? '—'}
              </DetailFieldRow>
            ) : null}
            <DetailFieldRow label="Tax per fight">
              {formatCurrency(event.tax_per_fight)}
            </DetailFieldRow>
            <DetailFieldRow label="Cocks per entry">
              {event.cocks_per_entry}
            </DetailFieldRow>
            {isDerby && prizePoolCollected != null ? (
              <DetailFieldRow label="Prize pool collected">
                <Stack gap={0}>
                  <Text fontWeight="semibold">{formatCurrency(prizePoolCollected)}</Text>
                  <Text color="fg.muted" fontSize="xs">
                    Sum of registration and cock entry fees collected. Updates as payments are
                    recorded.
                  </Text>
                </Stack>
              </DetailFieldRow>
            ) : null}
            {event.notes ? (
              <DetailFieldRow label="Notes">
                <Text whiteSpace="pre-wrap">{event.notes}</Text>
              </DetailFieldRow>
            ) : null}
            {isDerby && event.registration_rules ? (
              <Box>
                <Text color="fg.muted" mb={1}>
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
        </Box>

        {eligibilitySummary ? (
          <EligibilityPolicySummaryPanel
            summary={eligibilitySummary}
            requireRoosterEntryApproval={event.require_rooster_entry_approval}
            classificationMatchingEnabled={event.classification_matching_enabled}
          />
        ) : null}

        {event.is_public ? (
          <PanelCard title="Registration link">
            <RegistrationShareLink eventId={event.id} />
          </PanelCard>
        ) : null}

        {event.prize_structure ? (
          <PanelCard
            title={`Prize structure (${PRIZE_TYPE_LABELS[event.prize_structure.prize_type]})`}
          >
            <Stack gap={LAYOUT_GAP.form}>
              {event.prize_structure.config.map((tier) => (
                <Flex
                  key={tier.place}
                  gap={4}
                  fontSize="sm"
                  direction={{ base: 'column', sm: 'row' }}
                  align={{ sm: 'center' }}
                >
                  <Text fontWeight="medium" flexShrink={0}>
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
            </Stack>
          </PanelCard>
        ) : null}
      </Stack>
    </EventPageLayout>
  )
}
