'use client'

import {
  Button,
  Dialog,
  Flex,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState, useState } from 'react'

import {
  ButtonGroup,
  LAYOUT_GAP,
  PageHeader,
  PageStack,
  PanelCard,
} from '@/components/dashboard'
import {
  createOwnerPageAction,
  deleteOwnerPageAction,
  updateOwnerPageAction,
  type CompetitorActionState,
} from '@/features/competitors/actions'
import { OwnerProfileFields } from '@/features/competitors/components/owner-profile-fields'
import type { CompetitorDetail } from '@/features/competitors/types'

const initialState: CompetitorActionState = {}

type OwnerFormClientProps =
  | { mode: 'create' }
  | { mode: 'edit'; owner: CompetitorDetail }

export function OwnerFormClient(props: OwnerFormClientProps) {
  const isCreate = props.mode === 'create'
  const owner = props.mode === 'edit' ? props.owner : null

  const [profile, setProfile] = useState({
    displayName: owner?.displayName ?? '',
    contactNumber: owner?.contactNumber ?? '',
    email: owner?.email ?? '',
    address: owner?.address ?? '',
    notes: owner?.notes ?? '',
  })
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [createState, createAction, createPending] = useActionState(
    createOwnerPageAction,
    initialState
  )
  const [updateState, updateAction, updatePending] = useActionState(
    updateOwnerPageAction,
    initialState
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteOwnerPageAction,
    initialState
  )

  const state = isCreate ? createState : updateState
  const action = isCreate ? createAction : updateAction
  const pending = isCreate ? createPending : updatePending

  return (
    <PageStack maxW="2xl">
      <PageHeader
        title={isCreate ? 'Add owner' : owner?.displayName ?? 'Edit owner'}
        description={
          isCreate
            ? 'Register an owner name or game farm for reuse when encoding entries.'
            : 'Update contact details for this saved owner or game farm.'
        }
      />

      <PanelCard>
        <form action={action}>
          <Stack gap={LAYOUT_GAP.form}>
            {!isCreate && owner ? (
              <input type="hidden" name="id" value={owner.id} />
            ) : null}

            <OwnerProfileFields
              values={profile}
              onChange={(values) =>
                setProfile({
                  displayName: values.displayName,
                  contactNumber: values.contactNumber ?? '',
                  email: values.email ?? '',
                  address: values.address ?? '',
                  notes: values.notes ?? '',
                })
              }
              showNotes
            />

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

            <ButtonGroup>
              <Button type="submit" loading={pending}>
                {isCreate ? 'Save owner' : 'Save changes'}
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/owners">Cancel</Link>
              </Button>
            </ButtonGroup>
          </Stack>
        </form>
      </PanelCard>

      {!isCreate && owner ? (
        <PanelCard title="Danger zone">
          <Stack gap={LAYOUT_GAP.form}>
            <Text fontSize="sm" color="fg.muted">
              Remove this owner from the saved registry. Owners linked to event
              entries cannot be deleted.
            </Text>
            <Button
              type="button"
              colorPalette="red"
              variant="outline"
              alignSelf="flex-start"
              onClick={() => setDeleteOpen(true)}
            >
              Delete owner
            </Button>
          </Stack>
        </PanelCard>
      ) : null}

      <Dialog.Root open={deleteOpen} onOpenChange={(details) => setDeleteOpen(details.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="md">
              <form action={deleteAction}>
                <input type="hidden" name="id" value={owner?.id ?? ''} />
                <Dialog.Header>
                  <Dialog.Title>Delete owner?</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Text>
                    This removes <strong>{owner?.displayName}</strong> from the
                    saved owners list. Existing entries keep their recorded owner
                    name.
                  </Text>
                  {deleteState.error ? (
                    <Text fontSize="sm" color="red.500" mt={3}>
                      {deleteState.error}
                    </Text>
                  ) : null}
                </Dialog.Body>
                <Dialog.Footer>
                  <Flex gap={LAYOUT_GAP.buttons}>
                    <Dialog.ActionTrigger asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </Dialog.ActionTrigger>
                    <Button type="submit" colorPalette="red" loading={deletePending}>
                      Delete owner
                    </Button>
                  </Flex>
                </Dialog.Footer>
              </form>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </PageStack>
  )
}
