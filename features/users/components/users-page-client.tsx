'use client'

import { Badge, Box, Button, Flex, Input, NativeSelect, Stack, Text } from '@chakra-ui/react'
import { useActionState, useState } from 'react'

import { LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import {
  deactivateUserAction,
  inviteUserAction,
  updateUserModulesAction,
  updateUserRoleAction,
  type ActionState,
} from '@/features/users/actions'
import { ROLE_LABELS, type UsersManageableRole } from '@/features/users/schema'
import { ACCESS_MODULES } from '@/lib/auth/modules'
import type { AccessModuleId } from '@/lib/auth/modules'
import type { AppRole } from '@/lib/auth/types'
import Link from 'next/link'

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

function defaultRoleForUpdate(user: UserRow): UsersManageableRole {
  if (user.role === 'staff' || user.role === 'event_organizer' || user.role === 'system_owner') {
    return user.role
  }
  return 'staff'
}

function ModuleCheckboxGrid({
  defaultSelected = [],
}: {
  defaultSelected?: AccessModuleId[]
}) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" mb={2}>
        Module access
      </Text>
      <Flex direction="column" gap={2}>
        {ACCESS_MODULES.map((mod) => (
          <Flex key={mod.id} align="center" gap={2}>
            <input
              type="checkbox"
              id={`module-${mod.id}`}
              name="modules"
              value={mod.id}
              defaultChecked={defaultSelected.includes(mod.id)}
            />
            <label htmlFor={`module-${mod.id}`}>
              <Text fontSize="sm">{mod.label}</Text>
            </label>
          </Flex>
        ))}
      </Flex>
    </Box>
  )
}

export function UsersPageClient({ users }: { users: UserRow[] }) {
  const [inviteRole, setInviteRole] = useState<UsersManageableRole>('staff')
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

  return (
    <PageStack>
      <PageHeader
        title="Users"
        description="Manage staff accounts, roles, and module access."
      />

      <PanelCard title="Invite user">
        <form action={inviteAction}>
          <Stack gap={LAYOUT_GAP.form} maxW="md">
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="password" type="password" placeholder="Password" required />
            <Input name="displayName" placeholder="Display name" />
            <NativeSelect.Root>
              <NativeSelect.Field
                name="role"
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.currentTarget.value as UsersManageableRole)
                }
              >
                {manageableRoles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            {inviteRole === 'staff' ? (
              <ModuleCheckboxGrid />
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
          display={{ base: 'none', md: 'flex' }}
        >
          <Box flex="2">User</Box>
          <Box flex="1">Role</Box>
          <Box flex="1">Status</Box>
          <Box flex="2">Actions</Box>
        </Flex>
        {users.map((user) => (
          <Flex
            key={user.id}
            px={4}
            py={3}
            borderBottomWidth="1px"
            borderColor="border"
            direction={{ base: 'column', md: 'row' }}
            gap={2}
            align={{ md: 'center' }}
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
              {user.role === 'staff' && user.modules.length > 0 ? (
                <Flex gap={1} wrap="wrap" mt={1}>
                  {user.modules.map((moduleId) => (
                    <Badge key={moduleId} size="sm" variant="subtle">
                      {ACCESS_MODULES.find((mod) => mod.id === moduleId)?.label ??
                        moduleId}
                    </Badge>
                  ))}
                </Flex>
              ) : null}
            </Box>
            <Box flex="1">
              <Badge>{ROLE_LABELS[user.role]}</Badge>
            </Box>
            <Box flex="1">
              <Badge colorPalette={user.is_active ? 'green' : 'red'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </Box>
            <Box flex="2">
              {user.is_active ? (
                <Stack gap={LAYOUT_GAP.form}>
                  <form action={roleAction} className="flex gap-2 items-center flex-wrap">
                    <input type="hidden" name="userId" value={user.id} />
                    <NativeSelect.Root size="sm">
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
                    <Button type="submit" size="sm" loading={rolePending}>
                      Update role
                    </Button>
                  </form>
                  {user.role === 'staff' ? (
                    <form action={modulesAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <ModuleCheckboxGrid defaultSelected={user.modules} />
                      <Button
                        type="submit"
                        size="sm"
                        loading={modulesPending}
                        mt={2}
                      >
                        Update modules
                      </Button>
                    </form>
                  ) : null}
                  <form action={deactivateAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="reason" value="Deactivated by admin" />
                    <Button type="submit" size="sm" variant="outline" colorPalette="red">
                      Deactivate
                    </Button>
                  </form>
                </Stack>
              ) : null}
            </Box>
          </Flex>
        ))}
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
    </PageStack>
  )
}
