import { notFound } from 'next/navigation'

import { EventFormClient } from '@/features/events/components/event-form-client'
import { getEventWithPrize } from '@/features/events/queries'
import { listPromoters } from '@/features/promoters/queries'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

type EditEventPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  await requirePermission('events.view')
  const { id } = await params
  const [event, promoters, user] = await Promise.all([
    getEventWithPrize(id),
    listPromoters('active'),
    getUser(),
  ])

  if (!event) notFound()

  const canManage = user ? await hasPermission(user.id, 'events.manage') : false

  return (
    <EventFormClient
      mode="edit"
      event={event}
      promoters={promoters}
      canManage={canManage}
    />
  )
}
