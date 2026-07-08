'use client'

import { Badge, Box, Button, Flex, Input, Text } from '@chakra-ui/react'
import { useActionState } from 'react'

import {
  recordWeightAction,
  verifyWeightAction,
  type WeighingActionState,
} from '@/features/weighing/actions'
import { WEIGHT_STATUS_LABELS } from '@/features/weighing/schema'
import type { WeighingStationItem } from '@/features/weighing/types'

type WeighingStationClientProps = {
  eventId: string
  minWeight: number | null
  maxWeight: number | null
  items: WeighingStationItem[]
}

function weightStatusColor(
  status: WeighingStationItem['weight_status']
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
  item: WeighingStationItem
}) {
  const [state, action, pending] = useActionState(
    recordWeightAction,
    {} as WeighingActionState
  )

  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="roosterRecordId" value={item.rooster_record_id} />
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
  items,
}: WeighingStationClientProps) {
  const weightRange =
    minWeight != null || maxWeight != null
      ? `${minWeight ?? '—'} – ${maxWeight ?? '—'} kg`
      : 'No weight limits configured'

  return (
    <Box className="space-y-6">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          Weighing station
        </Text>
        <Text color="fg.muted">
          Record official weights and verify pass/fail against event limits ({weightRange}).
        </Text>
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        <Box overflowX="auto">
          <Box as="table" width="100%" fontSize="sm">
            <Box as="thead" bg="bg.subtle">
              <Box as="tr">
                {[
                  'Entry',
                  'Cock',
                  'Band',
                  'Declared',
                  'Official',
                  'Status',
                  'Record',
                  'Verify',
                ].map((header) => (
                  <Box as="th" key={header} textAlign="left" px={3} py={3} fontWeight="medium">
                    {header}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box as="tbody">
              {items.length === 0 ? (
                <Box as="tr">
                  <td colSpan={8}>
                    <Box px={4} py={6} color="fg.muted">
                      No submitted lineups yet. Submit lineups before weighing.
                    </Box>
                  </td>
                </Box>
              ) : (
                items.map((item) => (
                  <Box
                    as="tr"
                    key={item.rooster_record_id}
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
                      {item.declared_weight != null ? `${item.declared_weight} kg` : '—'}
                    </Box>
                    <Box as="td" px={3} py={3}>
                      {item.official_weight != null ? `${item.official_weight} kg` : '—'}
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
      </Box>
    </Box>
  )
}
