'use client'

import { Badge, Box, Button, Flex, Input, NativeSelect, Stack, Text, Textarea } from '@chakra-ui/react'
import { useActionState } from 'react'

import { FormField, LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import {
  approveInspectionAction,
  recordInspectionAction,
  rejectInspectionAction,
  type InspectionActionState,
} from '@/features/inspection/actions'
import type { InspectionQueueItem } from '@/features/inspection/queries'
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
  items: InspectionQueueItem[]
}

const initialState: InspectionActionState = {}
const weighingInitialState: WeighingActionState = {}

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
          Official weight (kg)
        </Text>
        <Input
          name="officialWeight"
          type="number"
          step="0.01"
          min="0"
          size="md"
          width={{ base: 'full', sm: '24' }}
          placeholder="kg"
          defaultValue={
            item.officialWeight != null ? String(item.officialWeight) : ''
          }
          required
          disabled={!!item.weightVerifiedAt}
        />
        <Button type="submit" size="md" loading={pending} disabled={!!item.weightVerifiedAt} width={{ base: 'full', sm: 'auto' }}>
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

function InspectionRow({ eventId, item }: { eventId: string; item: InspectionQueueItem }) {
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

  return (
    <Box borderWidth="1px" borderColor="border" rounded="md" p={4}>
      <Flex justify="space-between" align="start" gap={4} wrap="wrap">
        <Stack gap={1}>
          <Text fontWeight="semibold">
            #{item.entryNumber} {item.entryName} · Cock {item.cockNumber}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Band {item.bandNumber}
            {item.declaredWeight != null ? ` · Declared ${item.declaredWeight} kg` : ''}
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
            <Badge colorPalette="gray" size="sm">
              {REGISTRATION_STATUS_LABELS[item.registrationStatus]}
            </Badge>
            <Badge colorPalette="gray" size="sm">
              {ELIGIBILITY_STATUS_LABELS[item.eligibilityStatus]}
            </Badge>
          </Flex>
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
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="for_review">For review</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
            <FormField label="Notes" flex="2">
              <Textarea name="notes" rows={2} defaultValue={item.notes ?? ''} />
            </FormField>
            <Button type="submit" loading={recordPending} alignSelf={{ base: 'stretch', sm: 'flex-end' }} size="md">
              Save inspection
            </Button>
          </Flex>
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

        {item.inspectionId ? (
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

export function InspectionStationClient({
  eventId,
  eventName,
  items,
}: InspectionStationClientProps) {
  const pendingItems = items.filter(
    (item) =>
      item.inspectionStatus === 'pending' ||
      !item.weightVerified ||
      item.eligibilityStatus !== 'eligible'
  )

  return (
    <PageStack>
      <PageHeader
        title="Inspection"
        description={`${eventName} · Confirm official weight and complete physical inspection. Passing marks the cock eligible for matching.`}
      />

      {items.length === 0 ? (
        <PanelCard title="Queue">
          <Text color="fg.muted">No roosters registered for this event yet.</Text>
        </PanelCard>
      ) : (
        <Stack gap={4}>
          {pendingItems.length === 0 ? (
            <PanelCard title="Queue">
              <Text color="fg.muted">All registered roosters have verified weight and inspection.</Text>
            </PanelCard>
          ) : null}
          {(pendingItems.length > 0 ? pendingItems : items).map((item) => (
            <InspectionRow key={item.registrationId} eventId={eventId} item={item} />
          ))}
        </Stack>
      )}
    </PageStack>
  )
}
