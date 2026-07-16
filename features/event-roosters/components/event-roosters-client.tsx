'use client'

import { Badge, Box, Button, Flex, Input, NativeSelect, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'

import { FormField, LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import { formatBandNumberForDisplay } from '@/features/entries/band-display'
import { isBandNumberRequiredForEvent } from '@/features/entries/schema'
import { EventOwnerEntryPicker } from '@/features/entries/components/event-owner-entry-picker'
import { OwnerBarcodeScanRow } from '@/features/entries/components/owner-barcode-scan-row'
import { OwnerRoosterCheckPanel } from '@/features/entries/components/owner-rooster-check-panel'
import { RoosterEntryCoreFields } from '@/features/entries/components/rooster-entry-core-fields'
import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import type { RoosterEntryCatalog } from '@/features/reference-values/catalog'
import { createRoosterAction, type WeighingActionState } from '@/features/weighing/actions'
import type { RegistrationListItem } from '@/features/registrations/types'
import type { WeighingEntrySummary } from '@/features/weighing/types'
import {
  ELIGIBILITY_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
} from '@/lib/derby/enums'
import type { EligibilityStatus, RegistrationWorkflowStatus } from '@/lib/derby/enums'

type EventRoostersClientProps = {
  eventId: string
  eventName: string
  eventType: string
  cocksPerEntry: number
  feeSettings: EventFeeSettings
  registrations: RegistrationListItem[]
  entries: WeighingEntrySummary[]
  eligibilityContext?: EntryFormEligibilityContext | null
  catalog: RoosterEntryCatalog
  highlightId?: string
  initialEntryId?: string
}

import type { EventFeeSettings } from '@/features/events/fee-utils'
import { getRoosterEntryPaymentDisplay } from '@/features/payments/display-utils'

function statusColor(status: RegistrationWorkflowStatus): 'gray' | 'orange' | 'green' | 'red' {
  if (status === 'approved' || status === 'matched' || status === 'completed') return 'green'
  if (status === 'rejected' || status === 'disqualified') return 'red'
  if (status.startsWith('pending')) return 'orange'
  return 'gray'
}

function eligibilityColor(
  status: EligibilityStatus
): 'green' | 'orange' | 'yellow' | 'red' | 'gray' {
  if (status === 'eligible') return 'green'
  if (status === 'ineligible') return 'red'
  if (status === 'pending_review') return 'yellow'
  return 'orange'
}

function AddRoosterForm({
  eventId,
  eventType,
  entries,
  cocksPerEntry,
  registrations,
  catalog,
  eligibilityContext = null,
  initialEntryId = '',
}: {
  eventId: string
  eventType: string
  entries: WeighingEntrySummary[]
  cocksPerEntry: number
  registrations: RegistrationListItem[]
  catalog: RoosterEntryCatalog
  eligibilityContext?: EntryFormEligibilityContext | null
  initialEntryId?: string
}) {
  const bandNumberRequired = isBandNumberRequiredForEvent(eventType, eligibilityContext)
  const [state, action, pending] = useActionState(
    createRoosterAction,
    {} as WeighingActionState
  )
  const [entryId, setEntryId] = useState(initialEntryId)
  const isDerby = eventType === 'derby'
  const selectedEntry = entries.find((entry) => entry.entry_id === entryId) ?? null
  const canSubmit =
    entries.some((entry) => entry.can_add_rooster) &&
    Boolean(entryId) &&
    (selectedEntry?.can_add_rooster ?? false)

  return (
    <PanelCard title="Add rooster">
      <form action={action}>
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="eventType" value={eventType} />
        <Stack gap={LAYOUT_GAP.form} maxW="2xl">
          {isDerby ? (
            <OwnerBarcodeScanRow eventId={eventId} onResolved={setEntryId} />
          ) : null}
          <EventOwnerEntryPicker
            entries={entries}
            cocksPerEntry={cocksPerEntry}
            value={entryId}
            onValueChange={setEntryId}
          />
          <OwnerRoosterCheckPanel
            eventId={eventId}
            entry={selectedEntry}
            cocksPerEntry={cocksPerEntry}
            registrations={registrations}
          />
          <FormField label="Rooster name" required>
            <Input name="entryName" required maxLength={200} />
          </FormField>
          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Band number" required={bandNumberRequired} flex="1">
              <Input name="bandNumber" required={bandNumberRequired} maxLength={50} />
            </FormField>
            <FormField label="Declared weight (g, optional)" flex="1">
              <Input name="weight" type="number" step="1" min="1" />
            </FormField>
          </Flex>
          <FormField label="Handler name">
            <Input name="handlerName" maxLength={200} />
          </FormField>
          <RoosterEntryCoreFields slotKey="" mode="staff" catalog={catalog} required />
          {state.error ? (
            <Text fontSize="sm" color="red.500">
              {state.error}
            </Text>
          ) : null}
          {state.success ? (
            <Text fontSize="sm" color="green.600">
              {state.success}
            </Text>
          ) : null}
          <Button type="submit" loading={pending} disabled={!canSubmit} alignSelf="flex-start">
            Add rooster
          </Button>
        </Stack>
      </form>
    </PanelCard>
  )
}

export function EventRoostersClient({
  eventId,
  eventName,
  eventType,
  cocksPerEntry,
  feeSettings,
  registrations,
  entries,
  catalog,
  eligibilityContext = null,
  highlightId,
  initialEntryId,
}: EventRoostersClientProps) {
  const [statusFilter, setStatusFilter] = useState<'' | RegistrationWorkflowStatus>('')

  const filtered = useMemo(() => {
    return registrations.filter((row) => {
      if (statusFilter && row.registration_status !== statusFilter) return false
      return true
    })
  }, [registrations, statusFilter])

  return (
    <PageStack>
      <PageHeader
        title="Roosters"
        description={`${eventName} · ${registrations.length} cock${registrations.length === 1 ? '' : 's'} registered. Entry fees stay pending until Payments.`}
      />

      <AddRoosterForm
        eventId={eventId}
        eventType={eventType}
        entries={entries}
        cocksPerEntry={cocksPerEntry}
        registrations={registrations}
        catalog={catalog}
        eligibilityContext={eligibilityContext}
        initialEntryId={initialEntryId}
      />

      <Flex align="center" gap={3} maxW="xs">
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
          Status
        </Text>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.currentTarget.value as '' | RegistrationWorkflowStatus)
            }
          >
            <option value="">All statuses</option>
            {(
              Object.entries(REGISTRATION_STATUS_LABELS) as Array<
                [RegistrationWorkflowStatus, string]
              >
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Flex>

      <PanelCard flush>
        <Flex
          px={4}
          py={4}
          borderBottomWidth="1px"
          borderColor="border"
          fontWeight="medium"
          fontSize="sm"
          display={{ base: 'none', lg: 'flex' }}
        >
          <Box flex="0.5">Cock</Box>
          <Box flex="1.2">Owner</Box>
          <Box flex="0.7">Payment</Box>
          <Box flex="0.9">Registration</Box>
          <Box flex="0.8">Eligibility</Box>
          <Box flex="0.8">Inspection</Box>
          <Box flex="0.6" textAlign="right">
            Actions
          </Box>
        </Flex>

        {filtered.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No roosters yet. Register owners first, then add cocks here.</Text>
          </Box>
        ) : (
          filtered.map((registration) => (
            <Box
              key={registration.id}
              id={`rooster-${registration.id}`}
              px={4}
              py={4}
              borderBottomWidth="1px"
              borderColor="border"
              bg={highlightId === registration.id ? 'bg.subtle' : undefined}
            >
              <Flex direction={{ base: 'column', lg: 'row' }} gap={3} align={{ lg: 'center' }}>
                <Box flex="0.5">
                  <Text fontWeight="semibold">#{registration.cock_number}</Text>
                  <Text fontSize="xs" color="fg.muted">
                    {formatBandNumberForDisplay(registration.band_number)}
                  </Text>
                  {registration.breed || registration.color_marking ? (
                    <Text fontSize="xs" color="fg.muted">
                      {[registration.breed, registration.color_marking]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  ) : null}
                </Box>
                <Box flex="1.2">
                  <Text fontWeight="medium">
                    #{registration.entry_number} · {registration.entry_name}
                  </Text>
                </Box>
                <Box flex="0.7">
                  {(() => {
                    const paymentDisplay = getRoosterEntryPaymentDisplay(
                      registration.reg_payment_status,
                      feeSettings
                    )
                    return paymentDisplay ? (
                      <Badge size="sm" colorPalette={paymentDisplay.colorPalette}>
                        {paymentDisplay.label}
                      </Badge>
                    ) : null
                  })()}
                </Box>
                <Box flex="0.9">
                  <Badge colorPalette={statusColor(registration.registration_status)} size="sm">
                    {REGISTRATION_STATUS_LABELS[registration.registration_status]}
                  </Badge>
                </Box>
                <Box flex="0.8">
                  <Badge colorPalette={eligibilityColor(registration.eligibility_status)} size="sm">
                    {ELIGIBILITY_STATUS_LABELS[registration.eligibility_status]}
                  </Badge>
                </Box>
                <Box flex="0.8">
                  <Text fontSize="sm" textTransform="capitalize">
                    {registration.inspection_status.replace(/_/g, ' ')}
                  </Text>
                </Box>
                <Box flex="0.6">
                  <Flex justify={{ base: 'flex-start', lg: 'flex-end' }} gap={2}>
                    {eventType === 'derby' ? (
                      <Button asChild size="xs" variant="outline">
                        <Link href={`/dashboard/events/${eventId}/roosters/${registration.id}/print`}>
                          Print slip
                        </Link>
                      </Button>
                    ) : null}
                  </Flex>
                </Box>
              </Flex>
            </Box>
          ))
        )}
      </PanelCard>
    </PageStack>
  )
}
