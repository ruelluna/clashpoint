import { notFound } from 'next/navigation'
import { Box } from '@chakra-ui/react'

import { EntryFormClient } from '@/features/entries/components/entry-form-client'
import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
import { listPromoters } from '@/features/promoters/queries'
import { requirePermission } from '@/lib/auth/permissions'

type NewRoosterEntryPageProps = {
  params: Promise<{ id: string }>
}

export default async function NewRoosterEntryPage({ params }: NewRoosterEntryPageProps) {
  await requirePermission('entries.manage')
  const { id } = await params
  const [event, promoters] = await Promise.all([getEvent(id), listPromoters('active')])

  if (!event) notFound()

  return (
    <Box className="space-y-6">
      <EventDetailTabs eventId={event.id} eventName={event.name} />
      <EntryFormClient
        eventId={event.id}
        eventName={event.name}
        promoters={promoters}
        cocksPerEntry={event.cocks_per_entry}
        minWeight={event.min_weight}
        maxWeight={event.max_weight}
      />
    </Box>
  )
}
