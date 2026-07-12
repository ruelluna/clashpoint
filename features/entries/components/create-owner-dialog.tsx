'use client'

import {
  Button,
  Dialog,
  Flex,
  Input,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'

import { FormField, LAYOUT_GAP } from '@/components/dashboard'
import { createCompetitorAction } from '@/features/competitors/actions'
import type { CompetitorSearchResult } from '@/features/competitors/types'
import {
  ContactNumberField,
} from '@/features/entries/components/contact-number-field'
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
  const [displayName, setDisplayName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function resetForm() {
    setDisplayName('')
    setContactNumber('')
    setEmail('')
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const result = await createCompetitorAction({
      displayName: displayName.trim(),
      contactNumber: contactNumber || undefined,
      email: email.trim() || undefined,
    })

    setPending(false)

    if (result.error || !result.competitor) {
      setError(result.error ?? 'Failed to create owner')
      return
    }

    onCreated(result.competitor, {
      contactNumber: result.competitor.contactNumber ?? '',
      email: result.competitor.email ?? '',
      address: '',
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
                  <FormField label="Owner Name/Game Farm" required>
                    <Input
                      value={displayName}
                      maxLength={200}
                      required
                      onChange={(event) => setDisplayName(event.target.value)}
                    />
                  </FormField>
                  <ContactNumberField
                    value={contactNumber}
                    onChange={setContactNumber}
                  />
                  <FormField label="Email">
                    <Input
                      type="email"
                      maxLength={200}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </FormField>
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
