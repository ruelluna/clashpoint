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
import { useActionState, useState } from 'react'

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
    <Box className="space-y-8">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          {isCreate ? 'Add promoter' : promoter?.name}
        </Text>
        <Text color="fg.muted">
          {isCreate
            ? 'Create a promoter profile and optionally grant dashboard login access.'
            : 'Update promoter details, commission, and status.'}
        </Text>
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" p={4} maxW="2xl">
        <form action={action}>
          {promoter ? (
            <input type="hidden" name="promoterId" value={promoter.id} />
          ) : null}
          <Flex direction="column" gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Name
              </Text>
              <Input
                name="name"
                defaultValue={promoter?.name ?? ''}
                required
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Contact person
              </Text>
              <Input
                name="contactPerson"
                defaultValue={promoter?.contact_person ?? ''}
              />
            </Box>
            <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Email
                </Text>
                <Input
                  name="email"
                  type="email"
                  defaultValue={promoter?.email ?? ''}
                />
              </Box>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Phone
                </Text>
                <Input name="phone" defaultValue={promoter?.phone ?? ''} />
              </Box>
            </Flex>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Address
              </Text>
              <Textarea
                name="address"
                rows={2}
                defaultValue={promoter?.address ?? ''}
              />
            </Box>
            <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Commission type
                </Text>
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
              </Box>
              {showCommissionValue ? (
                <Box flex="1">
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Commission value
                  </Text>
                  <Input
                    name="commissionValue"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={promoter?.commission_value ?? ''}
                  />
                </Box>
              ) : null}
            </Flex>
            {!isCreate ? (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Status
                </Text>
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
              </Box>
            ) : null}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Notes
              </Text>
              <Textarea name="notes" rows={3} defaultValue={promoter?.notes ?? ''} />
            </Box>

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
                    Give this promoter login access
                  </Checkbox.Label>
                </Checkbox.Root>
                {giveLoginAccess ? (
                  <input type="hidden" name="giveLoginAccess" value="on" />
                ) : null}
                {giveLoginAccess ? (
                  <Flex direction="column" gap={3} mt={4}>
                    <Input
                      name="loginEmail"
                      type="email"
                      placeholder="Login email"
                      required
                    />
                    <Input
                      name="loginPassword"
                      type="password"
                      placeholder="Temporary password"
                      required
                    />
                  </Flex>
                ) : null}
              </Box>
            ) : null}

            <Flex gap={3}>
              <Button type="submit" loading={pending}>
                {isCreate ? 'Create promoter' : 'Save changes'}
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/promoters">Back to list</Link>
              </Button>
            </Flex>

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
          </Flex>
        </form>
      </Box>

      {!isCreate && promoter && !promoter.user_id ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4} maxW="2xl">
          <Text fontWeight="medium" mb={1}>
            Grant login access
          </Text>
          <Text fontSize="sm" color="fg.muted" mb={4}>
            This promoter does not have a linked account yet.
          </Text>
          <form action={linkAction}>
            <input type="hidden" name="promoterId" value={promoter.id} />
            <Flex direction="column" gap={3} maxW="md">
              <Input name="loginEmail" type="email" placeholder="Login email" required />
              <Input
                name="loginPassword"
                type="password"
                placeholder="Temporary password"
                required
              />
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
            </Flex>
          </form>
        </Box>
      ) : null}

      {!isCreate && promoter?.user_id ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4} maxW="2xl">
          <Badge colorPalette="green">Login access enabled</Badge>
        </Box>
      ) : null}

      {!isCreate ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" p={4} maxW="2xl">
          <Text fontWeight="medium" mb={4}>
            Quick status change
          </Text>
          <form action={statusAction}>
            <input type="hidden" name="promoterId" value={promoter?.id ?? ''} />
            <Flex gap={3} wrap="wrap" align="flex-end">
              <Box minW="48">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  New status
                </Text>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field name="status" defaultValue={promoter?.status}>
                    {promoterStatuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Box>
              <Box flex="1" minW="48">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Reason (optional)
                </Text>
                <Input name="reason" placeholder="Reason for status change" />
              </Box>
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
        </Box>
      ) : null}

      {!isCreate && eventHistory.length > 0 ? (
        <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
          <Box px={4} py={3} borderBottomWidth="1px" borderColor="border">
            <Text fontWeight="medium">Event history</Text>
          </Box>
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
        </Box>
      ) : null}
    </Box>
  )
}
