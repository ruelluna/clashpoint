import { notFound } from 'next/navigation'

import { EventFormClient } from '@/features/events/components/event-form-client'
import { getEventWithPrize } from '@/features/events/queries'
import { getDerbyEligibilityPolicy } from '@/features/eligibility/queries'
import { listPromoters } from '@/features/promoters/queries'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

type EditEventPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  await requirePermission('events.view')
  const { id } = await params
  const [event, promoters, user, policy] = await Promise.all([
    getEventWithPrize(id),
    listPromoters('active'),
    getUser(),
    getDerbyEligibilityPolicy(id),
  ])

  if (!event) notFound()

  const [canManage, canManageEligibility] = user
    ? await Promise.all([
        hasPermission(user.id, 'events.manage'),
        hasPermission(user.id, 'derby_eligibility.manage'),
      ])
    : [false, false]

  return (
    <EventFormClient
      mode="edit"
      event={event}
      promoters={promoters}
      canManage={canManage}
      eligibilityPolicy={policy}
      canManageEligibility={canManageEligibility}
    />
  )
}
