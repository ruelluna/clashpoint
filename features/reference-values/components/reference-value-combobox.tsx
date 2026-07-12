'use client'

import {
  Combobox,
  Field,
  Portal,
  Text,
  useListCollection,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'

import { searchReferenceValuesAction } from '@/features/reference-values/actions'
import { CreateReferenceValueDialog } from '@/features/reference-values/components/create-reference-value-dialog'
import {
  ADD_NEW_REFERENCE_VALUE_ID,
  filterExactReferenceMatches,
  hasExactReferenceMatch,
} from '@/features/reference-values/schema'
import type { ReferenceValueKind } from '@/features/reference-values/types'

type ReferenceValueComboboxProps = {
  kind: ReferenceValueKind
  name: string
  label: string
  defaultValue?: string
  maxLength?: number
  disabled?: boolean
  required?: boolean
  flex?: string | number
}

const SEARCH_DEBOUNCE_MS = 300

const KIND_LABELS: Record<ReferenceValueKind, string> = {
  breed: 'breed',
  bloodline: 'bloodline',
  color_marking: 'color / marking',
}

type CatalogItem = { id: string; name: string }

export function ReferenceValueCombobox({
  kind,
  name,
  label,
  defaultValue = '',
  maxLength = 200,
  disabled = false,
  required = false,
  flex,
}: ReferenceValueComboboxProps) {
  const [inputValue, setInputValue] = useState(defaultValue)
  const [selectedName, setSelectedName] = useState(defaultValue)
  const [searchResults, setSearchResults] = useState<CatalogItem[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const displayItems = useMemo((): CatalogItem[] => {
    const trimmed = inputValue.trim()
    if (!trimmed) return []

    if (hasExactReferenceMatch(searchResults, trimmed)) {
      return filterExactReferenceMatches(searchResults, trimmed)
    }

    return [{ id: ADD_NEW_REFERENCE_VALUE_ID, name: 'Add New' }]
  }, [inputValue, searchResults])

  const { collection, set } = useListCollection<CatalogItem>({
    initialItems: defaultValue ? [{ id: defaultValue, name: defaultValue }] : [],
    itemToString: (item) => item.name,
    itemToValue: (item) => item.id,
  })

  useEffect(() => {
    set(displayItems)
  }, [displayItems, set])

  useEffect(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setSearchResults([])
      setSearchError(null)
      return
    }

    const timeout = window.setTimeout(async () => {
      const result = await searchReferenceValuesAction({ kind, query: trimmed })
      if (result.error) {
        setSearchError(result.error)
        setSearchResults([])
        return
      }

      setSearchError(null)
      setSearchResults(result.results ?? [])
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [inputValue, kind])

  function handleValueCreated(value: { id: string; name: string }) {
    setSearchResults((current) => {
      if (current.some((item) => item.id === value.id)) return current
      return [value, ...current]
    })
    setSelectedId(value.id)
    setSelectedName(value.name)
    setInputValue(value.name)
  }

  function handleValueChange(nextId: string) {
    if (nextId === ADD_NEW_REFERENCE_VALUE_ID) {
      setDialogOpen(true)
      return
    }

    setSelectedId(nextId)
    const item = searchResults.find((entry) => entry.id === nextId)
    if (item) {
      setSelectedName(item.name)
      setInputValue(item.name)
    }
  }

  return (
    <Field.Root required={required} flex={flex}>
      <Field.Label>{label}</Field.Label>
      <input type="hidden" name={name} value={selectedName} />
      <Combobox.Root
        collection={collection}
        disabled={disabled}
        inputValue={inputValue}
        value={selectedId ? [selectedId] : []}
        onInputValueChange={(details) => {
          setInputValue(details.inputValue)
          if (selectedId && details.inputValue.trim() !== selectedName) {
            setSelectedId('')
            setSelectedName('')
          }
        }}
        onValueChange={(details) => {
          handleValueChange(details.value[0] ?? '')
        }}
        openOnClick
        data-testid={`reference-value-${kind}`}
      >
        <Combobox.Control>
          <Combobox.Input
            required={required}
            maxLength={maxLength}
            placeholder={`Search ${KIND_LABELS[kind]}`}
          />
          <Combobox.IndicatorGroup>
            <Combobox.ClearTrigger
              onClick={() => {
                setSelectedId('')
                setSelectedName('')
                setInputValue('')
              }}
            />
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>

        <Portal>
          <Combobox.Positioner>
            <Combobox.Content>
              <Combobox.Empty>Type to search</Combobox.Empty>
              {collection.items.map((item) => (
                <Combobox.Item key={item.id} item={item}>
                  <Combobox.ItemText>{item.name}</Combobox.ItemText>
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>
      <Field.HelperText>
        Search existing values or choose Add New to register one.
      </Field.HelperText>
      {searchError ? (
        <Text fontSize="sm" color="red.500">
          {searchError}
        </Text>
      ) : null}

      <CreateReferenceValueDialog
        kind={kind}
        open={dialogOpen}
        initialName={inputValue.trim()}
        onOpenChange={setDialogOpen}
        onCreated={handleValueCreated}
      />
    </Field.Root>
  )
}
