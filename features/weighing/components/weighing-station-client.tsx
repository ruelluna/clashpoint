'use client'

import { Badge, Box, Button, Flex, Input, NativeSelect, Stack, Text } from '@chakra-ui/react'
import { useActionState, useMemo, useState } from 'react'

import { LAYOUT_GAP, FormField, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import {
  createRoosterAction,
  recordWeightAction,
  verifyWeightAction,
  type WeighingActionState,
} from '@/features/weighing/actions'
import { WEIGHT_STATUS_LABELS } from '@/features/weighing/schema'
import type { WeighingEntrySummary, WeighingStationItem } from '@/features/weighing/types'

type WeighingStationClientProps = {
  eventId: string
  minWeight: number | null
  maxWeight: number | null
  cocksPerEntry: number
  entries: WeighingEntrySummary[]
  items: WeighingStationItem[]
  embedded?: boolean
}

function weightStatusColor(
  status: WeighingStationItem['weight_status']
): 'green' | 'red' | 'orange' | 'gray' {
  if (status === 'passed') return 'green'
  if (status === 'failed') return 'red'
  if (status === 'for_review') return 'orange'
  return 'gray'
}

function CreateRoosterForm({
  eventId,
  entries,
  title = 'Add rooster with weight',
}: {
  eventId: string
  entries: WeighingEntrySummary[]
  title?: string
}) {
  const [state, action, pending] = useActionState(
    createRoosterAction,
    {} as WeighingActionState
  )
  const [entryId, setEntryId] = useState('')

  const addableEntries = entries.filter((entry) => entry.can_add_rooster)

  return (
    <PanelCard title={title}>
      <form action={action}>
        <input type="hidden" name="eventId" value={eventId} />
        <Stack gap={LAYOUT_GAP.form} maxW="2xl">
          <FormField label="Entry" required>
            <NativeSelect.Root>
              <NativeSelect.Field
                name="entryId"
                value={entryId}
                onChange={(event) => setEntryId(event.currentTarget.value)}
              >
                <option value="">Select entry</option>
                {addableEntries.map((entry) => (
                  <option key={entry.entry_id} value={entry.entry_id}>
                    #{entry.entry_number} {entry.entry_name} · {entry.owner_name} (
                    {entry.rooster_count} cock
                    {entry.rooster_count === 1 ? '' : 's'})
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </FormField>
          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Band number" required flex="1">
              <Input name="bandNumber" required maxLength={50} />
            </FormField>
            <FormField label="Weight (kg)" required flex="1">
              <Input name="weight" type="number" step="0.01" min="0" required />
            </FormField>
          </Flex>
          <FormField label="Handler name">
            <Input name="handlerName" maxLength={200} />
          </FormField>
          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Category" flex="1">
              <Input name="category" maxLength={100} />
            </FormField>
            <FormField label="Color / marking" flex="1">
              <Input name="colorMarking" maxLength={200} />
            </FormField>
          </Flex>
          <Button type="submit" size="sm" loading={pending} alignSelf="flex-start">
            Add rooster
          </Button>
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
        </Stack>
      </form>
      {addableEntries.length === 0 ? (
        <Text mt={3} fontSize="sm" color="fg.muted">
          All entries have reached their cock limit, or no entries exist yet.
        </Text>
      ) : null}
    </PanelCard>
  )
}

function RecordWeightForm({
  eventId,
  item,
}: {
  eventId: string
  item: WeighingStationItem
}) {
  const [state, action, pending] = useActionState(
    recordWeightAction,
    {} as WeighingActionState
  )

  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="roosterRecordId" value={item.rooster_event_registration_id} />
      <Flex gap={2} align="center" wrap="wrap">
        <Input
          name="officialWeight"
          type="number"
          step="0.01"
          min="0"
          size="sm"
          width="24"
          placeholder="kg"
          defaultValue={
            item.official_weight != null ? String(item.official_weight) : ''
          }
          required
          disabled={!!item.verified_at}
        />
        <Button type="submit" size="sm" loading={pending} disabled={!!item.verified_at}>
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
  item: WeighingStationItem
}) {
  const [state, action, pending] = useActionState(
    verifyWeightAction,
    {} as WeighingActionState
  )

  if (!item.weighing_id || item.verified_at) return null

  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="weighingId" value={item.weighing_id} />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        loading={pending}
        disabled={item.official_weight == null}
      >
        Verify
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

export function WeighingStationClient({
  eventId,
  minWeight,
  maxWeight,
  cocksPerEntry,
  entries,
  items,
  embedded = false,
}: WeighingStationClientProps) {
  const weightRange =
    minWeight != null || maxWeight != null
      ? `${minWeight ?? '—'} – ${maxWeight ?? '—'} kg`
      : 'No weight limits configured'

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const entryCompare = a.entry_number.localeCompare(b.entry_number)
        if (entryCompare !== 0) return entryCompare
        return a.cock_number - b.cock_number
      }),
    [items]
  )

  const addableEntries = entries.filter((entry) => entry.can_add_rooster)
  const showCreateForm = !embedded || addableEntries.length > 0
  const createFormTitle = embedded ? 'Add another cock to entry' : 'Add rooster with weight'
  const createFormEntries = embedded ? addableEntries : entries.filter((e) => e.can_add_rooster)

  return (
    <PageStack>
      {embedded ? (
        <PageHeader
          title="Roosters & weights"
          description={`${cocksPerEntry} cock${cocksPerEntry === 1 ? '' : 's'} per entry · Limits: ${weightRange}`}
        />
      ) : (
        <PageHeader
          title="Weighing"
          description={`Register roosters with weight for each entry (${cocksPerEntry} cock${cocksPerEntry === 1 ? '' : 's'} per entry). Limits: ${weightRange}.`}
        />
      )}

      {showCreateForm && createFormEntries.length > 0 ? (
        <CreateRoosterForm
          eventId={eventId}
          entries={createFormEntries}
          title={createFormTitle}
        />
      ) : null}

      <PanelCard flush>
        <Box overflowX="auto">
          <Box as="table" width="100%" fontSize="sm">
            <Box as="thead" bg="bg.subtle">
              <Box as="tr">
                {[
                  'Entry',
                  'Cock',
                  'Band',
                  'Weight',
                  'Status',
                  'Adjust',
                  'Verify',
                ].map((header) => (
                  <Box as="th" key={header} textAlign="left" px={3} py={3} fontWeight="medium">
                    {header}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box as="tbody">
              {sortedItems.length === 0 ? (
                <Box as="tr">
                  <td colSpan={7}>
                    <Box px={4} py={6} color="fg.muted">
                      No roosters yet. Add a rooster above to start weighing.
                    </Box>
                  </td>
                </Box>
              ) : (
                sortedItems.map((item) => (
                  <Box
                    as="tr"
                    key={item.rooster_event_registration_id}
                    borderTopWidth="1px"
                    borderColor="border"
                  >
                    <Box as="td" px={3} py={3}>
                      <Text fontWeight="medium">#{item.entry_number}</Text>
                      <Text color="fg.muted">{item.entry_name}</Text>
                    </Box>
                    <Box as="td" px={3} py={3}>
                      #{item.cock_number}
                    </Box>
                    <Box as="td" px={3} py={3}>
                      {item.band_number}
                    </Box>
                    <Box as="td" px={3} py={3}>
                      {item.official_weight != null
                        ? `${item.official_weight} kg`
                        : '—'}
                    </Box>
                    <Box as="td" px={3} py={3}>
                      {item.weight_status ? (
                        <Badge colorPalette={weightStatusColor(item.weight_status)}>
                          {WEIGHT_STATUS_LABELS[item.weight_status]}
                        </Badge>
                      ) : (
                        <Text color="fg.muted">Pending</Text>
                      )}
                      {item.verified_at ? (
                        <Text fontSize="xs" color="fg.muted">
                          Verified
                        </Text>
                      ) : null}
                    </Box>
                    <Box as="td" px={3} py={3}>
                      <RecordWeightForm eventId={eventId} item={item} />
                    </Box>
                    <Box as="td" px={3} py={3}>
                      <VerifyWeightForm eventId={eventId} item={item} />
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </PanelCard>
    </PageStack>
  )
}
