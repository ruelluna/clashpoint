import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { getEvent } from '@/features/events/queries'
import { RegistrationDetailClient } from '@/features/registrations/components/registration-detail-client'
import { getRegistrationWithRelations } from '@/features/registrations/queries'
import { hasPermission, requireAnyPermission } from '@/lib/auth/permissions'

type RoosterDetailPageProps = {
  params: Promise<{ id: string; registrationId: string }>
}

export default async function RoosterDetailPage({ params }: RoosterDetailPageProps) {
  const profile = await requireAnyPermission([
    'cock_entry.manage',
    'entries.manage',
    'rooster_event_registration.view',
  ])
  const { id, registrationId } = await params

  const [event, registration] = await Promise.all([
    getEvent(id),
    getRegistrationWithRelations(id, registrationId),
  ])

  if (!event || !registration) notFound()

  const [canManage, canReview, canApprove] = await Promise.all([
    hasPermission(profile.id, 'entries.manage'),
    hasPermission(profile.id, 'rooster_event_registration.review'),
    hasPermission(profile.id, 'rooster_event_registration.approve'),
  ])

  const permissions = {
    canSubmit: canManage || canReview,
    canApprove: canManage || canApprove,
    canConditionallyApprove: canManage || canApprove,
    canReject: canManage || canReview,
    canRevoke: canManage || canApprove,
    canEvaluate: canManage || canReview,
  }

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <RegistrationDetailClient
        eventId={event.id}
        eventName={event.name}
        eventType={event.event_type}
        registration={registration}
        permissions={permissions}
      />
    </EventPageLayout>
  )
}
