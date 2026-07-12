'use client'

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Input,
  NativeSelect,
  Text,
  Textarea,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'

import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  createEventAction,
  transitionStatusAction,
  updateEventAction,
  type ActionState,
} from '@/features/events/actions'
import {
  COCKS_PER_ENTRY_BY_DERBY_TYPE,
  getNextStatuses,
} from '@/features/events/utils'
import {
  DERBY_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  PRIZE_TYPE_LABELS,
} from '@/features/events/schema'
import type {
  DerbyType,
  EventType,
  EventWithPrize,
  PrizeConfigEntry,
  PrizeType,
} from '@/features/events/types'
import type { PromoterListItem } from '@/features/promoters/types'

type EventFormClientProps = {
  mode: 'create' | 'edit'
  promoters: PromoterListItem[]
  event?: EventWithPrize
  canManage: boolean
}

const initialState: ActionState = {}

const DEFAULT_PRIZE_TIERS: PrizeConfigEntry[] = [
  { place: 1, label: 'Champion', value: 50 },
  { place: 2, label: 'Runner-up', value: 30 },
  { place: 3, label: 'Third', value: 20 },
]

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function buildInitialPrizeState(event?: EventWithPrize) {
  return {
    prizeType: (event?.prize_structure?.prize_type ?? 'percentage') as PrizeType,
    config: (event?.prize_structure?.config?.length
      ? event.prize_structure.config
      : DEFAULT_PRIZE_TIERS) as PrizeConfigEntry[],
  }
}

export function EventFormClient({
  mode,
  promoters,
  event,
  canManage,
}: EventFormClientProps) {
  const action = mode === 'create' ? createEventAction : updateEventAction
  const [formState, formAction, pending] = useActionState(action, initialState)
  const [statusState, statusAction, statusPending] = useActionState(
    transitionStatusAction,
    initialState
  )

  const [eventType, setEventType] = useState<EventType>(
    () => event?.event_type ?? 'derby'
  )
  const isClassic = eventType === 'classic'
  const isDerby = eventType === 'derby'

  const [derbyType, setDerbyType] = useState<DerbyType>(
    () => event?.derby_type ?? '5_cock'
  )
  const isCustomDerby = derbyType === 'custom'

  const [prizeType, setPrizeType] = useState<PrizeType>(
    () => buildInitialPrizeState(event).prizeType
  )
  const [prizeConfig, setPrizeConfig] = useState<PrizeConfigEntry[]>(
    () => buildInitialPrizeState(event).config
  )

  const prizeStructureJson = useMemo(
    () => JSON.stringify(prizeConfig),
    [prizeConfig]
  )

  const presetCocks =
    derbyType !== 'custom' ? COCKS_PER_ENTRY_BY_DERBY_TYPE[derbyType] : null

  const nextStatuses = event ? getNextStatuses(event.status) : []

  function updatePrizeTier(index: number, field: keyof PrizeConfigEntry, value: string) {
    setPrizeConfig((current) =>
      current.map((tier, i) => {
        if (i !== index) return tier
        if (field === 'place') {
          return { ...tier, place: Number(value) || 1 }
        }
        if (field === 'value') {
          return {
            ...tier,
            value: value.trim() === '' ? undefined : Number(value),
          }
        }
        return { ...tier, [field]: value }
      })
    )
  }

  function addPrizeTier() {
    setPrizeConfig((current) => [
      ...current,
      {
        place: current.length + 1,
        label: `Place ${current.length + 1}`,
        value: prizeType === 'manual' ? undefined : 0,
      },
    ])
  }

  function removePrizeTier(index: number) {
    setPrizeConfig((current) => current.filter((_, i) => i !== index))
  }

  if (!canManage && mode === 'edit') {
    return (
      <Box>
        <Text color="fg.muted">You do not have permission to edit this event.</Text>
        <Button asChild mt={4} variant="outline">
          <Link href={`/dashboard/events/${event?.id}`}>Back to event</Link>
        </Button>
      </Box>
    )
  }

  return (
    <Box className="space-y-6">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          {mode === 'create' ? 'New event' : 'Edit event'}
        </Text>
        {event ? (
          <Flex align="center" gap={2} mt={1}>
            <Badge>{EVENT_STATUS_LABELS[event.status]}</Badge>
            <Text fontSize="sm" color="fg.muted">
              {event.name}
            </Text>
          </Flex>
        ) : (
          <Text color="fg.muted">Configure event details and prize structure.</Text>
        )}
      </Box>

      {event && nextStatuses.length > 0 ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
          <Text fontWeight="medium" mb={3}>
            Status
          </Text>
          <Flex gap={2} wrap="wrap">
            {nextStatuses.map((status) => (
              <form key={status} action={statusAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="status" value={status} />
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  loading={statusPending}
                  colorPalette={status === 'cancelled' ? 'red' : undefined}
                >
                  Mark {EVENT_STATUS_LABELS[status]}
                </Button>
              </form>
            ))}
          </Flex>
          {statusState.error ? (
            <Text color="fg.error" fontSize="sm" mt={2}>
              {statusState.error}
            </Text>
          ) : null}
          {statusState.success ? (
            <Text color="fg.success" fontSize="sm" mt={2}>
              {statusState.success}
            </Text>
          ) : null}
        </Box>
      ) : null}

      <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
        <form action={formAction}>
          <Flex direction="column" gap={5}>
            {event ? <input type="hidden" name="eventId" value={event.id} /> : null}
            <input type="hidden" name="eventType" value={eventType} />
            {isDerby ? (
              <>
                <input type="hidden" name="prizeType" value={prizeType} />
                <input type="hidden" name="prizeConfig" value={prizeStructureJson} />
                <input type="hidden" name="derbyType" value={derbyType} />
              </>
            ) : null}
            {isClassic ? <input type="hidden" name="cocksPerEntry" value="1" /> : null}

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Event name
              </Text>
              <Input name="name" defaultValue={event?.name ?? ''} required />
            </Box>

            <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Event date
                </Text>
                <Input
                  name="eventDate"
                  type="datetime-local"
                  defaultValue={toDatetimeLocalValue(event?.event_date)}
                  required
                />
              </Box>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Event type
                </Text>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={eventType}
                    onChange={(e) => setEventType(e.currentTarget.value as EventType)}
                  >
                    {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {isClassic
                    ? 'Single weight-matched bouts, one cock per entry.'
                    : 'Multi-cock tournament with cumulative scoring.'}
                </Text>
              </Box>
            </Flex>

            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Tax per fight
              </Text>
              <Input
                name="taxPerFight"
                type="number"
                min={0}
                step="0.01"
                defaultValue={event?.tax_per_fight ?? 0}
              />
            </Box>

            {isDerby ? (
              <>
                <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Registration deadline
                    </Text>
                    <Input
                      name="registrationDeadline"
                      type="datetime-local"
                      defaultValue={toDatetimeLocalValue(event?.registration_deadline)}
                    />
                  </Box>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Promoter
                    </Text>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        name="promoterId"
                        defaultValue={event?.promoter_id ?? ''}
                      >
                        <option value="">None</option>
                        {promoters.map((promoter) => (
                          <option key={promoter.id} value={promoter.id}>
                            {promoter.name}
                          </option>
                        ))}
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Box>
                </Flex>

                <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                  <Box flex="1">
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      Derby type
                    </Text>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={derbyType}
                        onChange={(e) =>
                          setDerbyType(e.currentTarget.value as DerbyType)
                        }
                      >
                        {Object.entries(DERBY_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Box>
                  {isCustomDerby ? (
                    <Box flex="1">
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        Cocks per entry
                      </Text>
                      <Input
                        name="cocksPerEntry"
                        type="number"
                        min={1}
                        defaultValue={event?.cocks_per_entry ?? 5}
                      />
                    </Box>
                  ) : (
                    <Box flex="1">
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        Cocks per entry
                      </Text>
                      <Text fontSize="sm" color="fg.muted" pt={2}>
                        {presetCocks} cocks per entry (from derby type)
                      </Text>
                    </Box>
                  )}
                </Flex>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Prize structure
                  </Text>
                  <NativeSelect.Root maxW="xs" mb={3}>
                    <NativeSelect.Field
                      value={prizeType}
                      onChange={(event) =>
                        setPrizeType(event.currentTarget.value as PrizeType)
                      }
                    >
                      {Object.entries(PRIZE_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>

                  <Flex direction="column" gap={2}>
                    {prizeConfig.map((tier, index) => (
                      <Flex key={`${tier.place}-${index}`} gap={2} wrap="wrap">
                        <Input
                          type="number"
                          min={1}
                          value={tier.place}
                          onChange={(event) =>
                            updatePrizeTier(index, 'place', event.target.value)
                          }
                          maxW="20"
                        />
                        <Input
                          value={tier.label}
                          onChange={(event) =>
                            updatePrizeTier(index, 'label', event.target.value)
                          }
                          flex="1"
                          minW="40"
                        />
                        {prizeType !== 'manual' ? (
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={tier.value ?? ''}
                            onChange={(event) =>
                              updatePrizeTier(index, 'value', event.target.value)
                            }
                            maxW="32"
                            placeholder={prizeType === 'percentage' ? '%' : 'Amount'}
                          />
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removePrizeTier(index)}
                          disabled={prizeConfig.length <= 1}
                        >
                          Remove
                        </Button>
                      </Flex>
                    ))}
                  </Flex>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    mt={2}
                    onClick={addPrizeTier}
                  >
                    Add tier
                  </Button>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Registration rules
                  </Text>
                  <RichTextEditor
                    name="registrationRules"
                    defaultValue={event?.registration_rules}
                  />
                </Box>
              </>
            ) : null}

            <Flex direction="column" gap={2}>
              <Checkbox.Root defaultChecked={event?.legal_authorized ?? false} name="legalAuthorized">
                <Checkbox.HiddenInput name="legalAuthorized" />
                <Checkbox.Control />
                <Checkbox.Label>Legal authorization confirmed</Checkbox.Label>
              </Checkbox.Root>
              <Checkbox.Root defaultChecked={event?.is_public ?? false} name="isPublic">
                <Checkbox.HiddenInput name="isPublic" />
                <Checkbox.Control />
                <Checkbox.Label>Public event listing</Checkbox.Label>
              </Checkbox.Root>
              <Checkbox.Root defaultChecked={event?.publish_matches ?? false} name="publishMatches">
                <Checkbox.HiddenInput name="publishMatches" />
                <Checkbox.Control />
                <Checkbox.Label>Publish matches</Checkbox.Label>
              </Checkbox.Root>
              <Checkbox.Root defaultChecked={event?.publish_standings ?? false} name="publishStandings">
                <Checkbox.HiddenInput name="publishStandings" />
                <Checkbox.Control />
                <Checkbox.Label>Publish standings</Checkbox.Label>
              </Checkbox.Root>
              <Checkbox.Root defaultChecked={event?.publish_winners ?? false} name="publishWinners">
                <Checkbox.HiddenInput name="publishWinners" />
                <Checkbox.Control />
                <Checkbox.Label>Publish winners</Checkbox.Label>
              </Checkbox.Root>
              <Checkbox.Root
                defaultChecked={event?.publish_prize_amounts ?? false}
                name="publishPrizeAmounts"
              >
                <Checkbox.HiddenInput name="publishPrizeAmounts" />
                <Checkbox.Control />
                <Checkbox.Label>Publish prize amounts</Checkbox.Label>
              </Checkbox.Root>
            </Flex>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Notes
              </Text>
              <Textarea name="notes" rows={3} defaultValue={event?.notes ?? ''} />
            </Box>

            <Flex gap={3} wrap="wrap">
              <Button type="submit" loading={pending}>
                {mode === 'create' ? 'Create event' : 'Save changes'}
              </Button>
              <Button asChild variant="outline">
                <Link href={event ? `/dashboard/events/${event.id}` : '/dashboard/events'}>
                  Cancel
                </Link>
              </Button>
            </Flex>

            {formState.error ? (
              <Text color="fg.error" fontSize="sm">
                {formState.error}
              </Text>
            ) : null}
            {formState.success ? (
              <Text color="fg.success" fontSize="sm">
                {formState.success}
              </Text>
            ) : null}
          </Flex>
        </form>
      </Box>
    </Box>
  )
}
