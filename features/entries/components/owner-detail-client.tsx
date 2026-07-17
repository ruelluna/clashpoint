'use client'

import { Badge, Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import {
  ButtonGroup,
  LAYOUT_GAP,
  PageHeader,
  PageStack,
  PanelCard,
} from '@/components/dashboard'
import {
  ENTRY_SOURCE_LABELS,
  PAYMENT_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
} from '@/features/entries/schema'
import type { EntryRow } from '@/features/entries/types'
import type { EventFeeSettings, EntryFeeSnapshot } from '@/features/events/fee-utils'
import { computeRegistrationAmountDue } from '@/features/events/fee-utils'
import { getOwnerRegistrationPaymentDisplay } from '@/features/payments/display-utils'
import {
  PAYMENT_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/features/payments/schema'
import type { PaymentLedgerItem } from '@/features/payments/types'
import type { RoosterEventRegistrationRow } from '@/features/registrations/types'
import {
  ELIGIBILITY_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS as ROOSTER_REGISTRATION_STATUS_LABELS,
  gramsToKg,
} from '@/lib/derby/enums'
import type { EligibilityStatus, RegistrationWorkflowStatus } from '@/lib/derby/enums'

type OwnerDetailClientProps = {
  eventId: string
  eventName: string
  eventType: string
  cocksPerEntry: number
  entry: EntryRow
  promoterName: string | null
  feeSettings: EventFeeSettings
  registrations: RoosterEventRegistrationRow[]
  payments: PaymentLedgerItem[]
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Flex
      justify="space-between"
      direction={{ base: 'column', sm: 'row' }}
      gap={2}
      fontSize="sm"
    >
      <Text color="fg.muted" flexShrink={0}>
        {label}
      </Text>
      <Box textAlign={{ base: 'left', sm: 'right' }}>{children}</Box>
    </Flex>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function OwnerDetailClient({
  eventId,
  eventName,
  eventType,
  cocksPerEntry,
  entry,
  promoterName,
  feeSettings,
  registrations,
  payments,
}: OwnerDetailClientProps) {
  const entryFeeSettings =
    entry.fee_snapshot != null
      ? (entry.fee_snapshot as unknown as EntryFeeSnapshot)
      : feeSettings
  const paymentDisplay = getOwnerRegistrationPaymentDisplay(
    entry.payment_status,
    entryFeeSettings
  )
  const registrationDue = computeRegistrationAmountDue(entryFeeSettings)
  const entryPayments = payments.filter((payment) => payment.entryId === entry.id)
  const roosterSlotsUsed = registrations.length

  return (
    <PageStack>
      <PageHeader
        title={`#${entry.entry_number} ${entry.owner_name}`}
        description={`${eventName} · ${roosterSlotsUsed} of ${cocksPerEntry} cock slot(s) used`}
        actions={
          <ButtonGroup>
            {entry.owner_barcode ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/events/${eventId}/owners/${entry.id}/print`}>
                  Print OWNER slip
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/events/${eventId}/roosters`}>Add rooster</Link>
            </Button>
          </ButtonGroup>
        }
      />

      <Flex direction={{ base: 'column', lg: 'row' }} gap={LAYOUT_GAP.section}>
        <Box flex="1">
          <PanelCard title="Owner details">
            <Stack gap={3}>
              <DetailRow label="Owner / game farm">
                <Text fontWeight="medium">{entry.owner_name}</Text>
              </DetailRow>
              {entry.contact_full_name ? (
                <DetailRow label="Full name">
                  <Text>{entry.contact_full_name}</Text>
                </DetailRow>
              ) : null}
              {entry.contact_designation ? (
                <DetailRow label="Designation">
                  <Text>{entry.contact_designation}</Text>
                </DetailRow>
              ) : null}
              {entry.contact_number ? (
                <DetailRow label="Phone">
                  <Text>{entry.contact_number}</Text>
                </DetailRow>
              ) : null}
              {entry.email ? (
                <DetailRow label="Email">
                  <Text>{entry.email}</Text>
                </DetailRow>
              ) : null}
              <DetailRow label="Entry source">
                <Text>{ENTRY_SOURCE_LABELS[entry.entry_source]}</Text>
              </DetailRow>
              <DetailRow label="Registration status">
                <Badge variant="subtle">
                  {REGISTRATION_STATUS_LABELS[entry.registration_status]}
                </Badge>
              </DetailRow>
              {promoterName ? (
                <DetailRow label="Referred by">
                  <Text>{promoterName}</Text>
                </DetailRow>
              ) : null}
              {entry.owner_barcode ? (
                <DetailRow label="Owner barcode">
                  <Text fontFamily="mono" fontSize="xs">
                    {entry.owner_barcode}
                  </Text>
                </DetailRow>
              ) : null}
              <DetailRow label="Registered">
                <Text>{formatDateTime(entry.created_at)}</Text>
              </DetailRow>
              {entry.competitor_id ? (
                <Button asChild size="sm" variant="outline" alignSelf="flex-start">
                  <Link href={`/dashboard/owners/${entry.competitor_id}`}>
                    View saved owner profile
                  </Link>
                </Button>
              ) : null}
            </Stack>
          </PanelCard>
        </Box>

        <Box flex="1">
          <Stack gap={LAYOUT_GAP.section}>
            {entryFeeSettings.registrationFeeEnabled ? (
              <PanelCard title="Registration fee">
                <Stack gap={3}>
                  <DetailRow label="Amount due">
                    <Text>{formatCurrency(registrationDue)}</Text>
                  </DetailRow>
                  <DetailRow label="Payment status">
                    {paymentDisplay ? (
                      <Badge colorPalette={paymentDisplay.colorPalette}>
                        {paymentDisplay.label}
                      </Badge>
                    ) : (
                      <Text>{PAYMENT_STATUS_LABELS[entry.payment_status]}</Text>
                    )}
                  </DetailRow>
                  <Button asChild size="sm" variant="outline" alignSelf="flex-start">
                    <Link href={`/dashboard/events/${eventId}/payments`}>Record payment</Link>
                  </Button>
                </Stack>
              </PanelCard>
            ) : (
              <PanelCard title="Registration fee">
                <Text fontSize="sm" color="fg.muted">
                  Registration fee is not enabled for this event.
                </Text>
              </PanelCard>
            )}

            {entry.notes ? (
              <PanelCard title="Notes">
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {entry.notes}
                </Text>
              </PanelCard>
            ) : null}
          </Stack>
        </Box>
      </Flex>

      <PanelCard title="Registered roosters">
        {registrations.length === 0 ? (
          <Stack gap={3}>
            <Text fontSize="sm" color="fg.muted">
              No roosters registered for this owner yet.
            </Text>
            <Button asChild size="sm" variant="outline" alignSelf="flex-start">
              <Link href={`/dashboard/events/${eventId}/roosters`}>Go to Roosters</Link>
            </Button>
          </Stack>
        ) : (
          <Stack gap={2}>
            {registrations.map((registration) => (
              <Flex
                key={registration.id}
                justify="space-between"
                align={{ base: 'flex-start', md: 'center' }}
                direction={{ base: 'column', md: 'row' }}
                gap={2}
                borderWidth="1px"
                borderColor="border"
                rounded="md"
                p={3}
                fontSize="sm"
              >
                <Box>
                  <Text fontWeight="semibold">Cock #{registration.cock_number}</Text>
                  <Text color="fg.muted">Band {registration.band_number}</Text>
                  {registration.handler_name ? (
                    <Text color="fg.muted">Handler: {registration.handler_name}</Text>
                  ) : null}
                  {registration.official_weight_grams != null ? (
                    <Text color="fg.muted">
                      Weight {gramsToKg(registration.official_weight_grams)} kg
                    </Text>
                  ) : null}
                </Box>
                <Flex gap={2} wrap="wrap" justify={{ base: 'flex-start', md: 'flex-end' }}>
                  <Badge variant="subtle" size="sm">
                    {
                      ROOSTER_REGISTRATION_STATUS_LABELS[
                        registration.registration_status as RegistrationWorkflowStatus
                      ]
                    }
                  </Badge>
                  <Badge variant="subtle" size="sm">
                    {ELIGIBILITY_STATUS_LABELS[registration.eligibility_status as EligibilityStatus]}
                  </Badge>
                </Flex>
                <ButtonGroup>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/events/${eventId}/roosters?highlight=${registration.id}`}>
                      View on Roosters
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/dashboard/events/${eventId}/roosters/${registration.id}/print`}
                    >
                      Print slip
                    </Link>
                  </Button>
                </ButtonGroup>
              </Flex>
            ))}
          </Stack>
        )}
      </PanelCard>

      <PanelCard title="Payment history">
        {entryPayments.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No payments recorded for this owner yet.
          </Text>
        ) : (
          <Stack gap={2}>
            {entryPayments.map((payment) => (
              <Flex
                key={payment.id}
                justify="space-between"
                align={{ base: 'flex-start', md: 'center' }}
                direction={{ base: 'column', md: 'row' }}
                gap={2}
                borderWidth="1px"
                borderColor="border"
                rounded="md"
                p={3}
                fontSize="sm"
              >
                <Box>
                  <Text fontWeight="medium">{payment.paymentReference}</Text>
                  <Text color="fg.muted">
                    {PAYMENT_CATEGORY_LABELS[payment.paymentCategory]}
                    {payment.paymentMethod
                      ? ` · ${PAYMENT_METHOD_LABELS[payment.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? payment.paymentMethod}`
                      : ''}
                  </Text>
                  {payment.paidAt ? (
                    <Text color="fg.muted">{formatDateTime(payment.paidAt)}</Text>
                  ) : null}
                </Box>
                <Flex gap={3} align="center">
                  <Text fontWeight="medium">{formatCurrency(payment.amountPaid)}</Text>
                  <Badge colorPalette={payment.paymentStatus === 'paid' ? 'green' : 'orange'}>
                    {PAYMENT_STATUS_LABELS[payment.paymentStatus]}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/events/${eventId}/payments/${payment.id}/print`}>
                      Receipt
                    </Link>
                  </Button>
                </Flex>
              </Flex>
            ))}
          </Stack>
        )}
      </PanelCard>

      <ButtonGroup>
        <Button asChild variant="outline">
          <Link href={`/dashboard/events/${eventId}/owners`}>Back to owners</Link>
        </Button>
      </ButtonGroup>
    </PageStack>
  )
}
