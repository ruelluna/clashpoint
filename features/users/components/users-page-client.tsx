'use client'

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'

import {
  ButtonGroup,
  DetailFieldRow,
  LAYOUT_GAP,
  FormField,
  PageHeader,
  PageStack,
  PanelCard,
} from '@/components/dashboard'
import {
  deactivateUserAction,
  inviteUserAction,
  reactivateUserAction,
  updateUserModulesAction,
  updateUserRoleAction,
  type ActionState,
} from '@/features/users/actions'
import { ROLE_LABELS, type UsersManageableRole } from '@/features/users/schema'
import { ACCESS_MODULES } from '@/lib/auth/modules'
import type { AccessModuleId } from '@/lib/auth/modules'
import type { AppRole } from '@/lib/auth/types'

type UserRow = {
  id: string
  email: string | null
  role: AppRole
  display_name: string | null
  is_active: boolean
  created_at: string
  modules: AccessModuleId[]
}

const initialState: ActionState = {}

const manageableRoles = (
  Object.entries(ROLE_LABELS) as [AppRole, string][]
).filter(([role]) => role !== 'admin' && role !== 'promoter')

const invitableRoles = manageableRoles

const actionButtonSize = { base: 'md' as const, lg: 'sm' as const }

function defaultRoleForUpdate(user: UserRow): UsersManageableRole {
  if (user.role === 'staff' || user.role === 'event_organizer' || user.role === 'system_owner') {
    return user.role
  }
  return 'staff'
}

function ModuleCheckboxGrid({
  idPrefix,
  defaultSelected = [],
}: {
  idPrefix: string
  defaultSelected?: AccessModuleId[]
}) {
  return (
    <FormField label="Module access">
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={2}>
        {ACCESS_MODULES.map((mod) => (
          <Checkbox.Root
            key={mod.id}
            id={`${idPrefix}-module-${mod.id}`}
            defaultChecked={defaultSelected.includes(mod.id)}
          >
            <Checkbox.HiddenInput name="modules" value={mod.id} />
            <Checkbox.Control />
            <Checkbox.Label fontSize="sm">{mod.label}</Checkbox.Label>
          </Checkbox.Root>
        ))}
      </SimpleGrid>
    </FormField>
  )
}

export function UsersPageClient({ users }: { users: UserRow[] }) {
  const [inviteRole, setInviteRole] = useState<UsersManageableRole>('staff')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [inviteState, inviteAction, invitePending] = useActionState(
    inviteUserAction,
    initialState
  )
  const [roleState, roleAction, rolePending] = useActionState(
    updateUserRoleAction,
    initialState
  )
  const [modulesState, modulesAction, modulesPending] = useActionState(
    updateUserModulesAction,
    initialState
  )
  const [, deactivateAction] = useActionState(deactivateUserAction, initialState)
  const [reactivateState, reactivateAction, reactivatePending] = useActionState(
    reactivateUserAction,
    initialState
  )

  useEffect(() => {
    if (roleState.success || modulesState.success) {
      setEditingUserId(null)
    }
  }, [roleState.success, modulesState.success])

  return (
    <PageStack>
      <PageHeader
        title="Users"
        description="Manage staff accounts, roles, and module access."
      />

      <PanelCard title="Invite user">
        <form action={inviteAction}>
          <Stack gap={LAYOUT_GAP.form} maxW={inviteRole === 'staff' ? '3xl' : 'md'}>
            <FormField label="Email" required>
              <Input name="email" type="email" required />
            </FormField>
            <FormField label="Password" required>
              <Input name="password" type="password" required />
            </FormField>
            <FormField label="Display name">
              <Input name="displayName" />
            </FormField>
            <FormField label="Role" required>
              <NativeSelect.Root>
                <NativeSelect.Field
                  name="role"
                  value={inviteRole}
                  onChange={(event) =>
                    setInviteRole(event.currentTarget.value as UsersManageableRole)
                  }
                >
                  {invitableRoles.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
            {inviteRole === 'staff' ? (
              <ModuleCheckboxGrid idPrefix="invite" />
            ) : (
              <Text fontSize="sm" color="fg.muted">
                {inviteRole === 'event_organizer'
                  ? 'Event organizers receive the full operational module preset.'
                  : 'System owners receive full platform access.'}
              </Text>
            )}
            <Button type="submit" loading={invitePending} alignSelf="flex-start">
              Invite
            </Button>
            {inviteState.error ? (
              <Text color="fg.error" fontSize="sm">
                {inviteState.error}
              </Text>
            ) : null}
            {inviteState.success ? (
              <Text color="fg.success" fontSize="sm">
                {inviteState.success}
              </Text>
            ) : null}
          </Stack>
        </form>
      </PanelCard>

      <PanelCard flush>
        <Flex
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor="border"
          fontWeight="medium"
          fontSize="sm"
          display={{ base: 'none', lg: 'flex' }}
        >
          <Box flex="2">User</Box>
          <Box flex="1">Role</Box>
          <Box flex="1">Status</Box>
          <Box flex="2">Actions</Box>
        </Flex>
        {users.map((user) => {
          const isEditing = editingUserId === user.id

          return (
            <Box
              key={user.id}
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor="border"
            >
              <Flex
                direction={{ base: 'column', lg: 'row' }}
                gap={2}
                align={{ lg: 'center' }}
              >
                <Box flex="2">
                  <Text fontWeight="medium">{user.display_name ?? '—'}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {user.email}
                  </Text>
                  {user.role === 'promoter' ? (
                    <Text fontSize="sm" color="fg.muted" mt={1}>
                      Promoter login —{' '}
                      <Link href="/dashboard/promoters">manage profile in Promoters</Link>.
                    </Text>
                  ) : null}
                </Box>

                <Box flex="1">
                  <Box display={{ base: 'block', lg: 'none' }}>
                    <DetailFieldRow label="Role">
                      <Badge>{ROLE_LABELS[user.role]}</Badge>
                    </DetailFieldRow>
                  </Box>
                  <Box display={{ base: 'none', lg: 'block' }}>
                    <Badge>{ROLE_LABELS[user.role]}</Badge>
                  </Box>
                </Box>

                <Box flex="1">
                  <Box display={{ base: 'block', lg: 'none' }}>
                    <DetailFieldRow label="Status">
                      <Badge colorPalette={user.is_active ? 'green' : 'red'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </DetailFieldRow>
                  </Box>
                  <Box display={{ base: 'none', lg: 'block' }}>
                    <Badge colorPalette={user.is_active ? 'green' : 'red'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Box>
                </Box>

                <Box flex="2">
                  {user.is_active && !isEditing ? (
                    <ButtonGroup justify={{ base: 'flex-start', lg: 'flex-end' }}>
                      <Button
                        type="button"
                        size={actionButtonSize}
                        variant="outline"
                        w={{ base: 'full', sm: 'auto' }}
                        onClick={() => setEditingUserId(user.id)}
                      >
                        Edit
                      </Button>
                      <form action={deactivateAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="reason" value="Deactivated by admin" />
                        <Button
                          type="submit"
                          size={actionButtonSize}
                          variant="outline"
                          colorPalette="red"
                          w={{ base: 'full', sm: 'auto' }}
                        >
                          Deactivate
                        </Button>
                      </form>
                    </ButtonGroup>
                  ) : null}
                  {!user.is_active ? (
                    <ButtonGroup justify={{ base: 'flex-start', lg: 'flex-end' }}>
                      <form action={reactivateAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input
                          type="hidden"
                          name="reason"
                          value="Reactivated by admin"
                        />
                        <Button
                          type="submit"
                          size={actionButtonSize}
                          colorPalette="green"
                          w={{ base: 'full', sm: 'auto' }}
                          loading={reactivatePending}
                        >
                          Activate
                        </Button>
                      </form>
                    </ButtonGroup>
                  ) : null}
                </Box>
              </Flex>

              {user.is_active && isEditing ? (
                <Stack
                  gap={LAYOUT_GAP.form}
                  mt={3}
                  borderWidth="1px"
                  borderColor="border"
                  rounded="md"
                  p={3}
                >
                  <form action={roleAction}>
                    <Stack gap={LAYOUT_GAP.form}>
                      <input type="hidden" name="userId" value={user.id} />
                      <FormField label="Role">
                        <Flex
                          gap={2}
                          direction={{ base: 'column', sm: 'row' }}
                          align={{ sm: 'center' }}
                          wrap="wrap"
                        >
                          <NativeSelect.Root size="sm" flex="1" minW={{ sm: '12rem' }}>
                            <NativeSelect.Field
                              name="role"
                              defaultValue={defaultRoleForUpdate(user)}
                            >
                              {manageableRoles.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                          <Button
                            type="submit"
                            size={actionButtonSize}
                            loading={rolePending}
                            alignSelf={{ base: 'stretch', sm: 'flex-start' }}
                          >
                            Update role
                          </Button>
                        </Flex>
                      </FormField>
                    </Stack>
                  </form>

                  {user.role === 'staff' ? (
                    <form action={modulesAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <ModuleCheckboxGrid
                        idPrefix={`user-${user.id}`}
                        defaultSelected={user.modules}
                      />
                      <Button
                        type="submit"
                        size={actionButtonSize}
                        loading={modulesPending}
                        mt={2}
                        w={{ base: 'full', sm: 'auto' }}
                      >
                        Update modules
                      </Button>
                    </form>
                  ) : null}

                  <ButtonGroup>
                    <Button
                      type="button"
                      size={actionButtonSize}
                      variant="ghost"
                      w={{ base: 'full', sm: 'auto' }}
                      onClick={() => setEditingUserId(null)}
                    >
                      Cancel
                    </Button>
                  </ButtonGroup>
                </Stack>
              ) : null}
            </Box>
          )
        })}
      </PanelCard>

      {roleState.error ? (
        <Text color="fg.error" fontSize="sm">
          {roleState.error}
        </Text>
      ) : null}
      {roleState.success ? (
        <Text color="fg.success" fontSize="sm">
          {roleState.success}
        </Text>
      ) : null}
      {modulesState.error ? (
        <Text color="fg.error" fontSize="sm">
          {modulesState.error}
        </Text>
      ) : null}
      {modulesState.success ? (
        <Text color="fg.success" fontSize="sm">
          {modulesState.success}
        </Text>
      ) : null}
      {reactivateState.error ? (
        <Text color="fg.error" fontSize="sm">
          {reactivateState.error}
        </Text>
      ) : null}
      {reactivateState.success ? (
        <Text color="fg.success" fontSize="sm">
          {reactivateState.success}
        </Text>
      ) : null}
    </PageStack>
  )
}
