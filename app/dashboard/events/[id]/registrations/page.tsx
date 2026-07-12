import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard'
import { RegistrationReviewClient } from '@/features/registrations/components/registration-review-client'
import { listRegistrationsByEvent } from '@/features/registrations/queries'
import { getEvent } from '@/features/events/queries'
import { requirePermission } from '@/lib/auth/permissions'

type RegistrationsPageProps = {
  params: Promise<{ id: string }>
}

export default async function RegistrationsPage({ params }: RegistrationsPageProps) {
  await requirePermission('rooster_event_registration.view')
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const registrations = await listRegistrationsByEvent(id)

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <RegistrationReviewClient
        eventId={event.id}
        eventName={event.name}
        registrations={registrations}
      />
    </EventPageLayout>
  )
}
