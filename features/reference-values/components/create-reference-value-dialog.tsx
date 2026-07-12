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
import { useEffect, useState } from 'react'

import { FormField, LAYOUT_GAP } from '@/components/dashboard'
import { createReferenceValueAction } from '@/features/reference-values/actions'
import type { ReferenceValueKind } from '@/features/reference-values/types'

const KIND_LABELS: Record<ReferenceValueKind, string> = {
  breed: 'Breed',
  bloodline: 'Bloodline',
  color_marking: 'Color / marking',
}

type CreateReferenceValueDialogProps = {
  kind: ReferenceValueKind
  open: boolean
  initialName?: string
  onOpenChange: (open: boolean) => void
  onCreated: (value: { id: string; name: string }) => void
}

export function CreateReferenceValueDialog({
  kind,
  open,
  initialName = '',
  onOpenChange,
  onCreated,
}: CreateReferenceValueDialogProps) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError(null)
    }
  }, [open, initialName])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const result = await createReferenceValueAction({ kind, name: name.trim() })

    setPending(false)

    if (result.error || !result.value) {
      setError(result.error ?? 'Failed to save value')
      return
    }

    onCreated(result.value)
    onOpenChange(false)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        onOpenChange(details.open)
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="md">
            <form onSubmit={handleSubmit}>
              <Dialog.Header>
                <Dialog.Title>Add {KIND_LABELS[kind]}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap={LAYOUT_GAP.form}>
                  <FormField label={KIND_LABELS[kind]} required>
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={200}
                      required
                      autoFocus
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
                    Save
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
