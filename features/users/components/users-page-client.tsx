'use client'

import {
    Badge,
    Box,
    Button,
    Checkbox,
    CheckboxGroup,
    Dialog,
    Fieldset,
    Flex,
    Input,
    NativeSelect,
    Portal,
    SimpleGrid,
    Stack,
    Text,
} from '@chakra-ui/react'
import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'

import {
    ButtonGroup,
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
import { roleColorPalette } from '@/features/users/display-utils'
import type { AccessModuleId } from '@/lib/auth/modules'
import {
    getEventTabAccessModules,
    getPageAccessModules,
} from '@/lib/auth/module-ui-groups'
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

const userListGridProps = {
    columns: 4,
    gap: 3,
    alignItems: 'center' as const,
    templateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr)',
}

function defaultRoleForUpdate(user: UserRow): UsersManageableRole {
    if (user.role === 'staff' || user.role === 'event_organizer' || user.role === 'system_owner') {
        return user.role
    }
    return 'staff'
}

function ModuleCheckboxGrid({
    defaultSelected = [],
}: {
    idPrefix?: string
    defaultSelected?: AccessModuleId[]
}) {
    const pageModules = getPageAccessModules()
    const eventTabModules = getEventTabAccessModules()

    return (
        <Fieldset.Root>
            <CheckboxGroup name="modules" defaultValue={defaultSelected}>
                <Fieldset.Legend fontSize="sm" fontWeight="medium" mb={2}>
                    Module access
                </Fieldset.Legend>
                <Stack gap={4}>
                    <Stack gap={2}>
                        <Text fontSize="sm" fontWeight="medium">
                            Page access
                        </Text>
                        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={2}>
                            {pageModules.map((mod) => (
                                <Checkbox.Root key={mod.id} value={mod.id}>
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                    <Checkbox.Label fontSize="sm">{mod.label}</Checkbox.Label>
                                </Checkbox.Root>
                            ))}
                        </SimpleGrid>
                    </Stack>
                    <Stack gap={2}>
                        <Text fontSize="sm" fontWeight="medium">
                            Tab access
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                            Events page:
                        </Text>
                        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={2}>
                            {eventTabModules.map((mod) => (
                                <Checkbox.Root key={mod.id} value={mod.id}>
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                    <Checkbox.Label fontSize="sm">{mod.label}</Checkbox.Label>
                                </Checkbox.Root>
                            ))}
                        </SimpleGrid>
                    </Stack>
                </Stack>
            </CheckboxGroup>
        </Fieldset.Root>
    )
}

function InviteUserDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [inviteRole, setInviteRole] = useState<UsersManageableRole>('staff')
    const [formKey, setFormKey] = useState(0)
    const [inviteState, inviteAction, invitePending] = useActionState(
        inviteUserAction,
        initialState
    )

    useEffect(() => {
        if (inviteState.success) {
            onOpenChange(false)
        }
    }, [inviteState.success, onOpenChange])

    function handleOpenChange(nextOpen: boolean) {
        onOpenChange(nextOpen)
        if (!nextOpen) {
            setInviteRole('staff')
            setFormKey((key) => key + 1)
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={(details) => handleOpenChange(details.open)}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content maxW="2xl">
                        <form key={formKey} action={inviteAction}>
                            <Dialog.Header>
                                <Dialog.Title>Add user</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Stack gap={LAYOUT_GAP.form}>
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
                                                    setInviteRole(
                                                        event.currentTarget.value as UsersManageableRole
                                                    )
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
                                        <ModuleCheckboxGrid />
                                    ) : (
                                        <Text fontSize="sm" color="fg.muted">
                                            {inviteRole === 'event_organizer'
                                                ? 'Event organizers receive the full operational module preset.'
                                                : 'System owners receive full platform access.'}
                                        </Text>
                                    )}
                                    {inviteState.error ? (
                                        <Text color="fg.error" fontSize="sm">
                                            {inviteState.error}
                                        </Text>
                                    ) : null}
                                </Stack>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <ButtonGroup>
                                    <Dialog.ActionTrigger asChild>
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>
                                    </Dialog.ActionTrigger>
                                    <Button
                                        type="submit"
                                        loading={invitePending}
                                        size="md"
                                        data-testid="users-invite-button"
                                    >
                                        Invite user
                                    </Button>
                                </ButtonGroup>
                            </Dialog.Footer>
                        </form>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}

export function UsersPageClient({ users }: { users: UserRow[] }) {
    const [inviteOpen, setInviteOpen] = useState(false)
    const [editingUserId, setEditingUserId] = useState<string | null>(null)
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

            <Button
                variant="outline"
                size="md"
                alignSelf="flex-start"
                data-testid="users-add-toggle"
                onClick={() => setInviteOpen(true)}
            >
                Add user
            </Button>

            <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />

            <PanelCard flush>
                <Box overflowX="auto">
                    <SimpleGrid
                        {...userListGridProps}
                        px={4}
                        py={3}
                        borderBottomWidth="1px"
                        borderColor="border"
                        fontWeight="medium"
                        fontSize="sm"
                        color="fg.muted"
                        minW="36rem"
                    >
                        <Box>User info</Box>
                        <Box>Role</Box>
                        <Box>Status</Box>
                        <Box textAlign={{ md: 'end' }}>Actions</Box>
                    </SimpleGrid>
                    {users.map((user) => {
                        const isEditing = editingUserId === user.id

                        return (
                            <Box
                                key={user.id}
                                borderBottomWidth="1px"
                                borderColor="border"
                                minW="36rem"
                            >
                                <SimpleGrid {...userListGridProps} px={4} py={3}>
                                    <Box minW={0}>
                                        <Text fontWeight="semibold" truncate>
                                            {user.display_name ?? '—'}
                                        </Text>
                                        <Text fontSize="sm" color="fg.muted" truncate>
                                            {user.email}
                                        </Text>
                                        {user.role === 'promoter' ? (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                Promoter —{' '}
                                                <Link href="/dashboard/promoters">Promoters</Link>
                                            </Text>
                                        ) : null}
                                    </Box>

                                    <Box>
                                        <Badge size="sm" colorPalette={roleColorPalette(user.role)}>
                                            {ROLE_LABELS[user.role]}
                                        </Badge>
                                    </Box>

                                    <Box>
                                        <Badge
                                            size="sm"
                                            colorPalette={user.is_active ? 'green' : 'red'}
                                        >
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </Box>

                                    <Box justifySelf={{ md: 'end' }} w="full">
                                        {user.is_active && !isEditing ? (
                                            <ButtonGroup
                                                justify="flex-end"
                                                direction={{ base: 'column', sm: 'row' }}
                                            >
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    w={{ base: 'full', sm: 'auto' }}
                                                    onClick={() => setEditingUserId(user.id)}
                                                >
                                                    Edit
                                                </Button>
                                                <form action={deactivateAction}>
                                                    <input type="hidden" name="userId" value={user.id} />
                                                    <input
                                                        type="hidden"
                                                        name="reason"
                                                        value="Deactivated by admin"
                                                    />
                                                    <Button
                                                        type="submit"
                                                        size="sm"
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
                                            <form action={reactivateAction}>
                                                <input type="hidden" name="userId" value={user.id} />
                                                <input
                                                    type="hidden"
                                                    name="reason"
                                                    value="Reactivated by admin"
                                                />
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    variant="outline"
                                                    colorPalette="green"
                                                    w={{ base: 'full', sm: 'auto' }}
                                                    loading={reactivatePending}
                                                >
                                                    Activate
                                                </Button>
                                            </form>
                                        ) : null}
                                    </Box>
                                </SimpleGrid>

                                {user.is_active && isEditing ? (
                                    <Stack
                                        gap={LAYOUT_GAP.form}
                                        mx={4}
                                        mb={3}
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
                                                        size="sm"
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
                                                size="sm"
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
                                            size="sm"
                                            variant="outline"
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
                </Box>
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
