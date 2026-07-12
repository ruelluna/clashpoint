'use client'

import {
  Button,
  Combobox,
  Flex,
  Portal,
  Stack,
  Text,
  useListCollection,
} from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { FormField } from '@/components/dashboard'
import { searchCompetitorsAction } from '@/features/competitors/actions'
import type { CompetitorSearchResult } from '@/features/competitors/types'
import { CreateOwnerDialog } from '@/features/entries/components/create-owner-dialog'

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
  const [searchError, setSearchError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

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

  function handleOwnerCreated(
    owner: CompetitorSearchResult,
    profile: OwnerProfileValues
  ) {
    setSearchResults((current) => {
      if (current.some((item) => item.id === owner.id)) return current
      return [owner, ...current]
    })
    setCompetitorId(owner.id)
    setInputValue(owner.displayName)
    onOwnerProfileChange(profile)
  }

  return (
    <Stack gap={3}>
      <input type="hidden" name="competitorId" value={competitorId} />

      <Flex gap={3} align="flex-end" direction={{ base: 'column', sm: 'row' }}>
        <FormField
          label="Owner Name/Game Farm"
          required
          flex="1"
          helpText="Search saved owners or use Add new to register a game farm. Handler is recorded per entry only."
        >
          <Combobox.Root
            collection={collection}
            allowCustomValue
            inputValue={inputValue}
            value={competitorId ? [competitorId] : []}
            onInputValueChange={(details) => {
              setInputValue(details.inputValue)
              if (
                competitorId &&
                details.inputValue.trim() !== selectedCompetitor?.displayName
              ) {
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
                placeholder="Search or enter owner / game farm"
              />
              <Combobox.IndicatorGroup>
                <Combobox.ClearTrigger
                  onClick={() => {
                    setCompetitorId('')
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
        <Button
          type="button"
          variant="outline"
          alignSelf={{ base: 'stretch', sm: 'flex-end' }}
          onClick={() => setDialogOpen(true)}
        >
          Add new
        </Button>
      </Flex>

      <CreateOwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleOwnerCreated}
      />

      {searchError ? (
        <Text fontSize="sm" color="red.500">
          {searchError}
        </Text>
      ) : null}
    </Stack>
  )
}
