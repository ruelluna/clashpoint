import { notFound } from 'next/navigation'
import { Flex } from '@chakra-ui/react'

import { EntriesListClient } from '@/features/entries/components/entries-list-client'
import { listEntriesByEvent } from '@/features/entries/queries'
import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
import { requirePermission } from '@/lib/auth/permissions'

type RegistrationsPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventRegistrationsPage({
  params,
}: RegistrationsPageProps) {
  await requirePermission('entries.manage')
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const entries = await listEntriesByEvent(id)

  return (
    <Flex direction="column" gap={8}>
      <EventDetailTabs eventId={event.id} eventName={event.name} />
      <EntriesListClient
        eventId={event.id}
        eventName={event.name}
        entries={entries}
      />
    </Flex>
  )
}
