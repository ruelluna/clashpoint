import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { notFound } from 'next/navigation'

import { InspectionStationClient } from '@/features/inspection/components/inspection-station-client'
import { listInspectionQueue } from '@/features/inspection/queries'
import { getEvent } from '@/features/events/queries'
import { requireAnyPermission } from '@/lib/auth/permissions'

type InspectionPageProps = {
  params: Promise<{ id: string }>
}

export default async function InspectionPage({ params }: InspectionPageProps) {
  await requireAnyPermission([
    'inspection.record',
    'weighing.verify',
    'weighing.record',
    'entries.manage',
  ])
  const { id } = await params
  const [event, items] = await Promise.all([getEvent(id), listInspectionQueue(id)])

  if (!event) notFound()

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <InspectionStationClient
        eventId={event.id}
        eventName={event.name}
        items={items}
      />
    </EventPageLayout>
  )
}
