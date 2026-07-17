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
import type { EventFeeSettings } from '@/features/events/fee-utils'
import { EVENT_STATUS_LABELS } from '@/features/events/schema'
import type { EventStatus } from '@/features/events/types'
import { transitionStatusAction } from '@/features/events/actions'
import {
  approveInspectionAction,
  recordInspectionAction,
  submitInspectionWeightAction,
  type InspectionActionState,
} from '@/features/inspection/actions'
import type { InspectionQueueItem } from '@/features/inspection/queries'
import { InspectionRejectDialog } from '@/features/inspection/components/inspection-reject-dialog'
import { RoosterBarcodeScanRow } from '@/features/inspection/components/rooster-barcode-scan-row'
import { getRoosterEntryPaymentDisplay } from '@/features/payments/display-utils'
import { evaluateWeightStatusGrams, WEIGHT_STATUS_LABELS } from '@/features/weighing/schema'
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
  minWeightGrams: number | null
  maxWeightGrams: number | null
}

const initialState: InspectionActionState = {}
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

function weightStatusColor(status: 'passed' | 'failed' | null): 'green' | 'red' | 'gray' {
  if (status === 'passed') return 'green'
  if (status === 'failed') return 'red'
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

function hasInspectionOutcome(item: InspectionQueueItem): boolean {
  return (
    item.inspectionStatus === 'passed' ||
    item.inspectionStatus === 'failed' ||
    item.inspectionStatus === 'for_review'
  )
}

function InspectionRow({
  eventId,
  item,
  feeSettings,
  highlighted,
  minWeightGrams,
  maxWeightGrams,
}: {
  eventId: string
  item: InspectionQueueItem
  feeSettings: EventFeeSettings
  highlighted: boolean
  minWeightGrams: number | null
  maxWeightGrams: number | null
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [weightGramsInput, setWeightGramsInput] = useState('')
  const [localWeightPassed, setLocalWeightPassed] = useState(false)
  const [inspectionStatusInput, setInspectionStatusInput] = useState<InspectionStatus>(
    item.inspectionStatus === 'pending' ? 'passed' : item.inspectionStatus
  )
  const [notesInput, setNotesInput] = useState(item.notes ?? '')

  const [weightState, weightAction, weightPending] = useActionState(
    submitInspectionWeightAction,
    initialState
  )
  const [recordState, recordAction, recordPending] = useActionState(
    recordInspectionAction,
    initialState
  )
  const [approveState, approveAction, approvePending] = useActionState(
    approveInspectionAction,
    initialState
  )

  const paymentBadge = getRoosterEntryPaymentDisplay(item.regPaymentStatus, feeSettings)
  const weightPassed =
    item.weightVerified && item.weightStatus === 'passed' && !!item.weightVerifiedAt
  const previewWeightStatus =
    weightGramsInput.trim() !== ''
      ? evaluateWeightStatusGrams(
          Number.parseInt(weightGramsInput, 10),
          minWeightGrams,
          maxWeightGrams
        )
      : null
  const showPhysicalInspection = weightPassed || localWeightPassed
  const inspectButtonLabel = hasInspectionOutcome(item) ? 'Edit inspection' : 'Inspect'
  const formKey = `${item.registrationId}-${item.inspectedAt ?? 'new'}`

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  useEffect(() => {
    if (!isEditing) return
    setInspectionStatusInput(
      item.inspectionStatus === 'pending' ? 'passed' : item.inspectionStatus
    )
    setNotesInput(item.notes ?? '')
    setWeightGramsInput(
      item.officialWeightGrams != null ? String(item.officialWeightGrams) : ''
    )
  }, [isEditing, item.inspectedAt, item.inspectionStatus, item.notes, item.officialWeightGrams])

  useEffect(() => {
    if (weightState.weightStatus === 'passed') setLocalWeightPassed(true)
  }, [weightState.weightStatus])

  useEffect(() => {
    if (!isEditing) {
      setLocalWeightPassed(false)
      return
    }
    if (weightPassed) setLocalWeightPassed(true)
  }, [isEditing, weightPassed])

  useEffect(() => {
    if (weightState.inspectionClosed) setIsEditing(false)
  }, [weightState.inspectionClosed])

  useEffect(() => {
    if (recordState.inspectionClosed) setIsEditing(false)
  }, [recordState.inspectionClosed])

  useEffect(() => {
    if (approveState.inspectionClosed) setIsEditing(false)
  }, [approveState.inspectionClosed])

  function openEditMode() {
    setIsEditing(true)
  }

  function closeEditMode() {
    setIsEditing(false)
    setRejectOpen(false)
  }

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
      <Flex
        justify="space-between"
        align={{ base: 'stretch', md: 'start' }}
        gap={4}
        direction={{ base: 'column', md: 'row' }}
      >
        <Stack gap={1} flex="1">
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
          {item.notes && !isEditing ? (
            <Text fontSize="sm" color="fg.muted">
              Notes: {item.notes}
            </Text>
          ) : null}
          {item.inspectionStatus === 'passed' &&
          paymentBadge &&
          paymentBadge.colorPalette !== 'green' ? (
            <Text fontSize="sm" color="fg.muted">
              Inspection cleared — proceed to{' '}
              <Link href={`/dashboard/events/${eventId}/payments`}>Payments</Link> before matching.
            </Text>
          ) : null}
        </Stack>

        {!isEditing ? (
          <Button
            size="md"
            variant="outline"
            alignSelf={{ base: 'stretch', md: 'flex-start' }}
            onClick={openEditMode}
            data-testid="inspection-open-button"
          >
            {inspectButtonLabel}
          </Button>
        ) : null}
      </Flex>

      {isEditing ? (
        <Stack gap={LAYOUT_GAP.form} mt={4} key={formKey}>
          <form action={weightAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="roosterRecordId" value={item.registrationId} />
            <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }} align="end">
              <FormField label="Weight (g)" flex="1">
                <Input
                  name="officialWeightGrams"
                  type="number"
                  step="1"
                  min="1"
                  max="10000"
                  size="md"
                  placeholder="grams"
                  value={weightGramsInput}
                  onChange={(event) => setWeightGramsInput(event.target.value)}
                  required={!item.weightVerifiedAt}
                  disabled={!!item.weightVerifiedAt}
                  data-testid="inspection-weight-input"
                />
              </FormField>
              {previewWeightStatus && !item.weightVerifiedAt ? (
                <Badge colorPalette={weightStatusColor(previewWeightStatus)} alignSelf="center">
                  {previewWeightStatus === 'passed' ? 'Within range' : 'Out of range'}
                </Badge>
              ) : null}
              {!item.weightVerifiedAt ? (
                <Button
                  type="submit"
                  size="md"
                  loading={weightPending}
                  alignSelf={{ base: 'stretch', sm: 'flex-end' }}
                  data-testid="inspection-weight-submit"
                >
                  Record weight
                </Button>
              ) : null}
            </Flex>
            {weightState.error ? (
              <Text fontSize="sm" color="red.500" mt={2}>
                {weightState.error}
              </Text>
            ) : null}
            {weightState.success ? (
              <Text fontSize="sm" color="green.600" mt={2}>
                {weightState.success}
              </Text>
            ) : null}
          </form>

          {showPhysicalInspection ? (
            <>
              {item.inspectionStatus === 'for_review' && item.inspectionId ? (
                <form action={approveAction}>
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="inspectionId" value={item.inspectionId} />
                  <Stack gap={LAYOUT_GAP.form}>
                    <FormField label="Staff notes" flex="1">
                      <Textarea
                        name="notes"
                        rows={2}
                        value={notesInput}
                        onChange={(event) => setNotesInput(event.target.value)}
                        placeholder="Optional notes before approval"
                      />
                    </FormField>
                    <ButtonGroup>
                      <Button
                        type="submit"
                        size="md"
                        colorPalette="green"
                        loading={approvePending}
                        data-testid="inspection-approve-button"
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="md"
                        colorPalette="red"
                        variant="outline"
                        onClick={() => setRejectOpen(true)}
                        data-testid="inspection-reject-button"
                      >
                        Reject
                      </Button>
                      <Button type="button" size="md" variant="ghost" onClick={closeEditMode}>
                        Cancel
                      </Button>
                    </ButtonGroup>
                    {approveState.error ? (
                      <Text fontSize="sm" color="red.500">
                        {approveState.error}
                      </Text>
                    ) : null}
                  </Stack>
                </form>
              ) : (
                <form action={recordAction}>
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="registrationId" value={item.registrationId} />
                  <Stack gap={LAYOUT_GAP.form}>
                    <Flex
                      gap={LAYOUT_GAP.form}
                      direction={{ base: 'column', sm: 'row' }}
                      align="end"
                    >
                      <FormField label="Physical inspection" flex="1">
                        <NativeSelect.Root>
                          <NativeSelect.Field
                            name="inspectionStatus"
                            value={inspectionStatusInput}
                            onChange={(event) =>
                              setInspectionStatusInput(
                                event.currentTarget.value as InspectionStatus
                              )
                            }
                          >
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                            <option value="for_review">For review</option>
                          </NativeSelect.Field>
                        </NativeSelect.Root>
                      </FormField>
                      <FormField label="Staff notes" flex="2">
                        <Textarea
                          name="notes"
                          rows={2}
                          value={notesInput}
                          onChange={(event) => setNotesInput(event.target.value)}
                          placeholder="Inspection notes for this cock"
                        />
                      </FormField>
                    </Flex>
                    <ButtonGroup>
                      <Button
                        type="submit"
                        size="md"
                        colorPalette="green"
                        loading={recordPending}
                        disabled={inspectionStatusInput !== 'passed'}
                        data-testid="inspection-approve-button"
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="md"
                        colorPalette="red"
                        variant="outline"
                        onClick={() => setRejectOpen(true)}
                        data-testid="inspection-reject-button"
                      >
                        Reject
                      </Button>
                      <Button type="button" size="md" variant="ghost" onClick={closeEditMode}>
                        Cancel
                      </Button>
                    </ButtonGroup>
                    {inspectionStatusInput !== 'passed' ? (
                      <Text fontSize="xs" color="fg.muted">
                        Set physical inspection to Passed before approving, or use Reject.
                      </Text>
                    ) : null}
                    {recordState.error ? (
                      <Text fontSize="sm" color="red.500">
                        {recordState.error}
                      </Text>
                    ) : null}
                    {recordState.success ? (
                      <Text fontSize="sm" color="green.600">
                        {recordState.success}
                      </Text>
                    ) : null}
                  </Stack>
                </form>
              )}
            </>
          ) : null}

          {!showPhysicalInspection && item.weightVerifiedAt && item.weightStatus === 'failed' ? (
            <Text fontSize="sm" color="fg.muted">
              Weight failed — physical inspection is not required.
            </Text>
          ) : null}

          {!item.weightVerifiedAt ? (
            <Button type="button" size="md" variant="ghost" alignSelf="flex-start" onClick={closeEditMode}>
              Cancel
            </Button>
          ) : null}
        </Stack>
      ) : null}

      <InspectionRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        eventId={eventId}
        registrationId={item.registrationId}
        inspectionId={item.inspectionId}
        isForReview={item.inspectionStatus === 'for_review'}
        onSuccess={closeEditMode}
      />
    </Box>
  )
}

function FindRoosterPanel({
  eventId,
  items,
  highlightRegistrationId,
  onHighlight,
}: {
  eventId: string
  items: InspectionQueueItem[]
  highlightRegistrationId?: string
  onHighlight: (registrationId: string | undefined) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [pickerMatches, setPickerMatches] = useState<InspectionQueueItem[]>([])

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
          <Box flex="1">
            <RoosterBarcodeScanRow
              eventId={eventId}
              onResolved={applyHighlight}
            />
          </Box>
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
  minWeightGrams,
  maxWeightGrams,
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
            minWeightGrams={minWeightGrams}
            maxWeightGrams={maxWeightGrams}
          />
        ))}
      </Stack>
    )
  }

  return (
    <PageStack>
      <PageHeader
        title="Inspection"
        description={`${eventName} · Record fight-day weight in grams, complete physical inspection, then send owners to Payments before matching.`}
      />

      <FindRoosterPanel
        eventId={eventId}
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
