'use client'

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState, useState } from 'react'

import { ButtonGroup, FormField, LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import {
  changePromoterStatusAction,
  createPromoterAction,
  linkPromoterUserAction,
  updatePromoterAction,
  type PromoterActionState,
} from '@/features/promoters/actions'
import {
  COMMISSION_TYPE_LABELS,
  PROMOTER_STATUS_LABELS,
} from '@/features/promoters/schema'
import type {
  CommissionType,
  Promoter,
  PromoterEventHistoryItem,
  PromoterStatus,
} from '@/features/promoters/types'

const initialState: PromoterActionState = {}

const commissionTypes = Object.entries(COMMISSION_TYPE_LABELS) as Array<
  [CommissionType, string]
>

const promoterStatuses = Object.entries(PROMOTER_STATUS_LABELS) as Array<
  [PromoterStatus, string]
>

type PromoterFormClientProps =
  | { mode: 'create' }
  | {
      mode: 'edit'
      promoter: Promoter
      eventHistory?: PromoterEventHistoryItem[]
    }

export function PromoterFormClient(props: PromoterFormClientProps) {
  const isCreate = props.mode === 'create'
  const promoter = props.mode === 'edit' ? props.promoter : null
  const eventHistory = props.mode === 'edit' ? (props.eventHistory ?? []) : []

  const [giveLoginAccess, setGiveLoginAccess] = useState(false)
  const [commissionType, setCommissionType] = useState<CommissionType>(
    promoter?.commission_type ?? 'none'
  )

  const [createState, createAction, createPending] = useActionState(
    createPromoterAction,
    initialState
  )
  const [updateState, updateAction, updatePending] = useActionState(
    updatePromoterAction,
    initialState
  )
  const [statusState, statusAction, statusPending] = useActionState(
    changePromoterStatusAction,
    initialState
  )
  const [linkState, linkAction, linkPending] = useActionState(
    linkPromoterUserAction,
    initialState
  )

  const state = isCreate ? createState : updateState
  const action = isCreate ? createAction : updateAction
  const pending = isCreate ? createPending : updatePending

  const showCommissionValue =
    commissionType === 'fixed' || commissionType === 'percentage'

  return (
    <PageStack maxW="2xl">
      <PageHeader
        title={isCreate ? 'Add promoter' : promoter?.name ?? 'Edit promoter'}
        description={
          isCreate
            ? 'Create a promoter profile and optionally grant dashboard login access.'
            : 'Update promoter details, commission, and status.'
        }
      />

      <PanelCard>
        <form action={action}>
          {promoter ? (
            <input type="hidden" name="promoterId" value={promoter.id} />
          ) : null}
          <Stack gap={LAYOUT_GAP.form}>
            <FormField label="Name" required>
              <Input
                name="name"
                defaultValue={promoter?.name ?? ''}
                required
              />
            </FormField>
            <FormField label="Contact person">
              <Input
                name="contactPerson"
                defaultValue={promoter?.contact_person ?? ''}
              />
            </FormField>
            <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', md: 'row' }}>
              <FormField label="Email" flex="1">
                <Input
                  name="email"
                  type="email"
                  defaultValue={promoter?.email ?? ''}
                />
              </FormField>
              <FormField label="Phone" flex="1">
                <Input name="phone" defaultValue={promoter?.phone ?? ''} />
              </FormField>
            </Flex>
            <FormField label="Address">
              <Textarea
                name="address"
                rows={2}
                defaultValue={promoter?.address ?? ''}
              />
            </FormField>
            <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', md: 'row' }}>
              <FormField label="Commission type" flex="1">
                <NativeSelect.Root>
                  <NativeSelect.Field
                    name="commissionType"
                    value={commissionType}
                    onChange={(event) =>
                      setCommissionType(event.currentTarget.value as CommissionType)
                    }
                  >
                    {commissionTypes.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </FormField>
              {showCommissionValue ? (
                <FormField label="Commission value" flex="1">
                  <Input
                    name="commissionValue"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={promoter?.commission_value ?? ''}
                  />
                </FormField>
              ) : null}
            </Flex>
            {!isCreate ? (
              <FormField label="Status">
                <NativeSelect.Root>
                  <NativeSelect.Field
                    name="status"
                    defaultValue={promoter?.status ?? 'active'}
                  >
                    {promoterStatuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </FormField>
            ) : null}
            <FormField label="Notes">
              <Textarea name="notes" rows={3} defaultValue={promoter?.notes ?? ''} />
            </FormField>

            {isCreate ? (
              <Box borderTopWidth="1px" borderColor="border" pt={4}>
                <Checkbox.Root
                  checked={giveLoginAccess}
                  onCheckedChange={(details) =>
                    setGiveLoginAccess(details.checked === true)
                  }
                >
                  <Checkbox.Control />
                  <Checkbox.Label>
                    Give this promoter portal login access
                  </Checkbox.Label>
                </Checkbox.Root>
                {giveLoginAccess ? (
                  <input type="hidden" name="giveLoginAccess" value="on" />
                ) : null}
                {giveLoginAccess ? (
                  <Stack gap={LAYOUT_GAP.form} mt={4}>
                    <FormField label="Login email" required>
                      <Input name="loginEmail" type="email" required />
                    </FormField>
                    <FormField label="Temporary password" required>
                      <Input name="loginPassword" type="password" required />
                    </FormField>
                  </Stack>
                ) : null}
              </Box>
            ) : null}

            <ButtonGroup>
              <Button type="submit" loading={pending}>
                {isCreate ? 'Create promoter' : 'Save changes'}
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/promoters">Back to list</Link>
              </Button>
            </ButtonGroup>

            {state.error ? (
              <Text color="fg.error" fontSize="sm">
                {state.error}
              </Text>
            ) : null}
            {state.success ? (
              <Text color="fg.success" fontSize="sm">
                {state.success}
              </Text>
            ) : null}
          </Stack>
        </form>
      </PanelCard>

      {!isCreate && promoter && !promoter.user_id ? (
        <PanelCard title="Grant login access">
          <Text fontSize="sm" color="fg.muted" mb={4}>
            This promoter does not have a linked account yet.
          </Text>
          <form action={linkAction}>
            <input type="hidden" name="promoterId" value={promoter.id} />
            <Stack gap={LAYOUT_GAP.form} maxW="md">
              <FormField label="Login email" required>
                <Input name="loginEmail" type="email" required />
              </FormField>
              <FormField label="Temporary password" required>
                <Input name="loginPassword" type="password" required />
              </FormField>
              <Button type="submit" loading={linkPending} alignSelf="flex-start">
                Create login account
              </Button>
              {linkState.error ? (
                <Text color="fg.error" fontSize="sm">
                  {linkState.error}
                </Text>
              ) : null}
              {linkState.success ? (
                <Text color="fg.success" fontSize="sm">
                  {linkState.success}
                </Text>
              ) : null}
            </Stack>
          </form>
        </PanelCard>
      ) : null}

      {!isCreate && promoter?.user_id ? (
        <PanelCard>
          <Badge colorPalette="green">Login access enabled</Badge>
        </PanelCard>
      ) : null}

      {!isCreate ? (
        <PanelCard title="Quick status change">
          <form action={statusAction}>
            <input type="hidden" name="promoterId" value={promoter?.id ?? ''} />
            <Flex gap={LAYOUT_GAP.form} wrap="wrap" align="flex-end">
              <FormField label="New status" minW="48">
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field name="status" defaultValue={promoter?.status}>
                    {promoterStatuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </FormField>
              <FormField label="Reason (optional)" flex="1" minW="48">
                <Input name="reason" placeholder="Reason for status change" />
              </FormField>
              <Button type="submit" size="sm" loading={statusPending}>
                Update status
              </Button>
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
          </form>
        </PanelCard>
      ) : null}

      {!isCreate && eventHistory.length > 0 ? (
        <PanelCard flush title="Event history">
          {eventHistory.map((event) => (
            <Flex
              key={event.id}
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor="border"
              direction={{ base: 'column', md: 'row' }}
              gap={2}
            >
              <Box flex="2">
                <Text fontWeight="medium">{event.name}</Text>
                <Text fontSize="sm" color="fg.muted">
                  {event.venue}
                </Text>
              </Box>
              <Box flex="1">
                <Text fontSize="sm">
                  {new Date(event.event_date).toLocaleDateString()}
                </Text>
              </Box>
              <Box flex="1">
                <Badge>{event.status}</Badge>
              </Box>
            </Flex>
          ))}
        </PanelCard>
      ) : null}
    </PageStack>
  )
}
