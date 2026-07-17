'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useActionState, useMemo, useState } from 'react'

import { ButtonGroup, FormField, LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import {
  submitLineupAction,
  type LineupActionState,
} from '@/features/lineups/actions'
import { LINEUP_STATUS_LABELS } from '@/features/lineups/schema'
import type { LineupEntrySummary, RoosterRecordRow } from '@/features/lineups/types'

type LineupsClientProps = {
  eventId: string
  cocksPerEntry: number
  summaries: LineupEntrySummary[]
  selectedEntryId: string | null
  existingRoosters: RoosterRecordRow[]
}

function statusBadgeColor(
  status: LineupEntrySummary['status']
): 'green' | 'blue' | 'orange' | 'gray' {
  if (status === 'verified') return 'green'
  if (status === 'submitted') return 'blue'
  if (status === 'rejected') return 'orange'
  return 'gray'
}

export function LineupsClient({
  eventId,
  cocksPerEntry,
  summaries,
  selectedEntryId: initialEntryId,
  existingRoosters,
}: LineupsClientProps) {
  const [selectedEntryId, setSelectedEntryId] = useState(initialEntryId ?? '')
  const [state, action, pending] = useActionState(
    submitLineupAction,
    {} as LineupActionState
  )

  const selectedSummary = useMemo(
    () => summaries.find((entry) => entry.entry_id === selectedEntryId) ?? null,
    [summaries, selectedEntryId]
  )

  const roosterDefaults = useMemo(() => {
    const map = new Map<number, RoosterRecordRow>()
    for (const rooster of existingRoosters) {
      map.set(rooster.cock_number, rooster)
    }
    return map
  }, [existingRoosters])

  const eligibleEntries = summaries.filter((entry) => entry.can_submit)

  return (
    <PageStack maxW="3xl">
      <PageHeader
        title="Rooster Entries"
        description={`Submit rooster entries for fully paid entries (${cocksPerEntry} cocks per entry).`}
      />

      <PanelCard flush>
        <Text
          fontSize="sm"
          color="fg.muted"
          px={{ base: 4, lg: LAYOUT_GAP.cardPadding }}
          pb={LAYOUT_GAP.cardTitle}
          display={{ base: 'block', lg: 'none' }}
        >
          Swipe horizontally to browse entries.
        </Text>
        <Box overflowX="auto">
          <Box as="table" width="100%" fontSize="sm">
            <Box as="thead" bg="bg.subtle">
              <Box as="tr">
                {['Entry', 'Owner', 'Status', 'Cocks', 'Eligible'].map((header) => (
                  <Box as="th" key={header} textAlign="left" px={4} py={3} fontWeight="medium">
                    {header}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box as="tbody">
              {summaries.length === 0 ? (
                <Box as="tr">
                  <td colSpan={5}>
                    <Box px={4} py={6} color="fg.muted">
                      No entries registered for this event yet.
                    </Box>
                  </td>
                </Box>
              ) : (
                summaries.map((entry) => (
                  <Box
                    as="tr"
                    key={entry.entry_id}
                    borderTopWidth="1px"
                    borderColor="border"
                    bg={selectedEntryId === entry.entry_id ? 'bg.subtle' : undefined}
                    cursor="pointer"
                    onClick={() => setSelectedEntryId(entry.entry_id)}
                  >
                    <Box as="td" px={4} py={3}>
                      <Text fontWeight="medium">#{entry.entry_number}</Text>
                      <Text color="fg.muted">{entry.entry_name}</Text>
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {entry.owner_name}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {entry.status ? (
                        <Badge colorPalette={statusBadgeColor(entry.status)}>
                          {LINEUP_STATUS_LABELS[entry.status]}
                        </Badge>
                      ) : (
                        <Text color="fg.muted">Not submitted</Text>
                      )}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {entry.rooster_count}/{cocksPerEntry}
                    </Box>
                    <Box as="td" px={4} py={3}>
                      {entry.can_submit ? (
                        <Badge colorPalette="green">Yes</Badge>
                      ) : (
                        <Badge colorPalette="gray">No</Badge>
                      )}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </PanelCard>

      {selectedSummary ? (
        <PanelCard>
          <Text fontWeight="medium" mb={1}>
            Submit lineup — #{selectedSummary.entry_number} {selectedSummary.entry_name}
          </Text>
          <Text fontSize="sm" color="fg.muted" mb={4}>
            Owner: {selectedSummary.owner_name}
          </Text>

          {!selectedSummary.can_submit ? (
            <Text color="fg.error" fontSize="sm">
              This entry must be fully paid before submitting a lineup.
            </Text>
          ) : (
            <form action={action}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="entryId" value={selectedSummary.entry_id} />
              <input type="hidden" name="cockCount" value={cocksPerEntry} />

              <Stack gap={LAYOUT_GAP.form}>
                {Array.from({ length: cocksPerEntry }, (_, index) => {
                  const cockNumber = index + 1
                  const existing = roosterDefaults.get(cockNumber)

                  return (
                    <PanelCard key={cockNumber}>
                      <Text fontSize="sm" fontWeight="medium" mb={3}>
                        Cock #{cockNumber}
                      </Text>
                      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }} wrap="wrap">
                        <FormField label="Band number" required flex="1" minW={{ sm: '140px' }}>
                          <Input
                            name={`bandNumber_${cockNumber}`}
                            defaultValue={existing?.band_number ?? ''}
                            required
                          />
                        </FormField>
                        <FormField label="Declared weight (kg)" flex="1" minW={{ sm: '120px' }}>
                          <Input
                            name={`declaredWeight_${cockNumber}`}
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={
                              existing?.declared_weight != null
                                ? String(existing.declared_weight)
                                : ''
                            }
                          />
                        </FormField>
                        <FormField label="Category" flex="1" minW={{ sm: '120px' }}>
                          <Input
                            name={`category_${cockNumber}`}
                            defaultValue={existing?.category ?? ''}
                          />
                        </FormField>
                        <FormField label="Color / marking" flex="1" minW={{ sm: '140px' }}>
                          <Input
                            name={`colorMarking_${cockNumber}`}
                            defaultValue={existing?.color_marking ?? ''}
                          />
                        </FormField>
                      </Flex>
                    </PanelCard>
                  )
                })}

                <ButtonGroup wrap="wrap" align="center">
                  <Button type="submit" loading={pending} size="md" width={{ base: 'full', sm: 'auto' }}>
                    Submit lineup
                  </Button>
                  {eligibleEntries.length > 1 ? (
                    <NativeSelect.Root size="sm" maxW="xs">
                      <NativeSelect.Field
                        value={selectedEntryId}
                        onChange={(event) =>
                          setSelectedEntryId(event.currentTarget.value)
                        }
                      >
                        {eligibleEntries.map((entry) => (
                          <option key={entry.entry_id} value={entry.entry_id}>
                            #{entry.entry_number} — {entry.entry_name}
                          </option>
                        ))}
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  ) : null}
                </ButtonGroup>

                {state.error ? (
                  <Text color="fg.error" fontSize="sm">
                    {state.error}
                  </Text>
                ) : null}
                {state.success ? (
                  <Text color="fg.success" fontSize="sm">
                    {state.success}
                  </Text>
                ) : null}
              </Stack>
            </form>
          )}
        </PanelCard>
      ) : null}
    </PageStack>
  )
}
