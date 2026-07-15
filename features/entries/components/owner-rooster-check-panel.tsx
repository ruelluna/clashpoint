'use client'

import { Box, Link, Stack, Text } from '@chakra-ui/react'
import NextLink from 'next/link'

import { LAYOUT_GAP } from '@/components/dashboard'
import type { RegistrationListItem } from '@/features/registrations/types'
import type { WeighingEntrySummary } from '@/features/weighing/types'

type OwnerRoosterCheckPanelProps = {
  eventId: string
  entry: WeighingEntrySummary | null
  cocksPerEntry: number
  registrations: Pick<
    RegistrationListItem,
    'entry_id' | 'cock_number' | 'band_number' | 'handler_name'
  >[]
}

export function OwnerRoosterCheckPanel({
  eventId,
  entry,
  cocksPerEntry,
  registrations,
}: OwnerRoosterCheckPanelProps) {
  if (!entry) return null

  const ownerRoosters = registrations.filter(
    (registration) => registration.entry_id === entry.entry_id
  )

  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      rounded="md"
      p={4}
      bg="bg.subtle"
      data-testid="owner-rooster-check-panel"
    >
      <Stack gap={LAYOUT_GAP.form}>
        <Stack gap={1}>
          <Text fontWeight="semibold">
            #{entry.entry_number} {entry.owner_name}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {entry.rooster_count} of {cocksPerEntry} cock slot
            {cocksPerEntry === 1 ? '' : 's'} used
          </Text>
          <Link asChild fontSize="sm" color="fg.muted">
            <NextLink href={`/dashboard/events/${eventId}/owners/${entry.entry_id}`}>
              View owner details
            </NextLink>
          </Link>
        </Stack>

        {ownerRoosters.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            No roosters registered for this owner yet.
          </Text>
        ) : (
          <Stack gap={1} as="ul" listStyleType="disc" pl={5}>
            {ownerRoosters.map((registration) => (
              <Box as="li" key={`${registration.entry_id}-${registration.cock_number}`}>
                <Text fontSize="sm">
                  Cock #{registration.cock_number} · Band {registration.band_number}
                  {registration.handler_name ? ` · Handler: ${registration.handler_name}` : ''}
                </Text>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
