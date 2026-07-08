import { notFound } from 'next/navigation'

import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
import { FightQueueClient } from '@/features/matches/components/fight-queue-client'
import { listFightQueueByEvent } from '@/features/matches/queries'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

type FightQueuePageProps = {
  params: Promise<{ id: string }>
}

export default async function FightQueuePage({ params }: FightQueuePageProps) {
  await requirePermission('events.view')
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const matches = await listFightQueueByEvent(id)

  const user = await getUser()
  const canManage = user ? await hasPermission(user.id, 'matches.manage') : false

  return (
    <>
      <EventDetailTabs eventId={event.id} eventName={event.name} />
      <FightQueueClient
        eventId={event.id}
        eventName={event.name}
        matches={matches}
        canManage={canManage}
      />
    </>
  )
}
