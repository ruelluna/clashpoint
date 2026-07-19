'use client'

import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Input,
  NativeSelect,
  Portal,
  Stack,
  Switch,
  Text,
  Textarea,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useMemo, useState } from 'react'

import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  ButtonGroup,
  FormField,
  LAYOUT_GAP,
  PageHeader,
  PageStack,
  PanelCard,
} from '@/components/dashboard'
import { DerbyEligibilityConfigPanel } from '@/features/eligibility/components/derby-eligibility-config-panel'
import type { DerbyEligibilityPolicyRow } from '@/features/eligibility/queries'
import {
  createEventAction,
  transitionStatusAction,
  updateEventAction,
  type ActionState,
} from '@/features/events/actions'
import { EventActiveControls } from '@/features/events/components/event-active-controls'
import {
  COCKS_PER_ENTRY_BY_DERBY_TYPE,
  getNextStatuses,
} from '@/features/events/utils'
import {
  defaultTaxPerFight,
  DERBY_AGE_TYPE_LABELS,
  DERBY_FORMAT_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  PRIZE_TYPE_LABELS,
} from '@/features/events/schema'
import type {
  DerbyAgeType,
  DerbyType,
  EventType,
  EventWithPrize,
  PrizeConfigEntry,
  PrizeType,
} from '@/features/events/types'
import { quickCreatePromoterAction } from '@/features/promoters/actions'
import type { PromoterListItem } from '@/features/promoters/types'

type EventFormClientProps = {
  mode: 'create' | 'edit'
  promoters: PromoterListItem[]
  event?: EventWithPrize
  canManage: boolean
  eligibilityPolicy?: DerbyEligibilityPolicyRow | null
  canManageEligibility?: boolean
  blockingActiveEvent?: { id: string; name: string } | null
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

function PromoterQuickAddDialog({
  onCreated,
}: {
  onCreated: (promoter: PromoterListItem) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit() {
    setPending(true)
    setError(null)
    const result = await quickCreatePromoterAction({ name, phone })
    setPending(false)

    if ('error' in result) {
      setError(result.error ?? 'Failed to create promoter')
      return
    }

    onCreated({
      id: result.promoterId,
      name: result.name,
      status: 'active',
      contact_person: null,
      email: null,
      phone,
      commission_type: 'none',
      commission_value: null,
      user_id: null,
      created_at: new Date().toISOString(),
    })
    setName('')
    setPhone('')
    setOpen(false)
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Add promoter
      </Button>
      <Dialog.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="md">
              <Dialog.Header>
                <Dialog.Title>Add promoter</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap={LAYOUT_GAP.form}>
                  <FormField label="Name" required>
                    <Input value={name} onChange={(event) => setName(event.target.value)} />
                  </FormField>
                  <FormField label="Phone" required>
                    <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
                  </FormField>
                  {error ? (
                    <Text color="fg.error" fontSize="sm">
                      {error}
                    </Text>
                  ) : null}
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <ButtonGroup>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" loading={pending} onClick={handleSubmit}>
                    Save promoter
                  </Button>
                </ButtonGroup>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}

export function EventFormClient({
  mode,
  promoters: initialPromoters,
  event,
  canManage,
  eligibilityPolicy = null,
  canManageEligibility = false,
  blockingActiveEvent = null,
}: EventFormClientProps) {
  const router = useRouter()
  const action = mode === 'create' ? createEventAction : updateEventAction
  const [formState, formAction, pending] = useActionState(action, initialState)
  const [statusState, statusAction, statusPending] = useActionState(
    transitionStatusAction,
    initialState
  )

  const [promoters, setPromoters] = useState(initialPromoters)
  const [promoterId, setPromoterId] = useState(event?.promoter_id ?? '')
  const [eventType, setEventType] = useState<EventType>(() => event?.event_type ?? 'derby')
  const isClassic = eventType === 'classic'
  const isDerby = eventType === 'derby'

  const [derbyType, setDerbyType] = useState<DerbyType>(() => event?.derby_type ?? '2_cock')
  const [derbyAgeType, setDerbyAgeType] = useState<DerbyAgeType>(
    () => event?.derby_age_type ?? 'open_derby'
  )
  const isCustomDerby = derbyType === 'custom'

  const [taxPerFight, setTaxPerFight] = useState(
    () => event?.tax_per_fight ?? defaultTaxPerFight(event?.event_type ?? 'derby')
  )
  const [taxCommission, setTaxCommission] = useState(() => event?.tax_commission ?? 0)
  const [taxManuallySet, setTaxManuallySet] = useState(() => event != null)
  const [physicalInspectionRequired, setPhysicalInspectionRequired] = useState(
    () => event?.physical_inspection_required ?? false
  )
  const [revolvingFundInitial, setRevolvingFundInitial] = useState(
    () => event?.revolving_fund_initial ?? 0
  )
  const [cashierOpeningFloatDefault, setCashierOpeningFloatDefault] = useState(
    () =>
      event?.cashier_opening_float_default ??
      event?.revolving_fund_initial ??
      0
  )

  const [prizeType, setPrizeType] = useState<PrizeType>(
    () => buildInitialPrizeState(event).prizeType
  )
  const [prizeConfig, setPrizeConfig] = useState<PrizeConfigEntry[]>(
    () => buildInitialPrizeState(event).config
  )

  const [registrationFeeEnabled, setRegistrationFeeEnabled] = useState(
    () => event?.registration_fee_enabled ?? false
  )
  const [roosterEntryFeeEnabled, setRoosterEntryFeeEnabled] = useState(
    () => event?.rooster_entry_fee_enabled ?? false
  )
  const [cashBondEnabled, setCashBondEnabled] = useState(
    () => event?.cash_bond_enabled ?? false
  )

  const prizeStructureJson = useMemo(
    () => JSON.stringify(prizeConfig),
    [prizeConfig]
  )

  const presetCocks =
    derbyType !== 'custom' ? COCKS_PER_ENTRY_BY_DERBY_TYPE[derbyType] : null

  const nextStatuses = event ? getNextStatuses(event.status) : []

  function handleEventTypeChange(nextType: EventType) {
    setEventType(nextType)
    if (!taxManuallySet) {
      setTaxPerFight(defaultTaxPerFight(nextType))
    }
  }

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
    <PageStack>
      <PageHeader
        title={mode === 'create' ? 'New event' : 'Edit event'}
        description={
          event
            ? event.name
            : 'Configure event details and prize structure.'
        }
        actions={
          event ? (
            <Flex gap={2} wrap="wrap" align="center">
              <Badge>{EVENT_STATUS_LABELS[event.status]}</Badge>
              {event.is_active ? (
                <Badge colorPalette="blue">Active</Badge>
              ) : null}
            </Flex>
          ) : undefined
        }
      />

      {event && nextStatuses.length > 0 ? (
        <PanelCard title="Status">
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
        </PanelCard>
      ) : null}

      {event && canManage ? (
        <EventActiveControls
          eventId={event.id}
          eventName={event.name}
          status={event.status}
          isActive={event.is_active}
          blockingActiveEvent={blockingActiveEvent}
        />
      ) : null}

      <PanelCard>
        <form action={formAction}>
          <Stack gap={LAYOUT_GAP.form}>
            {event ? <input type="hidden" name="eventId" value={event.id} /> : null}
            <input type="hidden" name="eventType" value={eventType} />
            {isDerby ? (
              <>
                <input type="hidden" name="prizeType" value={prizeType} />
                <input type="hidden" name="prizeConfig" value={prizeStructureJson} />
                <input type="hidden" name="derbyType" value={derbyType} />
                <input type="hidden" name="derbyAgeType" value={derbyAgeType} />
              </>
            ) : null}
            {isClassic ? <input type="hidden" name="cocksPerEntry" value="1" /> : null}

            <FormField label="Event name" required>
              <Input name="name" defaultValue={event?.name ?? ''} required />
            </FormField>

            <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', md: 'row' }}>
              <FormField label="Event date" required flex="1">
                <Input
                  name="eventDate"
                  type="datetime-local"
                  defaultValue={toDatetimeLocalValue(event?.event_date)}
                  required
                />
              </FormField>
              <FormField
                label="Event type"
                flex="1"
                helpText={
                  isClassic
                    ? 'Single weight-matched bouts, one cock per entry.'
                    : 'Multi-cock tournament with cumulative scoring.'
                }
              >
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={eventType}
                    onChange={(e) => handleEventTypeChange(e.currentTarget.value as EventType)}
                  >
                    {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </FormField>
            </Flex>

            {isDerby ? (
              <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', md: 'row' }}>
                <FormField label="Derby format" flex="1">
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={derbyType}
                      onChange={(e) => setDerbyType(e.currentTarget.value as DerbyType)}
                    >
                      {Object.entries(DERBY_FORMAT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </FormField>
                <FormField label="Derby age profile" flex="1">
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={derbyAgeType}
                      onChange={(e) =>
                        setDerbyAgeType(e.currentTarget.value as DerbyAgeType)
                      }
                    >
                      {Object.entries(DERBY_AGE_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </FormField>
              </Flex>
            ) : null}

            <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', md: 'row' }}>
              <FormField
                label="Tax per fight"
                flex="1"
                helpText="Regulatory or venue tax collected per fight."
              >
                <Input
                  name="taxPerFight"
                  type="number"
                  min={0}
                  step="0.01"
                  value={taxPerFight}
                  onChange={(event) => {
                    setTaxManuallySet(true)
                    setTaxPerFight(Number(event.target.value) || 0)
                  }}
                />
              </FormField>
              <FormField
                label="Tax commission"
                flex="1"
                helpText="Management or montón share collected per fight."
              >
                <Input
                  name="taxCommission"
                  type="number"
                  min={0}
                  step="0.01"
                  value={taxCommission}
                  onChange={(event) => setTaxCommission(Number(event.target.value) || 0)}
                />
              </FormField>
            </Flex>

            <Box borderWidth="1px" borderColor="border" rounded="md" p={4}>
              <Flex justify="space-between" align="flex-start" gap={4}>
                <Box flex="1">
                  <Text fontWeight="medium" fontSize="sm">
                    Physical inspection required
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    Roosters must pass inspection before matching. Shows the Inspection tab when
                    enabled.
                  </Text>
                </Box>
                <Switch.Root
                  checked={physicalInspectionRequired}
                  onCheckedChange={(details) => setPhysicalInspectionRequired(details.checked)}
                >
                  <Switch.HiddenInput name="physicalInspectionRequired" />
                  <Switch.Control />
                </Switch.Root>
              </Flex>
            </Box>

            <FormField
              label="Revolving fund (initial)"
              helpText={
                mode === 'create'
                  ? 'Opening balance for this event. Adjustments are recorded on the Revolving fund tab.'
                  : 'Initial amount set at creation. Use the Revolving fund tab for adjustments.'
              }
            >
              <Input
                name="revolvingFundInitial"
                type="number"
                min={0}
                step="0.01"
                value={revolvingFundInitial}
                onChange={(event) =>
                  setRevolvingFundInitial(Number(event.target.value) || 0)
                }
                readOnly={mode === 'edit'}
              />
            </FormField>

            <FormField
              label="Default cashier opening float"
              helpText="Pre-filled when staff open the Cashier Terminal. They can adjust with a note."
            >
              <Input
                name="cashierOpeningFloatDefault"
                type="number"
                min={0}
                step="0.01"
                value={cashierOpeningFloatDefault}
                onChange={(event) =>
                  setCashierOpeningFloatDefault(Number(event.target.value) || 0)
                }
              />
            </FormField>

            {isDerby ? (
              <>
                <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', md: 'row' }}>
                  <FormField label="Registration deadline" flex="1">
                    <Input
                      name="registrationDeadline"
                      type="datetime-local"
                      defaultValue={toDatetimeLocalValue(event?.registration_deadline)}
                    />
                  </FormField>
                  <FormField label="Promoter" flex="1">
                    <Flex gap={2} align="flex-end" direction={{ base: 'column', sm: 'row' }}>
                      <NativeSelect.Root flex="1">
                        <NativeSelect.Field
                          name="promoterId"
                          value={promoterId}
                          onChange={(event) => setPromoterId(event.currentTarget.value)}
                        >
                          <option value="">None</option>
                          {promoters.map((promoter) => (
                            <option key={promoter.id} value={promoter.id}>
                              {promoter.name}
                            </option>
                          ))}
                        </NativeSelect.Field>
                      </NativeSelect.Root>
                      <PromoterQuickAddDialog
                        onCreated={(promoter) => {
                          setPromoters((current) => [...current, promoter])
                          setPromoterId(promoter.id)
                          router.refresh()
                        }}
                      />
                    </Flex>
                  </FormField>
                </Flex>

                <Stack gap={LAYOUT_GAP.form}>
                  <Text fontWeight="semibold" fontSize="sm">
                    Derby fees
                  </Text>
                  <Box borderWidth="1px" borderColor="border" rounded="md" p={4}>
                    <Flex justify="space-between" align="flex-start" gap={4} mb={registrationFeeEnabled ? 3 : 0}>
                      <Box flex="1">
                        <Text fontWeight="medium" fontSize="sm">
                          Registration fee (per owner)
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          Charge when an owner or game farm is registered.
                        </Text>
                      </Box>
                      <Switch.Root
                        checked={registrationFeeEnabled}
                        onCheckedChange={(details) => setRegistrationFeeEnabled(details.checked)}
                      >
                        <Switch.HiddenInput name="registrationFeeEnabled" />
                        <Switch.Control />
                      </Switch.Root>
                    </Flex>
                    {registrationFeeEnabled ? (
                      <FormField label="Amount">
                        <Input
                          name="registrationFeeAmount"
                          type="number"
                          min={0}
                          step="0.01"
                          defaultValue={event?.registration_fee_amount ?? event?.entry_fee ?? 0}
                        />
                      </FormField>
                    ) : (
                      <input type="hidden" name="registrationFeeAmount" value="0" />
                    )}
                  </Box>
                  <Box borderWidth="1px" borderColor="border" rounded="md" p={4}>
                    <Flex justify="space-between" align="flex-start" gap={4} mb={roosterEntryFeeEnabled ? 3 : 0}>
                      <Box flex="1">
                        <Text fontWeight="medium" fontSize="sm">
                          Entry fee (per rooster)
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          Charge for each cock added to an entry.
                        </Text>
                      </Box>
                      <Switch.Root
                        checked={roosterEntryFeeEnabled}
                        onCheckedChange={(details) => setRoosterEntryFeeEnabled(details.checked)}
                      >
                        <Switch.HiddenInput name="roosterEntryFeeEnabled" />
                        <Switch.Control />
                      </Switch.Root>
                    </Flex>
                    {roosterEntryFeeEnabled ? (
                      <FormField label="Amount">
                        <Input
                          name="roosterEntryFeeAmount"
                          type="number"
                          min={0}
                          step="0.01"
                          defaultValue={event?.rooster_entry_fee_amount ?? 0}
                        />
                      </FormField>
                    ) : (
                      <input type="hidden" name="roosterEntryFeeAmount" value="0" />
                    )}
                  </Box>
                  <Box borderWidth="1px" borderColor="border" rounded="md" p={4}>
                    <Flex justify="space-between" align="flex-start" gap={4} mb={cashBondEnabled ? 3 : 0}>
                      <Box flex="1">
                        <Text fontWeight="medium" fontSize="sm">
                          Cash bond (per entry)
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          Default bond amount collected per entry.
                        </Text>
                      </Box>
                      <Switch.Root
                        checked={cashBondEnabled}
                        onCheckedChange={(details) => setCashBondEnabled(details.checked)}
                      >
                        <Switch.HiddenInput name="cashBondEnabled" />
                        <Switch.Control />
                      </Switch.Root>
                    </Flex>
                    {cashBondEnabled ? (
                      <FormField label="Default amount">
                        <Input
                          name="cashBondAmount"
                          type="number"
                          min={0}
                          step="0.01"
                          defaultValue={event?.cash_bond_amount ?? 0}
                        />
                      </FormField>
                    ) : (
                      <input type="hidden" name="cashBondAmount" value="0" />
                    )}
                  </Box>
                  <input type="hidden" name="entryFee" value={event?.entry_fee ?? 0} />
                </Stack>

                <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', md: 'row' }}>
                  {isCustomDerby ? (
                    <FormField label="Cocks per entry" flex="1">
                      <Input
                        name="cocksPerEntry"
                        type="number"
                        min={1}
                        defaultValue={event?.cocks_per_entry ?? 2}
                      />
                    </FormField>
                  ) : (
                    <>
                      <input type="hidden" name="cocksPerEntry" value={presetCocks ?? 2} />
                      <FormField label="Cocks per entry" flex="1">
                        <Text fontSize="sm" color="fg.muted" pt={2}>
                          {presetCocks} cocks per entry (from derby format)
                        </Text>
                      </FormField>
                    </>
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
                          minW={{ sm: '10rem' }}
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

                <FormField
                  label="Registration rules"
                  helpText="Supports headings, bold, italic, lists, links, blockquotes, and strikethrough."
                >
                  <RichTextEditor
                    name="registrationRules"
                    defaultValue={event?.registration_rules}
                  />
                </FormField>

                {mode === 'create' && canManageEligibility ? (
                  <Box>
                    <Text fontSize="sm" color="fg.muted" mb={3}>
                      Eligibility rules are optional; leave fields disabled to skip enforcement.
                    </Text>
                    <DerbyEligibilityConfigPanel
                      mode="embedded"
                      canManage={canManageEligibility}
                      eligibilityEnforcementEnabled={false}
                      policy={null}
                    />
                  </Box>
                ) : null}
              </>
            ) : null}

            <FormField label="Notes">
              <Textarea name="notes" rows={3} defaultValue={event?.notes ?? ''} />
            </FormField>

            <ButtonGroup wrap="wrap">
              <Button type="submit" loading={pending}>
                {mode === 'create' ? 'Create event' : 'Save changes'}
              </Button>
              <Button asChild variant="outline">
                <Link href={event ? `/dashboard/events/${event.id}` : '/dashboard/events'}>
                  Cancel
                </Link>
              </Button>
            </ButtonGroup>

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
          </Stack>
        </form>
      </PanelCard>

      {mode === 'edit' && isDerby && event ? (
        <DerbyEligibilityConfigPanel
          mode="standalone"
          eventId={event.id}
          canManage={canManageEligibility}
          eligibilityEnforcementEnabled={event.eligibility_enforcement_enabled}
          policy={eligibilityPolicy}
        />
      ) : null}
    </PageStack>
  )
}
