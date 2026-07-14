'use client'

import { Box, Button, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'

import { PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import { ENTRY_SOURCE_LABELS } from '@/features/entries/schema'
import type { EntryListItem } from '@/features/entries/types'

type EntriesListClientProps = {
  eventId: string
  eventName: string
  entries: EntryListItem[]
}

export function EntriesListClient({
  eventId,
  eventName,
  entries,
}: EntriesListClientProps) {
  return (
    <PageStack>
      <PageHeader
        title="Rooster Entries"
        description={`${eventName} · ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}. Event roster — add roosters and weights on Weighing; matching happens later.`}
        actions={
          <Button asChild alignSelf={{ base: 'flex-start', sm: 'auto' }}>
            <Link href={`/dashboard/events/${eventId}/rooster-entries/new`}>
              New entry
            </Link>
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
          <Box flex="0.6">#</Box>
          <Box flex="1.4">Entry</Box>
          <Box flex="1">Owner</Box>
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
                  {entry.contact_full_name ? (
                    <Text fontSize="xs" color="fg.muted">
                      {entry.contact_full_name}
                      {entry.contact_designation ? ` · ${entry.contact_designation}` : ''}
                    </Text>
                  ) : null}
                </Box>
              </Flex>
            </Box>
          ))
        )}
      </PanelCard>
    </PageStack>
  )
}
