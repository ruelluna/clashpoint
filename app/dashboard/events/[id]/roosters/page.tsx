import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { EventRoostersClient } from '@/features/event-roosters/components/event-roosters-client'
import { listRegistrationsByEvent } from '@/features/registrations/queries'
import { getEvent } from '@/features/events/queries'
import { listWeighingEntrySummaries } from '@/features/weighing/queries'
import { eventFeeSettingsFromRow } from '@/features/events/fee-utils'
import { requireAnyPermission } from '@/lib/auth/permissions'

type RoostersPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ highlight?: string }>
}

export default async function RoostersPage({ params, searchParams }: RoostersPageProps) {
  await requireAnyPermission(['cock_entry.manage', 'entries.manage'])
  const { id } = await params
  const { highlight } = await searchParams
  const event = await getEvent(id)
  if (!event) notFound()

  const [registrations, entries] = await Promise.all([
    listRegistrationsByEvent(id),
    listWeighingEntrySummaries(id, event.cocks_per_entry),
  ])

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <EventRoostersClient
        eventId={event.id}
        eventName={event.name}
        eventType={event.event_type}
        cocksPerEntry={event.cocks_per_entry}
        feeSettings={eventFeeSettingsFromRow(event)}
        registrations={registrations}
        entries={entries}
        highlightId={highlight}
      />
    </EventPageLayout>
  )
}
