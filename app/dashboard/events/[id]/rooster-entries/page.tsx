import { notFound } from 'next/navigation'
import { Box } from '@chakra-ui/react'

import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
import { LineupsClient } from '@/features/lineups/components/lineups-client'
import {
  listLineupSummariesByEvent,
  listRoostersByEntry,
} from '@/features/lineups/queries'
import { requirePermission } from '@/lib/auth/permissions'

type LineupsPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ entry?: string }>
}

export default async function LineupsPage({
  params,
  searchParams,
}: LineupsPageProps) {
  await requirePermission('lineups.manage')
  const { id: eventId } = await params
  const { entry: entryParam } = await searchParams

  const event = await getEvent(eventId)
  if (!event) notFound()

  const summaries = await listLineupSummariesByEvent(eventId)
  const selectedEntryId =
    entryParam ??
    summaries.find((entry) => entry.can_submit)?.entry_id ??
    summaries[0]?.entry_id ??
    null

  const existingRoosters = selectedEntryId
    ? await listRoostersByEntry(selectedEntryId)
    : []

  return (
    <Box className="space-y-6">
      <EventDetailTabs eventId={event.id} eventName={event.name} />
      <LineupsClient
        eventId={event.id}
        cocksPerEntry={event.cocks_per_entry}
        summaries={summaries}
        selectedEntryId={selectedEntryId}
        existingRoosters={existingRoosters}
      />
    </Box>
  )
}
