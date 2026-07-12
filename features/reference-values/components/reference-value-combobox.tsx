'use client'

import {
  Combobox,
  Field,
  Portal,
  Text,
  useListCollection,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'

import { searchReferenceValuesAction } from '@/features/reference-values/actions'
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
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; name: string }>
  >(defaultValue ? [{ id: defaultValue, name: defaultValue }] : [])
  const [selectedId, setSelectedId] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)

  const { collection, set } = useListCollection<{ id: string; name: string }>({
    initialItems: defaultValue ? [{ id: defaultValue, name: defaultValue }] : [],
    itemToString: (item) => item.name,
    itemToValue: (item) => item.id,
  })

  useEffect(() => {
    set(searchResults)
  }, [searchResults, set])

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

  return (
    <Field.Root required={required} flex={flex}>
      <Field.Label>{label}</Field.Label>
      <Combobox.Root
        collection={collection}
        allowCustomValue
        disabled={disabled}
        inputValue={inputValue}
        value={selectedId ? [selectedId] : []}
        onInputValueChange={(details) => {
          setInputValue(details.inputValue)
          if (selectedId) {
            const selected = searchResults.find((item) => item.id === selectedId)
            if (details.inputValue.trim() !== selected?.name) {
              setSelectedId('')
            }
          }
        }}
        onValueChange={(details) => {
          const nextId = details.value[0] ?? ''
          setSelectedId(nextId)
          const item = searchResults.find((entry) => entry.id === nextId)
          if (item) {
            setInputValue(item.name)
          }
        }}
        openOnClick
        data-testid={`reference-value-${kind}`}
      >
        <Combobox.Control>
          <Combobox.Input
            name={name}
            required={required}
            maxLength={maxLength}
            placeholder={`Search or add ${KIND_LABELS[kind]}`}
          />
          <Combobox.IndicatorGroup>
            <Combobox.ClearTrigger
              onClick={() => {
                setSelectedId('')
                setInputValue('')
              }}
            />
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>

        <Portal>
          <Combobox.Positioner>
            <Combobox.Content>
              <Combobox.Empty>Type to search or add new</Combobox.Empty>
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
      <Field.HelperText>Type to search existing values or enter a new one.</Field.HelperText>
      {searchError ? (
        <Text fontSize="sm" color="red.500">
          {searchError}
        </Text>
      ) : null}
    </Field.Root>
  )
}
