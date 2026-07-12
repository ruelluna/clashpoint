import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard'
import { getEvent } from '@/features/events/queries'
import { ReportsHubClient } from '@/features/reports/components/reports-hub-client'
import { requirePermission } from '@/lib/auth/permissions'

type EventReportsPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventReportsPage({ params }: EventReportsPageProps) {
  await requirePermission('reports.view')
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <ReportsHubClient eventId={event.id} eventName={event.name} />
    </EventPageLayout>
  )
}
