'use client'

import { Combobox, Portal, Text, useListCollection } from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'

import { FormField } from '@/components/dashboard'
import type { WeighingEntrySummary } from '@/features/weighing/types'

type EventOwnerEntryItem = {
  id: string
  label: string
  disabled: boolean
  entry: WeighingEntrySummary
}

type EventOwnerEntryPickerProps = {
  entries: WeighingEntrySummary[]
  cocksPerEntry: number
  value: string
  onValueChange: (entryId: string) => void
}

export function formatEventOwnerEntryLabel(
  entry: WeighingEntrySummary,
  cocksPerEntry: number
): string {
  return `#${entry.entry_number} ${entry.entry_name} · ${entry.owner_name} (${entry.rooster_count}/${cocksPerEntry} cock${cocksPerEntry === 1 ? '' : 's'})`
}

function entrySearchHaystack(entry: WeighingEntrySummary): string {
  return [
    entry.entry_number,
    entry.entry_name,
    entry.owner_name,
    entry.owner_barcode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function EventOwnerEntryPicker({
  entries,
  cocksPerEntry,
  value,
  onValueChange,
}: EventOwnerEntryPickerProps) {
  const selectedEntry = entries.find((entry) => entry.entry_id === value) ?? null
  const [inputValue, setInputValue] = useState(
    selectedEntry ? formatEventOwnerEntryLabel(selectedEntry, cocksPerEntry) : ''
  )

  useEffect(() => {
    if (!value) {
      setInputValue('')
      return
    }
    const entry = entries.find((item) => item.entry_id === value)
    if (entry) {
      setInputValue(formatEventOwnerEntryLabel(entry, cocksPerEntry))
    }
  }, [cocksPerEntry, entries, value])

  const allItems = useMemo((): EventOwnerEntryItem[] => {
    return entries.map((entry) => {
      const baseLabel = formatEventOwnerEntryLabel(entry, cocksPerEntry)
      return {
        id: entry.entry_id,
        label: entry.can_add_rooster ? baseLabel : `${baseLabel} — full`,
        disabled: !entry.can_add_rooster,
        entry,
      }
    })
  }, [cocksPerEntry, entries])

  const filteredItems = useMemo((): EventOwnerEntryItem[] => {
    const trimmed = inputValue.trim().toLowerCase()
    if (!trimmed) return allItems

    return allItems.filter((item) => entrySearchHaystack(item.entry).includes(trimmed))
  }, [allItems, inputValue])

  const { collection, set } = useListCollection<EventOwnerEntryItem>({
    initialItems: allItems,
    itemToString: (item) => item.label,
    itemToValue: (item) => item.id,
  })

  useEffect(() => {
    set(filteredItems)
  }, [filteredItems, set])

  const selectedCanAdd = selectedEntry?.can_add_rooster ?? false

  return (
    <FormField label="Owner" required>
      <input type="hidden" name="entryId" value={value} />
      <Combobox.Root
        collection={collection}
        inputValue={inputValue}
        value={value ? [value] : []}
        onInputValueChange={(details) => {
          setInputValue(details.inputValue)
          if (value) {
            const entry = entries.find((item) => item.entry_id === value)
            if (
              entry &&
              details.inputValue.trim() !== formatEventOwnerEntryLabel(entry, cocksPerEntry)
            ) {
              onValueChange('')
            }
          }
        }}
        onValueChange={(details) => {
          const nextId = details.value[0] ?? ''
          onValueChange(nextId)
          const entry = entries.find((row) => row.entry_id === nextId)
          if (entry) {
            setInputValue(formatEventOwnerEntryLabel(entry, cocksPerEntry))
          }
        }}
        openOnClick
        data-testid="event-owner-entry-picker"
      >
        <Combobox.Control>
          <Combobox.Input placeholder="Search owners…" required={!value} />
          <Combobox.IndicatorGroup>
            <Combobox.ClearTrigger
              onClick={() => {
                onValueChange('')
                setInputValue('')
              }}
            />
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>

        <Portal>
          <Combobox.Positioner>
            <Combobox.Content>
              <Combobox.Empty>No owners match this search</Combobox.Empty>
              {collection.items.map((item) => (
                <Combobox.Item key={item.id} item={item}>
                  <Combobox.ItemText>{item.label}</Combobox.ItemText>
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>
      {value && !selectedCanAdd ? (
        <Text fontSize="sm" color="red.500" mt={1}>
          This owner has reached the cock limit for this event.
        </Text>
      ) : null}
      {entries.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" mt={1}>
          Register owners on the Owners tab first.
        </Text>
      ) : null}
    </FormField>
  )
}
