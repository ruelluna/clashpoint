'use client'

import { Button, Flex, Input, Stack, Text } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { FormField, LAYOUT_GAP } from '@/components/dashboard'
import {
  createReferenceValueSettingsAction,
  deleteReferenceValueAction,
} from '@/features/reference-values/actions'
import type { ReferenceValueListItem } from '@/features/reference-values/types'

type ReferenceOptionsManagerProps = {
  kind: 'breed' | 'color_marking'
  title: string
  items: ReferenceValueListItem[]
  testIdPrefix: string
}

export function ReferenceOptionsManager({
  kind,
  title,
  items,
  testIdPrefix,
}: ReferenceOptionsManagerProps) {
  const router = useRouter()
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function refresh() {
    router.refresh()
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const trimmed = newName.trim()
    if (!trimmed) return

    startTransition(async () => {
      const result = await createReferenceValueSettingsAction({ kind, name: trimmed })
      if (result.error) {
        setError(result.error)
        return
      }
      setNewName('')
      refresh()
    })
  }

  async function handleDelete(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await deleteReferenceValueAction({ id })
      if (result.error) {
        setError(result.error)
        return
      }
      refresh()
    })
  }

  return (
    <Stack gap={LAYOUT_GAP.form} data-testid={testIdPrefix}>
      <Text fontWeight="semibold">{title}</Text>
      <FormField label={`Add ${kind === 'breed' ? 'breed' : 'color'}`}>
        <form onSubmit={handleAdd}>
          <Flex gap={LAYOUT_GAP.buttons} align="flex-end">
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={200}
              placeholder={kind === 'breed' ? 'e.g. Talisayon' : 'e.g. Black'}
              flex="1"
            />
            <Button type="submit" loading={pending}>
              Add
            </Button>
          </Flex>
        </form>
      </FormField>

      <Stack gap={2}>
        {items.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No options yet.
          </Text>
        ) : (
          items.map((item) => (
            <Flex key={item.id} justify="space-between" align="center" gap={3}>
              <Text fontSize="sm">{item.name}</Text>
              <Button
                type="button"
                size="sm"
                variant="outline"
                colorPalette="red"
                loading={pending}
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </Button>
            </Flex>
          ))
        )}
      </Stack>

      {error ? (
        <Text color="fg.error" fontSize="sm">
          {error}
        </Text>
      ) : null}
    </Stack>
  )
}
