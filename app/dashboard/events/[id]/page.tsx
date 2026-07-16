import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge, Box, Button, Flex, Stack, Text } from '@chakra-ui/react'

import {
  ButtonGroup,
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

  const user = await getUser()
  const canManage = user ? await hasPermission(user.id, 'events.manage') : false
  const isDerby = event.event_type === 'derby'

  const eligibilityContext = isDerby ? await getEntryFormEligibilityContext(id) : null
  const eligibilityPolicy =
    isDerby && hasEligibilityOptionsConfigured(eligibilityContext)
      ? await getDerbyEligibilityPolicy(id)
      : null
  const associations =
    eligibilityContext &&
    eligibilityContext.enabledFields.includes('association')
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

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <Stack gap={LAYOUT_GAP.page}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={LAYOUT_GAP.buttons}>
          <Flex align="center" gap={2}>
            <Badge>{EVENT_STATUS_LABELS[event.status]}</Badge>
            {event.is_public ? <Badge variant="subtle">Public</Badge> : null}
          </Flex>
          {canManage ? (
            <ButtonGroup>
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/events/${event.id}/edit`}>Edit event</Link>
              </Button>
            </ButtonGroup>
          ) : null}
        </Flex>

        <PanelCard title="Event details">
          <Stack gap={LAYOUT_GAP.form} fontSize="sm">
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
                  className="rich-text-content text-sm"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(event.registration_rules),
                  }}
                />
              </Box>
            ) : null}
          </Stack>
        </PanelCard>

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
            </Stack>
          </PanelCard>
        ) : null}
      </Stack>
    </EventPageLayout>
  )
}
