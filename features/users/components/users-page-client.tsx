'use client'

import { Badge, Box, Button, Flex, Input, NativeSelect, Text } from '@chakra-ui/react'
import { useActionState } from 'react'

import {
  deactivateUserAction,
  inviteUserAction,
  updateUserRoleAction,
  type ActionState,
} from '@/features/users/actions'
import { ROLE_LABELS } from '@/features/users/schema'
import type { AppRole } from '@/lib/auth/types'

type UserRow = {
  id: string
  email: string | null
  role: AppRole
  display_name: string | null
  is_active: boolean
  created_at: string
}

const initialState: ActionState = {}

const staffRoles = Object.entries(ROLE_LABELS).filter(
  ([role]) => role !== 'admin' && role !== 'public_viewer'
)

export function UsersPageClient({ users }: { users: UserRow[] }) {
  const [inviteState, inviteAction, invitePending] = useActionState(
    inviteUserAction,
    initialState
  )
  const [roleState, roleAction, rolePending] = useActionState(
    updateUserRoleAction,
    initialState
  )
  const [, deactivateAction] = useActionState(deactivateUserAction, initialState)

  return (
    <Box className="space-y-8">
      <Box>
        <Text fontSize="2xl" fontWeight="semibold">
          Users
        </Text>
        <Text color="fg.muted">Manage staff accounts and roles.</Text>
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" p={4}>
        <Text fontWeight="medium" mb={4}>
          Invite user
        </Text>
        <form action={inviteAction}>
          <Flex direction="column" gap={3} maxW="md">
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="password" type="password" placeholder="Password" required />
            <Input name="displayName" placeholder="Display name" />
            <NativeSelect.Root>
              <NativeSelect.Field name="role" defaultValue="event_organizer">
                {staffRoles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
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
          </Flex>
        </form>
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
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
                <Flex gap={2} wrap="wrap">
                  <form action={roleAction} className="flex gap-2 items-center">
                    <input type="hidden" name="userId" value={user.id} />
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field name="role" defaultValue={user.role}>
                        {staffRoles.map(([value, label]) => (
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
                  <form action={deactivateAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="reason" value="Deactivated by admin" />
                    <Button type="submit" size="sm" variant="outline" colorPalette="red">
                      Deactivate
                    </Button>
                  </form>
                </Flex>
              ) : null}
            </Box>
          </Flex>
        ))}
      </Box>

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
    </Box>
  )
}
