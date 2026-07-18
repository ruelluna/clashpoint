'use client'

import {
  Box,
  Button,
  Combobox,
  Field,
  Flex,
  Portal,
  Stack,
  Text,
  useListCollection,
} from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { CreateOwnerDialog } from '@/features/entries/components/create-owner-dialog'
import { searchCompetitorsAction } from '@/features/competitors/actions'
import type { CompetitorSearchResult } from '@/features/competitors/types'

export type OwnerProfileValues = {
  contactFullName: string
  contactDesignation: string
  contactNumber: string
  email: string
  address: string
}

type OwnerPickerFieldProps = {
  initialOwnerName?: string
  initialCompetitor?: CompetitorSearchResult | null
  onOwnerProfileChange: (values: OwnerProfileValues) => void
}

const OWNER_PICKER_LIMIT = 100

function mergeOwners(
  owners: CompetitorSearchResult[],
  extra: CompetitorSearchResult | null | undefined
): CompetitorSearchResult[] {
  if (!extra) return owners
  if (owners.some((item) => item.id === extra.id)) return owners
  return [extra, ...owners]
}

export function OwnerPickerField({
  initialOwnerName = '',
  initialCompetitor = null,
  onOwnerProfileChange,
}: OwnerPickerFieldProps) {
  const [allOwners, setAllOwners] = useState<CompetitorSearchResult[]>(
    initialCompetitor ? [initialCompetitor] : []
  )
  const [inputValue, setInputValue] = useState(initialOwnerName)
  const [competitorId, setCompetitorId] = useState(initialCompetitor?.id ?? '')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingOwners, setIsLoadingOwners] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredItems = useMemo((): CompetitorSearchResult[] => {
    const trimmed = inputValue.trim().toLowerCase()
    if (!trimmed) return allOwners

    return allOwners.filter((owner) =>
      owner.displayName.toLowerCase().includes(trimmed)
    )
  }, [allOwners, inputValue])

  const { collection, set } = useListCollection<CompetitorSearchResult>({
    initialItems: initialCompetitor ? [initialCompetitor] : [],
    itemToString: (item) => item.displayName,
    itemToValue: (item) => item.id,
  })

  useEffect(() => {
    set(filteredItems)
  }, [filteredItems, set])

  useEffect(() => {
    let cancelled = false

    async function loadOwners() {
      setIsLoadingOwners(true)
      setLoadError(null)

      const result = await searchCompetitorsAction('', OWNER_PICKER_LIMIT)
      if (cancelled) return

      if (result.error) {
        setLoadError(result.error)
        setAllOwners((current) => mergeOwners(current, initialCompetitor))
        setIsLoadingOwners(false)
        return
      }

      setAllOwners(mergeOwners(result.results ?? [], initialCompetitor))
      setIsLoadingOwners(false)
    }

    void loadOwners()

    return () => {
      cancelled = true
    }
  }, [initialCompetitor])

  const applyOwnerProfile = useCallback(
    (owner: CompetitorSearchResult) => {
      onOwnerProfileChange({
        contactFullName: owner.contactFullName ?? '',
        contactDesignation: owner.contactDesignation ?? '',
        contactNumber: owner.contactNumber ?? '',
        email: owner.email ?? '',
        address: owner.address ?? '',
      })
    },
    [onOwnerProfileChange]
  )

  const selectedCompetitor = useMemo(
    () => allOwners.find((item) => item.id === competitorId) ?? initialCompetitor,
    [allOwners, competitorId, initialCompetitor]
  )

  const emptyMessage = useMemo(() => {
    if (isLoadingOwners) return 'Loading owners…'
    if (allOwners.length === 0) return 'No saved owners found'
    if (inputValue.trim()) return 'No owners match this search'
    return 'No saved owners found'
  }, [allOwners.length, inputValue, isLoadingOwners])

  function handleOwnerCreated(
    owner: CompetitorSearchResult,
    profile: OwnerProfileValues
  ) {
    setAllOwners((current) => {
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

      <Field.Root required flex="1">
        <Field.Label>Owner Name/Game Farm</Field.Label>
        <Flex
          gap={3}
          align="center"
          direction={{ base: 'column', sm: 'row' }}
        >
          <Box flex="1" width={{ base: '100%', sm: 'auto' }}>
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

                const owner = allOwners.find((item) => item.id === nextId)
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
                    <Combobox.Empty>{emptyMessage}</Combobox.Empty>
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
          </Box>
          <Button
            type="button"
            variant="outline"
            flexShrink={0}
            alignSelf={{ base: 'stretch', sm: 'auto' }}
            onClick={() => setDialogOpen(true)}
          >
            Add new
          </Button>
        </Flex>
        <Field.HelperText>
          Search saved owners or use Add new to register a game farm.{' '}
          <Link href="/dashboard/owners" style={{ textDecoration: 'underline' }}>
            Manage owners
          </Link>
          . Handler is recorded per rooster entry.
        </Field.HelperText>
      </Field.Root>

      <CreateOwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleOwnerCreated}
      />

      {loadError ? (
        <Text fontSize="sm" color="red.500">
          {loadError}
        </Text>
      ) : null}
    </Stack>
  )
}
