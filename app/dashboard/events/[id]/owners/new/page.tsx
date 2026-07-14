import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { notFound } from 'next/navigation'

import { OwnerEntryFormClient } from '@/features/entries/components/owner-entry-form-client'
import { getEvent } from '@/features/events/queries'
import { listPromoters } from '@/features/promoters/queries'
import { requireAnyPermission } from '@/lib/auth/permissions'

type NewOwnerEntryPageProps = {
  params: Promise<{ id: string }>
}

export default async function NewOwnerEntryPage({ params }: NewOwnerEntryPageProps) {
  await requireAnyPermission(['owner_registration.manage', 'entries.manage'])
  const { id } = await params
  const [event, promoters] = await Promise.all([
    getEvent(id),
    listPromoters('active'),
  ])

  if (!event) notFound()

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <OwnerEntryFormClient
        eventId={event.id}
        eventName={event.name}
        promoters={promoters}
      />
    </EventPageLayout>
  )
}
