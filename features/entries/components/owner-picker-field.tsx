'use client'

import {
  Checkbox,
  Combobox,
  Portal,
  Stack,
  Text,
  useListCollection,
} from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { FormField } from '@/components/dashboard'
import { searchCompetitorsAction } from '@/features/competitors/actions'
import type { CompetitorSearchResult } from '@/features/competitors/types'

export type OwnerProfileValues = {
  contactNumber: string
  email: string
  address: string
}

type OwnerPickerFieldProps = {
  initialOwnerName?: string
  initialCompetitor?: CompetitorSearchResult | null
  onOwnerProfileChange: (values: OwnerProfileValues) => void
}

const SEARCH_DEBOUNCE_MS = 300

export function OwnerPickerField({
  initialOwnerName = '',
  initialCompetitor = null,
  onOwnerProfileChange,
}: OwnerPickerFieldProps) {
  const [searchResults, setSearchResults] = useState<CompetitorSearchResult[]>(
    initialCompetitor ? [initialCompetitor] : []
  )
  const [inputValue, setInputValue] = useState(initialOwnerName)
  const [competitorId, setCompetitorId] = useState(initialCompetitor?.id ?? '')
  const [saveOwner, setSaveOwner] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const { collection, set } = useListCollection<CompetitorSearchResult>({
    initialItems: initialCompetitor ? [initialCompetitor] : [],
    itemToString: (item) => item.displayName,
    itemToValue: (item) => item.id,
  })

  useEffect(() => {
    set(searchResults)
  }, [searchResults, set])

  const applyOwnerProfile = useCallback(
    (owner: CompetitorSearchResult) => {
      onOwnerProfileChange({
        contactNumber: owner.contactNumber ?? '',
        email: owner.email ?? '',
        address: owner.address ?? '',
      })
    },
    [onOwnerProfileChange]
  )

  useEffect(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setSearchResults([])
      setSearchError(null)
      return
    }

    const timeout = window.setTimeout(async () => {
      const result = await searchCompetitorsAction(trimmed)
      if (result.error) {
        setSearchError(result.error)
        setSearchResults([])
        return
      }

      setSearchError(null)
      setSearchResults(result.results ?? [])
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [inputValue])

  const selectedCompetitor = useMemo(
    () => searchResults.find((item) => item.id === competitorId) ?? initialCompetitor,
    [competitorId, initialCompetitor, searchResults]
  )

  const showSaveOwnerOption = !competitorId

  return (
    <Stack gap={3}>
      <input type="hidden" name="competitorId" value={competitorId} />
      <input type="hidden" name="saveOwner" value={saveOwner ? 'on' : 'off'} />

      <FormField
        label="Owner name"
        required
        helpText="Search saved owners or type a new name. Handler is recorded per entry only."
      >
        <Combobox.Root
          collection={collection}
          allowCustomValue
          inputValue={inputValue}
          value={competitorId ? [competitorId] : []}
          onInputValueChange={(details) => {
            setInputValue(details.inputValue)
            if (competitorId && details.inputValue.trim() !== selectedCompetitor?.displayName) {
              setCompetitorId('')
            }
          }}
          onValueChange={(details) => {
            const nextId = details.value[0] ?? ''
            setCompetitorId(nextId)

            const owner = searchResults.find((item) => item.id === nextId)
            if (owner) {
              setInputValue(owner.displayName)
              applyOwnerProfile(owner)
              setSaveOwner(false)
            }
          }}
          openOnClick
          data-testid="owner-picker"
        >
          <Combobox.Control>
            <Combobox.Input
              name="ownerName"
              required
              maxLength={200}
              placeholder="Search or enter owner name"
            />
            <Combobox.IndicatorGroup>
              <Combobox.ClearTrigger
                onClick={() => {
                  setCompetitorId('')
                  setSaveOwner(false)
                }}
              />
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>

          <Portal>
            <Combobox.Positioner>
              <Combobox.Content>
                <Combobox.Empty>No saved owners found</Combobox.Empty>
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
      </FormField>

      {searchError ? (
        <Text fontSize="sm" color="red.500">
          {searchError}
        </Text>
      ) : null}

      {showSaveOwnerOption ? (
        <Checkbox.Root
          checked={saveOwner}
          onCheckedChange={(event) => setSaveOwner(Boolean(event.checked))}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Save owner for future entries</Checkbox.Label>
        </Checkbox.Root>
      ) : null}
    </Stack>
  )
}
