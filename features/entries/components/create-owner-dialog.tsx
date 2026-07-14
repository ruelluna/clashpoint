'use client'

import {
  Button,
  Dialog,
  Flex,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'

import { ButtonGroup, LAYOUT_GAP } from '@/components/dashboard'
import { createCompetitorAction } from '@/features/competitors/actions'
import { OwnerProfileFields } from '@/features/competitors/components/owner-profile-fields'
import type { CompetitorSearchResult } from '@/features/competitors/types'
import type { OwnerProfileValues } from '@/features/entries/components/owner-picker-field'

type CreateOwnerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (owner: CompetitorSearchResult, profile: OwnerProfileValues) => void
}

export function CreateOwnerDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateOwnerDialogProps) {
  const [profile, setProfile] = useState({
    displayName: '',
    contactNumber: '',
    email: '',
    address: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function resetForm() {
    setProfile({
      displayName: '',
      contactNumber: '',
      email: '',
      address: '',
    })
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const result = await createCompetitorAction({
      displayName: profile.displayName.trim(),
      contactNumber: profile.contactNumber || undefined,
      email: profile.email.trim() || undefined,
      address: profile.address.trim() || undefined,
    })

    setPending(false)

    if (result.error || !result.competitor) {
      setError(result.error ?? 'Failed to create owner')
      return
    }

    onCreated(result.competitor, {
      contactNumber: result.competitor.contactNumber ?? '',
      email: result.competitor.email ?? '',
      address: result.competitor.address ?? '',
    })
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        onOpenChange(details.open)
        if (!details.open) resetForm()
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="md">
            <form onSubmit={handleSubmit}>
              <Dialog.Header>
                <Dialog.Title>Add Owner / Game Farm</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap={LAYOUT_GAP.form}>
                  <OwnerProfileFields
                    values={profile}
                    onChange={(values) =>
                      setProfile({
                        displayName: values.displayName,
                        contactNumber: values.contactNumber ?? '',
                        email: values.email ?? '',
                        address: values.address ?? '',
                      })
                    }
                  />
                  {error ? (
                    <Text fontSize="sm" color="red.500">
                      {error}
                    </Text>
                  ) : null}
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Flex gap={LAYOUT_GAP.buttons}>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Dialog.ActionTrigger>
                  <Button type="submit" loading={pending}>
                    Save owner
                  </Button>
                </Flex>
              </Dialog.Footer>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
