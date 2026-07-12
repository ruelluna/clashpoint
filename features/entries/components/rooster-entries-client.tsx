'use client'

import { Box, Button, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState } from 'react'

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
  entryName: string
}

function DeleteEntryButton({ eventId, entryId, entryName }: DeleteEntryButtonProps) {
  const [state, action, pending] = useActionState(deleteEntryAction, {} as EntryActionState)

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete entry "${entryName}"? This cannot be undone from the roster list.`
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
    <Flex direction="column" gap={8}>
      <Flex
        justify="space-between"
        align={{ base: 'stretch', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={3}
      >
        <Box>
          <Text fontSize="lg" fontWeight="semibold">
            Rooster Entries
          </Text>
          <Text color="fg.muted" fontSize="sm">
            {eventName} · {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
          </Text>
          <Text color="fg.muted" fontSize="sm" mt={1}>
            Use New entry to register an owner and cock. Edit or delete entries from the list.
          </Text>
        </Box>
        <Button asChild alignSelf={{ base: 'flex-start', sm: 'auto' }}>
          <Link href={`/dashboard/events/${eventId}/rooster-entries/new`}>New entry</Link>
        </Button>
      </Flex>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        <Flex
          px={4}
          py={4}
          borderBottomWidth="1px"
          borderColor="border"
          fontWeight="medium"
          fontSize="sm"
          display={{ base: 'none', lg: 'flex' }}
        >
          <Box flex="0.6">#</Box>
          <Box flex="1.4">Entry</Box>
          <Box flex="1">Owner</Box>
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
                  <Text fontWeight="semibold">{entry.entry_number}</Text>
                </Box>
                <Box flex="1.4">
                  <Text fontWeight="medium">{entry.entry_name}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {ENTRY_SOURCE_LABELS[entry.entry_source]}
                    {entry.promoter_name ? ` · ${entry.promoter_name}` : ''}
                  </Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">{entry.owner_name}</Text>
                  {entry.handler_name ? (
                    <Text fontSize="xs" color="fg.muted">
                      Handler: {entry.handler_name}
                    </Text>
                  ) : null}
                </Box>
                <Box flex="0.8">
                  <Flex
                    gap={2}
                    justify={{ base: 'flex-start', lg: 'flex-end' }}
                    align="center"
                    wrap="wrap"
                  >
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
                      entryName={entry.entry_name}
                    />
                  </Flex>
                </Box>
              </Flex>
            </Box>
          ))
        )}
      </Box>
    </Flex>
  )
}
