'use client'

import { Box, Button, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState } from 'react'

import { ButtonGroup, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import { deleteEntryAction, type EntryActionState } from '@/features/entries/actions'
import { ENTRY_SOURCE_LABELS } from '@/features/entries/schema'
import type { EntryListItem } from '@/features/entries/types'

type RoosterEntriesClientProps = {
  eventId: string
  eventName: string
  entries: EntryListItem[]
}

type DeleteEntryButtonProps = {
  eventId: string
  entryId: string
  entryNumber: string
}

function DeleteEntryButton({ eventId, entryId, entryNumber }: DeleteEntryButtonProps) {
  const [state, action, pending] = useActionState(deleteEntryAction, {} as EntryActionState)

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete entry #${entryNumber}? This cannot be undone from the roster list.`
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="entryId" value={entryId} />
      <Flex direction="column" align="flex-end" gap={1}>
        <Button type="submit" size="sm" variant="outline" colorPalette="red" loading={pending}>
          Delete
        </Button>
        {state.error ? (
          <Text fontSize="xs" color="red.500" maxW="12rem" textAlign="right">
            {state.error}
          </Text>
        ) : null}
      </Flex>
    </form>
  )
}

export function RoosterEntriesClient({
  eventId,
  eventName,
  entries,
}: RoosterEntriesClientProps) {
  return (
    <PageStack>
      <PageHeader
        title="Rooster Entries"
        description={`${eventName} · ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}. Register owners first, then add roosters per event format.`}
        actions={
          <Button asChild alignSelf={{ base: 'flex-start', sm: 'auto' }}>
            <Link href={`/dashboard/events/${eventId}/rooster-entries/new`}>New entry</Link>
          </Button>
        }
      />

      <PanelCard flush>
        <Flex
          px={4}
          py={4}
          borderBottomWidth="1px"
          borderColor="border"
          fontWeight="medium"
          fontSize="sm"
          display={{ base: 'none', lg: 'flex' }}
        >
          <Box flex="0.6">Entry #</Box>
          <Box flex="1.4">Owner / Game Farm</Box>
          <Box flex="0.8">Cocks</Box>
          <Box flex="0.8" textAlign="right">
            Actions
          </Box>
        </Flex>

        {entries.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No entries yet.</Text>
            <Button asChild mt={4} size="sm">
              <Link href={`/dashboard/events/${eventId}/rooster-entries/new`}>
                Register first entry
              </Link>
            </Button>
          </Box>
        ) : (
          entries.map((entry) => (
            <Box
              key={entry.id}
              px={4}
              py={4}
              borderBottomWidth="1px"
              borderColor="border"
            >
              <Flex
                direction={{ base: 'column', lg: 'row' }}
                gap={3}
                align={{ lg: 'center' }}
              >
                <Box flex="0.6">
                  <Text fontWeight="semibold">#{entry.entry_number}</Text>
                </Box>
                <Box flex="1.4">
                  <Text fontWeight="medium">{entry.owner_name}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {ENTRY_SOURCE_LABELS[entry.entry_source]}
                    {entry.promoter_name ? ` · ${entry.promoter_name}` : ''}
                    {entry.contact_full_name ? ` · ${entry.contact_full_name}` : ''}
                  </Text>
                </Box>
                <Box flex="0.8">
                  <Text fontSize="sm">
                    {entry.rooster_count}/{entry.cocks_per_entry} cock
                    {entry.cocks_per_entry === 1 ? '' : 's'}
                  </Text>
                </Box>
                <Box flex="0.8">
                  <ButtonGroup justify={{ base: 'flex-start', lg: 'flex-end' }}>
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/dashboard/events/${eventId}/rooster-entries/${entry.id}/edit`}
                      >
                        Edit
                      </Link>
                    </Button>
                    <DeleteEntryButton
                      eventId={eventId}
                      entryId={entry.id}
                      entryNumber={entry.entry_number}
                    />
                  </ButtonGroup>
                </Box>
              </Flex>
            </Box>
          ))
        )}
      </PanelCard>
    </PageStack>
  )
}
