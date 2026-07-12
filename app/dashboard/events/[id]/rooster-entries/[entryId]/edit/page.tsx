import { notFound } from 'next/navigation'
import { Box } from '@chakra-ui/react'

import { EntryEditClient } from '@/features/entries/components/entry-edit-client'
import { getEntry, listEntryRoostersForEdit } from '@/features/entries/queries'
import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
import { listPromoters } from '@/features/promoters/queries'
import { requirePermission } from '@/lib/auth/permissions'

type EditRoosterEntryPageProps = {
  params: Promise<{ id: string; entryId: string }>
}

export default async function EditRoosterEntryPage({ params }: EditRoosterEntryPageProps) {
  await requirePermission('entries.manage')
  const { id: eventId, entryId } = await params

  const [event, entry, promoters, roosters] = await Promise.all([
    getEvent(eventId),
    getEntry(entryId),
    listPromoters('active'),
    listEntryRoostersForEdit(eventId, entryId),
  ])

  if (!event || !entry || entry.event_id !== eventId) notFound()

  return (
    <Box className="space-y-6">
      <EventDetailTabs eventId={event.id} eventName={event.name} />
      <EntryEditClient
        eventId={event.id}
        eventName={event.name}
        entry={entry}
        roosters={roosters}
        promoters={promoters}
        minWeight={event.min_weight}
        maxWeight={event.max_weight}
      />
    </Box>
  )
}
