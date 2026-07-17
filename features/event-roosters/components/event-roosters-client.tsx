'use client'

import { Badge, Box, Button, Collapsible, Flex, Input, NativeSelect, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState, useEffect, useMemo, useRef, useState } from 'react'

import { FormField, LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import type { EventFeeSettings } from '@/features/events/fee-utils'
import { formatBandNumberForDisplay } from '@/features/entries/band-display'
import { isBandNumberRequiredForEvent } from '@/features/entries/schema'
import { EventOwnerEntryPicker } from '@/features/entries/components/event-owner-entry-picker'
import { OwnerBarcodeScanRow } from '@/features/entries/components/owner-barcode-scan-row'
import { OwnerRoosterCheckPanel } from '@/features/entries/components/owner-rooster-check-panel'
import { RoosterEntryCoreFields } from '@/features/entries/components/rooster-entry-core-fields'
import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import type { RoosterEntryCatalog } from '@/features/reference-values/catalog'
import { getRoosterEntryPaymentDisplay } from '@/features/payments/display-utils'
import type { RegistrationListItem } from '@/features/registrations/types'
import { createRoosterAction, type WeighingActionState } from '@/features/weighing/actions'
import type { WeighingEntrySummary } from '@/features/weighing/types'
import {
  ELIGIBILITY_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
} from '@/lib/derby/enums'
import type { EligibilityStatus, InspectionStatus, RegistrationWorkflowStatus } from '@/lib/derby/enums'

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

const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  not_required: 'Not required',
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Failed',
  for_review: 'For review',
}

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

function inspectionColor(
  status: InspectionStatus
): 'green' | 'red' | 'orange' | 'gray' {
  if (status === 'passed') return 'green'
  if (status === 'failed') return 'red'
  if (status === 'for_review') return 'orange'
  return 'gray'
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
          <Button
            type="submit"
            loading={pending}
            disabled={!canSubmit}
            alignSelf="flex-start"
            size="md"
            data-testid="roosters-save-button"
          >
            Save rooster
          </Button>
        </Stack>
      </form>
    </PanelCard>
  )
}

function CollapsibleAddRoosterSection({
  eventId,
  eventType,
  entries,
  cocksPerEntry,
  registrations,
  catalog,
  eligibilityContext,
  initialEntryId,
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
  const [open, setOpen] = useState(Boolean(initialEntryId))

  useEffect(() => {
    if (initialEntryId) setOpen(true)
  }, [initialEntryId])

  return (
    <Collapsible.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
      <Collapsible.Trigger asChild>
        <Button
          variant="outline"
          size="md"
          alignSelf="flex-start"
          data-testid="roosters-add-toggle"
        >
          {open ? 'Hide form' : 'Add rooster'}
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Box pt={LAYOUT_GAP.section}>
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
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

function RoosterListCard({
  eventId,
  registration,
  feeSettings,
  highlighted,
}: {
  eventId: string
  registration: RegistrationListItem
  feeSettings: EventFeeSettings
  highlighted: boolean
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const paymentBadge = getRoosterEntryPaymentDisplay(
    registration.reg_payment_status,
    feeSettings
  )

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  return (
    <Box
      ref={rowRef}
      id={`rooster-${registration.id}`}
      borderWidth="1px"
      borderColor={highlighted ? 'green.500' : 'border'}
      rounded="md"
      p={4}
      bg={highlighted ? 'bg.subtle' : undefined}
      data-registration-id={registration.id}
    >
      <Flex
        justify="space-between"
        align={{ base: 'stretch', md: 'start' }}
        gap={4}
        direction={{ base: 'column', md: 'row' }}
      >
        <Stack gap={1} flex="1">
          <Text fontWeight="semibold">
            Cock #{registration.cock_number} · {formatBandNumberForDisplay(registration.band_number)}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            #{registration.entry_number} {registration.entry_name}
            {registration.handler_name ? ` · Handler ${registration.handler_name}` : ''}
            {registration.breed || registration.color_marking
              ? ` · ${[registration.breed, registration.color_marking].filter(Boolean).join(' · ')}`
              : ''}
          </Text>
          <Flex gap={2} wrap="wrap">
            {paymentBadge ? (
              <Badge colorPalette={paymentBadge.colorPalette} size="sm">
                {paymentBadge.label}
              </Badge>
            ) : null}
            <Badge colorPalette={statusColor(registration.registration_status)} size="sm">
              {REGISTRATION_STATUS_LABELS[registration.registration_status]}
            </Badge>
            <Badge colorPalette={eligibilityColor(registration.eligibility_status)} size="sm">
              {ELIGIBILITY_STATUS_LABELS[registration.eligibility_status]}
            </Badge>
            <Badge colorPalette={inspectionColor(registration.inspection_status)} size="sm">
              {INSPECTION_STATUS_LABELS[registration.inspection_status]}
            </Badge>
          </Flex>
        </Stack>

        <Button
          asChild
          size="md"
          variant="outline"
          alignSelf={{ base: 'stretch', md: 'flex-start' }}
          data-testid="roosters-view-details-button"
        >
          <Link href={`/dashboard/events/${eventId}/roosters/${registration.id}`}>
            View rooster details
          </Link>
        </Button>
      </Flex>
    </Box>
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

      <CollapsibleAddRoosterSection
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

      {filtered.length === 0 ? (
        <PanelCard title="Roosters">
          <Text color="fg.muted">No roosters yet. Register owners first, then add cocks here.</Text>
        </PanelCard>
      ) : (
        <Stack gap={4}>
          {filtered.map((registration) => (
            <RoosterListCard
              key={registration.id}
              eventId={eventId}
              registration={registration}
              feeSettings={feeSettings}
              highlighted={highlightId === registration.id}
            />
          ))}
        </Stack>
      )}
    </PageStack>
  )
}
