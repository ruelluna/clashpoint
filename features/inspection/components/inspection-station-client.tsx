'use client'

import { Badge, Box, Button, Flex, Input, NativeSelect, Stack, Text, Textarea } from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState, useEffect, useMemo, useRef, useState } from 'react'

import {
  ButtonGroup,
  FormField,
  LAYOUT_GAP,
  PageHeader,
  PageStack,
  PanelCard,
} from '@/components/dashboard'
import { GramWeightInput } from '@/features/entries/components/gram-weight-input'
import type { EventFeeSettings } from '@/features/events/fee-utils'
import { EVENT_STATUS_LABELS } from '@/features/events/schema'
import type { EventStatus } from '@/features/events/types'
import { transitionStatusAction } from '@/features/events/actions'
import {
  approveInspectionAction,
  recordInspectionAction,
  rejectInspectionAction,
  type InspectionActionState,
} from '@/features/inspection/actions'
import type { InspectionQueueItem } from '@/features/inspection/queries'
import { RoosterBarcodeScanRow } from '@/features/inspection/components/rooster-barcode-scan-row'
import { getRoosterEntryPaymentDisplay } from '@/features/payments/display-utils'
import {
  recordWeightAction,
  verifyWeightAction,
  type WeighingActionState,
} from '@/features/weighing/actions'
import { WEIGHT_STATUS_LABELS } from '@/features/weighing/schema'
import type { InspectionStatus } from '@/lib/derby/enums'
import {
  ELIGIBILITY_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
} from '@/lib/derby/enums'

type InspectionStationClientProps = {
  eventId: string
  eventName: string
  eventStatus: EventStatus
  eventType: string
  feeSettings: EventFeeSettings
  canManageEvent: boolean
  items: InspectionQueueItem[]
  highlightRegistrationId?: string
}

const initialState: InspectionActionState = {}
const weighingInitialState: WeighingActionState = {}
const statusActionInitialState: { error?: string; success?: string } = {}

const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  not_required: 'Not required',
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Failed',
  for_review: 'For review',
}

function statusColor(
  status: InspectionStatus
): 'green' | 'red' | 'orange' | 'gray' {
  if (status === 'passed') return 'green'
  if (status === 'failed') return 'red'
  if (status === 'for_review') return 'orange'
  return 'gray'
}

function matchesSearchQuery(item: InspectionQueueItem, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return false

  return (
    item.entryName.toLowerCase().includes(normalized) ||
    item.entryNumber.toLowerCase().includes(normalized) ||
    (item.handlerName?.toLowerCase().includes(normalized) ?? false)
  )
}

function categorizeItem(item: InspectionQueueItem): 'pending' | 'cleared' | 'failed' {
  if (item.inspectionStatus === 'failed') return 'failed'
  if (item.inspectionStatus === 'for_review') return 'failed'
  if (item.inspectionStatus === 'passed') return 'cleared'
  return 'pending'
}

function RecordWeightForm({
  eventId,
  item,
}: {
  eventId: string
  item: InspectionQueueItem
}) {
  const [state, action, pending] = useActionState(recordWeightAction, weighingInitialState)

  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="roosterRecordId" value={item.registrationId} />
      <Flex gap={2} align="center" direction={{ base: 'column', sm: 'row' }} wrap="wrap">
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
          Official weight (g)
        </Text>
        <GramWeightInput
          name="officialWeight"
          size="md"
          width={{ base: 'full', sm: '24' }}
          placeholder="g"
          defaultValue={
            item.officialWeight != null ? String(item.officialWeight) : ''
          }
          required
          disabled={!!item.weightVerifiedAt}
        />
        <Button
          type="submit"
          size="md"
          loading={pending}
          disabled={!!item.weightVerifiedAt}
          width={{ base: 'full', sm: 'auto' }}
        >
          Record
        </Button>
      </Flex>
      {state.error ? (
        <Text color="fg.error" fontSize="xs" mt={1}>
          {state.error}
        </Text>
      ) : null}
      {state.success ? (
        <Text color="fg.success" fontSize="xs" mt={1}>
          {state.success}
        </Text>
      ) : null}
    </form>
  )
}

function VerifyWeightForm({
  eventId,
  item,
}: {
  eventId: string
  item: InspectionQueueItem
}) {
  const [state, action, pending] = useActionState(verifyWeightAction, weighingInitialState)

  if (!item.weighingId || item.weightVerifiedAt) return null

  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="weighingId" value={item.weighingId} />
      <Button
        type="submit"
        size="md"
        variant="outline"
        loading={pending}
        disabled={item.officialWeight == null}
        width={{ base: 'full', sm: 'auto' }}
      >
        Verify weight
      </Button>
      {state.error ? (
        <Text color="fg.error" fontSize="xs" mt={1}>
          {state.error}
        </Text>
      ) : null}
      {state.success ? (
        <Text color="fg.success" fontSize="xs" mt={1}>
          {state.success}
        </Text>
      ) : null}
    </form>
  )
}

function InspectionRow({
  eventId,
  item,
  feeSettings,
  highlighted,
}: {
  eventId: string
  item: InspectionQueueItem
  feeSettings: EventFeeSettings
  highlighted: boolean
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [recordState, recordAction, recordPending] = useActionState(
    recordInspectionAction,
    initialState
  )
  const [approveState, approveAction, approvePending] = useActionState(
    approveInspectionAction,
    initialState
  )
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectInspectionAction,
    initialState
  )

  const paymentBadge = getRoosterEntryPaymentDisplay(item.regPaymentStatus, feeSettings)
  const canPassInspection =
    item.weightVerified && item.weightStatus === 'passed' && !!item.weightVerifiedAt

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  return (
    <Box
      ref={rowRef}
      borderWidth="1px"
      borderColor={highlighted ? 'green.500' : 'border'}
      rounded="md"
      p={4}
      bg={highlighted ? 'bg.subtle' : undefined}
      data-registration-id={item.registrationId}
    >
      <Flex justify="space-between" align="start" gap={4} wrap="wrap">
        <Stack gap={1}>
          <Text fontWeight="semibold">
            #{item.entryNumber} {item.entryName} · Cock {item.cockNumber}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {item.handlerName ? `Handler ${item.handlerName}` : 'No handler listed'}
            {item.declaredWeight != null ? ` · Declared ${item.declaredWeight} g` : ''}
            {item.officialWeight != null ? ` · Official ${item.officialWeight} g` : ''}
          </Text>
          <Flex gap={2} wrap="wrap">
            <Badge colorPalette={statusColor(item.inspectionStatus)}>
              {INSPECTION_STATUS_LABELS[item.inspectionStatus]}
            </Badge>
            {item.weightStatus ? (
              <Badge colorPalette={item.weightVerified ? 'green' : 'orange'}>
                {item.weightVerified ? 'Weight verified' : WEIGHT_STATUS_LABELS[item.weightStatus]}
              </Badge>
            ) : (
              <Badge colorPalette="gray">Weight pending</Badge>
            )}
            {paymentBadge ? (
              <Badge colorPalette={paymentBadge.colorPalette}>{paymentBadge.label}</Badge>
            ) : null}
            <Badge colorPalette="gray" size="sm">
              {REGISTRATION_STATUS_LABELS[item.registrationStatus]}
            </Badge>
            <Badge colorPalette="gray" size="sm">
              {ELIGIBILITY_STATUS_LABELS[item.eligibilityStatus]}
            </Badge>
          </Flex>
          {item.inspectionStatus === 'passed' &&
          paymentBadge &&
          paymentBadge.colorPalette !== 'green' ? (
            <Text fontSize="sm" color="fg.muted">
              Inspection cleared — proceed to{' '}
              <Link href={`/dashboard/events/${eventId}/payments`}>Payments</Link> before matching.
            </Text>
          ) : null}
        </Stack>
      </Flex>

      <Stack gap={LAYOUT_GAP.form} mt={4}>
        <RecordWeightForm eventId={eventId} item={item} />
        <VerifyWeightForm eventId={eventId} item={item} />

        <form action={recordAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="registrationId" value={item.registrationId} />
          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }} align="end">
            <FormField label="Physical inspection" flex="1">
              <NativeSelect.Root>
                <NativeSelect.Field name="inspectionStatus" defaultValue="pending">
                  <option value="pending">Pending</option>
                  <option value="passed" disabled={!canPassInspection}>
                    Passed
                  </option>
                  <option value="failed">Failed</option>
                  <option value="for_review">For review</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
            <FormField label="Staff notes" flex="2">
              <Textarea
                name="notes"
                rows={2}
                defaultValue={item.notes ?? ''}
                placeholder="Inspection notes for this cock"
              />
            </FormField>
            <Button
              type="submit"
              loading={recordPending}
              alignSelf={{ base: 'stretch', sm: 'flex-end' }}
              size="md"
            >
              Save inspection
            </Button>
          </Flex>
          {!canPassInspection ? (
            <Text fontSize="xs" color="fg.muted" mt={2}>
              Record and verify official weight before marking inspection as passed.
            </Text>
          ) : null}
          {recordState.error ? (
            <Text fontSize="sm" color="red.500" mt={2}>
              {recordState.error}
            </Text>
          ) : null}
          {recordState.success ? (
            <Text fontSize="sm" color="green.600" mt={2}>
              {recordState.success}
            </Text>
          ) : null}
        </form>

        {item.inspectionId && item.inspectionStatus === 'for_review' ? (
          <Flex gap={2} wrap="wrap">
            <form action={approveAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="inspectionId" value={item.inspectionId} />
              <Button size="md" colorPalette="green" type="submit" loading={approvePending}>
                Approve
              </Button>
            </form>
            <form action={rejectAction} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="inspectionId" value={item.inspectionId} />
              <Textarea
                name="notes"
                placeholder="Rejection reason"
                rows={1}
                size="sm"
                minLength={3}
                required
                maxW="xs"
              />
              <Button size="md" colorPalette="red" type="submit" loading={rejectPending}>
                Reject
              </Button>
            </form>
            {approveState.error || rejectState.error ? (
              <Text fontSize="sm" color="red.500">
                {approveState.error ?? rejectState.error}
              </Text>
            ) : null}
          </Flex>
        ) : null}
      </Stack>
    </Box>
  )
}

function FindRoosterPanel({
  eventId,
  eventType,
  items,
  highlightRegistrationId,
  onHighlight,
}: {
  eventId: string
  eventType: string
  items: InspectionQueueItem[]
  highlightRegistrationId?: string
  onHighlight: (registrationId: string | undefined) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [pickerMatches, setPickerMatches] = useState<InspectionQueueItem[]>([])

  const showBarcodeScan = eventType === 'derby'

  function applyHighlight(registrationId: string) {
    onHighlight(registrationId)
    setSearchError(null)
    setPickerMatches([])
  }

  function handleSearch() {
    const matches = items.filter((item) => matchesSearchQuery(item, searchQuery))
    setSearchError(null)
    setPickerMatches([])

    if (matches.length === 0) {
      setSearchError('No rooster found — try entry name, handler, or scan the registration barcode.')
      onHighlight(undefined)
      return
    }

    if (matches.length === 1) {
      applyHighlight(matches[0].registrationId)
      return
    }

    setPickerMatches(matches)
  }

  return (
    <PanelCard title="Find rooster">
      <Stack gap={LAYOUT_GAP.section}>
        <Text fontSize="sm" color="fg.muted">
          Scan the registration slip or search by entry name / handler to open a cock in the queue.
        </Text>
        <Flex
          gap={LAYOUT_GAP.section}
          direction={{ base: 'column', md: 'row' }}
          align={{ md: 'stretch' }}
        >
          {showBarcodeScan ? (
            <Box flex="1">
              <RoosterBarcodeScanRow
                eventId={eventId}
                onResolved={applyHighlight}
              />
            </Box>
          ) : null}
          <Stack gap={2} flex="1">
            <Text fontSize="sm" fontWeight="medium">
              Search
            </Text>
            <Flex gap={2} direction={{ base: 'column', sm: 'row' }}>
              <Input
                size="md"
                placeholder="Entry name or handler"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  if (searchError) setSearchError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearch()
                  }
                }}
                data-testid="inspection-rooster-search-input"
              />
              <Button size="md" variant="outline" onClick={handleSearch} width={{ base: 'full', sm: 'auto' }}>
                Find
              </Button>
            </Flex>
            {searchError ? (
              <Text fontSize="sm" color="red.500">
                {searchError}
              </Text>
            ) : null}
          </Stack>
        </Flex>
        {pickerMatches.length > 0 ? (
          <Stack gap={2}>
            <Text fontSize="sm" fontWeight="medium">
              Multiple roosters matched — choose one
            </Text>
            {pickerMatches.map((item) => (
              <Button
                key={item.registrationId}
                size="md"
                variant="outline"
                justifyContent="flex-start"
                onClick={() => applyHighlight(item.registrationId)}
              >
                #{item.entryNumber} {item.entryName} · Cock {item.cockNumber}
                {item.handlerName ? ` · ${item.handlerName}` : ''}
              </Button>
            ))}
          </Stack>
        ) : null}
        {highlightRegistrationId ? (
          <Text fontSize="sm" color="green.600">
            Showing selected rooster in the queue below.
          </Text>
        ) : null}
      </Stack>
    </PanelCard>
  )
}

function OrganizerSummaryPanel({
  eventId,
  eventStatus,
  canManageEvent,
  passedCount,
  failedCount,
  awaitingPaymentCount,
  queueComplete,
}: {
  eventId: string
  eventStatus: EventStatus
  canManageEvent: boolean
  passedCount: number
  failedCount: number
  awaitingPaymentCount: number
  queueComplete: boolean
}) {
  const [statusState, statusAction, statusPending] = useActionState(
    transitionStatusAction,
    statusActionInitialState
  )

  if (!queueComplete) return null

  const canAdvanceEvent =
    canManageEvent && eventStatus === 'ready_for_weighing'

  return (
    <PanelCard title="Inspection queue complete">
      <Stack gap={LAYOUT_GAP.form}>
        <Text fontSize="sm" color="fg.muted">
          {passedCount} passed · {failedCount} failed · {awaitingPaymentCount} awaiting payment
        </Text>
        <ButtonGroup>
          <Button asChild size="md" colorPalette="blue">
            <Link href={`/dashboard/events/${eventId}/payments`}>Open Payments</Link>
          </Button>
          {canAdvanceEvent ? (
            <form action={statusAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="status" value="ready_for_matching" />
              <Button type="submit" size="md" variant="outline" loading={statusPending}>
                Mark event {EVENT_STATUS_LABELS.ready_for_matching}
              </Button>
            </form>
          ) : null}
        </ButtonGroup>
        {statusState.error ? (
          <Text fontSize="sm" color="red.500">
            {statusState.error}
          </Text>
        ) : null}
        {statusState.success ? (
          <Text fontSize="sm" color="green.600">
            {statusState.success}
          </Text>
        ) : null}
      </Stack>
    </PanelCard>
  )
}

export function InspectionStationClient({
  eventId,
  eventName,
  eventStatus,
  eventType,
  feeSettings,
  canManageEvent,
  items,
  highlightRegistrationId: initialHighlight,
}: InspectionStationClientProps) {
  const [highlightRegistrationId, setHighlightRegistrationId] = useState(initialHighlight)

  useEffect(() => {
    setHighlightRegistrationId(initialHighlight)
  }, [initialHighlight])

  const grouped = useMemo(() => {
    const pending: InspectionQueueItem[] = []
    const cleared: InspectionQueueItem[] = []
    const failed: InspectionQueueItem[] = []

    for (const item of items) {
      const bucket = categorizeItem(item)
      if (bucket === 'cleared') cleared.push(item)
      else if (bucket === 'failed') failed.push(item)
      else pending.push(item)
    }

    return { pending, cleared, failed }
  }, [items])

  const passedCount = grouped.cleared.length
  const failedCount = grouped.failed.length
  const awaitingPaymentCount = grouped.cleared.filter(
    (item) => item.regPaymentStatus !== 'paid' && item.regPaymentStatus !== 'not_required'
  ).length
  const queueComplete = items.length > 0 && grouped.pending.length === 0

  function renderSection(title: string, sectionItems: InspectionQueueItem[]) {
    if (sectionItems.length === 0) return null

    return (
      <Stack gap={4}>
        <Text fontWeight="semibold">{title}</Text>
        {sectionItems.map((item) => (
          <InspectionRow
            key={item.registrationId}
            eventId={eventId}
            item={item}
            feeSettings={feeSettings}
            highlighted={highlightRegistrationId === item.registrationId}
          />
        ))}
      </Stack>
    )
  }

  return (
    <PageStack>
      <PageHeader
        title="Inspection"
        description={`${eventName} · Record fight-day weight, complete physical inspection, then send owners to Payments before matching.`}
      />

      <FindRoosterPanel
        eventId={eventId}
        eventType={eventType}
        items={items}
        highlightRegistrationId={highlightRegistrationId}
        onHighlight={setHighlightRegistrationId}
      />

      <OrganizerSummaryPanel
        eventId={eventId}
        eventStatus={eventStatus}
        canManageEvent={canManageEvent}
        passedCount={passedCount}
        failedCount={failedCount}
        awaitingPaymentCount={awaitingPaymentCount}
        queueComplete={queueComplete}
      />

      {items.length === 0 ? (
        <PanelCard title="Queue">
          <Text color="fg.muted">No roosters registered for this event yet.</Text>
        </PanelCard>
      ) : (
        <Stack gap={LAYOUT_GAP.section}>
          {renderSection('Pending', grouped.pending)}
          {renderSection('Cleared', grouped.cleared)}
          {renderSection('Failed / for review', grouped.failed)}
        </Stack>
      )}
    </PageStack>
  )
}
