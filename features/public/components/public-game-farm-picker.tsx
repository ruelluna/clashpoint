'use client'

import {
  Combobox,
  Field,
  Portal,
  Stack,
  Text,
  useListCollection,
} from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'

import { searchPublicGameFarmsAction } from '@/features/public/actions'

const SEARCH_DEBOUNCE_MS = 300

type PublicGameFarmOption = {
  id: string
  displayName: string
}

type PublicGameFarmPickerProps = {
  selectedId: string
  selectedName: string
  onSelect: (option: PublicGameFarmOption | null) => void
}

export function PublicGameFarmPicker({
  selectedId,
  selectedName,
  onSelect,
}: PublicGameFarmPickerProps) {
  const [searchResults, setSearchResults] = useState<PublicGameFarmOption[]>([])
  const [inputValue, setInputValue] = useState(selectedName)
  const [searchError, setSearchError] = useState<string | null>(null)

  const { collection, set } = useListCollection<PublicGameFarmOption>({
    initialItems: [],
    itemToString: (item) => item.displayName,
    itemToValue: (item) => item.id,
  })

  useEffect(() => {
    set(searchResults)
  }, [searchResults, set])

  useEffect(() => {
    setInputValue(selectedName)
  }, [selectedName])

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSearchResults([])
      setSearchError(null)
      return
    }

    try {
      const result = await searchPublicGameFarmsAction(trimmed)
      if (result.error) {
        setSearchResults([])
        setSearchError(result.error)
        return
      }

      setSearchError(null)
      setSearchResults(result.results ?? [])
    } catch (error) {
      setSearchResults([])
      setSearchError(error instanceof Error ? error.message : 'Search failed')
    }
  }, [])

  useEffect(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setSearchResults([])
      setSearchError(null)
      return
    }

    const timer = window.setTimeout(() => {
      void runSearch(trimmed)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [inputValue, runSearch])

  return (
    <Stack gap={2}>
      <Field.Root>
        <Field.Label>Search existing game farm</Field.Label>
        <Combobox.Root
          collection={collection}
          value={selectedId ? [selectedId] : []}
          inputValue={inputValue}
          onInputValueChange={(details) => {
            setInputValue(details.inputValue)
            if (!details.inputValue.trim()) {
              onSelect(null)
            }
          }}
          onValueChange={(details) => {
            const id = details.value[0]
            if (!id) {
              onSelect(null)
              return
            }
            const match = searchResults.find((row) => row.id === id)
            if (match) {
              setInputValue(match.displayName)
              onSelect(match)
            }
          }}
          openOnClick
        >
          <Combobox.Control>
            <Combobox.Input placeholder="Type at least 2 characters" />
            <Combobox.IndicatorGroup>
              <Combobox.ClearTrigger />
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner>
              <Combobox.Content>
                <Combobox.Empty>No matching game farms</Combobox.Empty>
                {collection.items.map((item) => (
                  <Combobox.Item key={item.id} item={item}>
                    <Combobox.ItemText>{item.displayName}</Combobox.ItemText>
                    <Combobox.ItemIndicator />
                  </Combobox.Item>
                ))}
              </Combobox.Content>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>
      </Field.Root>
      {searchError ? (
        <Text fontSize="sm" color="red.fg">
          {searchError}
        </Text>
      ) : (
        <Text fontSize="xs" color="fg.muted">
          Selecting an existing game farm requires email verification before you can add
          roosters.
        </Text>
      )}
      <input type="hidden" name="competitorId" value={selectedId} />
    </Stack>
  )
}
