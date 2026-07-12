import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard'
import { getEventWithPrize } from '@/features/events/queries'
import { StandingsTableClient } from '@/features/standings/components/standings-table-client'
import { listStandingsForEvent } from '@/features/standings/queries'
import { requirePermission } from '@/lib/auth/permissions'

type EventStandingsPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventStandingsPage({
  params,
}: EventStandingsPageProps) {
  await requirePermission('standings.view')
  const { id } = await params
  const event = await getEventWithPrize(id)

  if (!event) notFound()

  const standings = await listStandingsForEvent(id)

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <StandingsTableClient standings={standings} />
    </EventPageLayout>
  )
}
