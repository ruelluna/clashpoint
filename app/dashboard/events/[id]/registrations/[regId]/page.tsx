import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard'
import { RegistrationDetailClient } from '@/features/registrations/components/registration-detail-client'
import { getRegistrationWithRelations } from '@/features/registrations/queries'
import { getEvent } from '@/features/events/queries'
import { getUser } from '@/lib/auth/session'
import { hasAnyPermission, hasPermission, requirePermission } from '@/lib/auth/permissions'

type RegistrationDetailPageProps = {
  params: Promise<{ id: string; regId: string }>
}

export default async function RegistrationDetailPage({
  params,
}: RegistrationDetailPageProps) {
  await requirePermission('rooster_event_registration.view')
  const { id, regId } = await params

  const [event, registration, user] = await Promise.all([
    getEvent(id),
    getRegistrationWithRelations(id, regId),
    getUser(),
  ])

  if (!event || !registration) notFound()

  const permissions = user
    ? {
        canSubmit: await hasPermission(user.id, 'rooster_event_registration.submit'),
        canApprove: await hasPermission(user.id, 'rooster_event_registration.approve'),
        canConditionallyApprove: await hasPermission(
          user.id,
          'rooster_event_registration.conditionally_approve'
        ),
        canReject: await hasPermission(user.id, 'rooster_event_registration.reject'),
        canRevoke: await hasPermission(user.id, 'rooster_event_registration.revoke_approval'),
        canEvaluate: await hasAnyPermission(user.id, [
          'derby_eligibility.view',
          'derby_eligibility.manage',
        ]),
      }
    : {
        canSubmit: false,
        canApprove: false,
        canConditionallyApprove: false,
        canReject: false,
        canRevoke: false,
        canEvaluate: false,
      }

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <RegistrationDetailClient
        eventId={event.id}
        eventName={event.name}
        registration={registration}
        permissions={permissions}
      />
    </EventPageLayout>
  )
}
