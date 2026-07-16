'use client'

import {
  Combobox,
  Field,
  Portal,
  useListCollection,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'

import {
  filterExactReferenceMatches,
  hasExactReferenceMatch,
  USE_CUSTOM_REFERENCE_VALUE_ID,
} from '@/features/reference-values/schema'
import type { ReferenceValueKind, ReferenceValueListItem } from '@/features/reference-values/types'

type ReferenceValuePickerProps = {
  kind: ReferenceValueKind
  name: string
  label: string
  options: ReferenceValueListItem[]
  defaultValue?: string
  maxLength?: number
  disabled?: boolean
  required?: boolean
  allowCreate?: boolean
  flex?: string | number
}

const KIND_LABELS: Record<ReferenceValueKind, string> = {
  breed: 'breed',
  bloodline: 'bloodline',
  color_marking: 'color',
}

function findOptionByName(
  options: ReferenceValueListItem[],
  name: string
): ReferenceValueListItem | undefined {
  const trimmed = name.trim().toLowerCase()
  if (!trimmed) return undefined
  return options.find((option) => option.name.trim().toLowerCase() === trimmed)
}

export function ReferenceValuePicker({
  kind,
  name,
  label,
  options,
  defaultValue = '',
  maxLength = 200,
  disabled = false,
  required = false,
  allowCreate = false,
  flex,
}: ReferenceValuePickerProps) {
  const initialOption = findOptionByName(options, defaultValue)
  const [inputValue, setInputValue] = useState(defaultValue)
  const [selectedName, setSelectedName] = useState(defaultValue)
  const [selectedId, setSelectedId] = useState(initialOption?.id ?? '')

  const filteredOptions = useMemo(() => {
    const trimmed = inputValue.trim().toLowerCase()
    if (!trimmed) return options
    return options.filter((option) => option.name.toLowerCase().includes(trimmed))
  }, [inputValue, options])

  const displayItems = useMemo((): ReferenceValueListItem[] => {
    const trimmed = inputValue.trim()
    if (!trimmed) return filteredOptions.slice(0, 50)

    if (hasExactReferenceMatch(filteredOptions, trimmed)) {
      return filterExactReferenceMatches(filteredOptions, trimmed)
    }

    if (allowCreate) {
      return [{ id: USE_CUSTOM_REFERENCE_VALUE_ID, name: `Use "${trimmed}"` }]
    }

    return filteredOptions.slice(0, 50)
  }, [allowCreate, filteredOptions, inputValue])

  const { collection, set } = useListCollection<ReferenceValueListItem>({
    initialItems: initialOption ? [initialOption] : [],
    itemToString: (item) => item.name,
    itemToValue: (item) => item.id,
  })

  useEffect(() => {
    set(displayItems)
  }, [displayItems, set])

  function handleValueChange(nextId: string) {
    const trimmed = inputValue.trim()

    if (nextId === USE_CUSTOM_REFERENCE_VALUE_ID) {
      setSelectedId(USE_CUSTOM_REFERENCE_VALUE_ID)
      setSelectedName(trimmed)
      setInputValue(trimmed)
      return
    }

    setSelectedId(nextId)
    const item = options.find((entry) => entry.id === nextId)
    if (item) {
      setSelectedName(item.name)
      setInputValue(item.name)
    }
  }

  const helperText = allowCreate
    ? 'Choose from the list or enter a new value.'
    : 'Choose from the organization catalog (manage in Settings).'

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
              <Combobox.Empty>
                {allowCreate ? 'Type a value or pick from the list' : 'No matching options'}
              </Combobox.Empty>
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
      <Field.HelperText>{helperText}</Field.HelperText>
    </Field.Root>
  )
}
