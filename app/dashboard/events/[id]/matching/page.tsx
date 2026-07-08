import { notFound } from 'next/navigation'

import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
import { MatchingBoardClient } from '@/features/matches/components/matching-board-client'
import {
  getEligibleRoostersForMatching,
  listMatchesByEvent,
} from '@/features/matches/queries'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

type MatchingPageProps = {
  params: Promise<{ id: string }>
}

export default async function MatchingPage({ params }: MatchingPageProps) {
  await requirePermission('events.view')
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const [matches, eligibleRoosters] = await Promise.all([
    listMatchesByEvent(id),
    getEligibleRoostersForMatching(id),
  ])

  const user = await getUser()
  const canManage = user ? await hasPermission(user.id, 'matches.manage') : false

  return (
    <>
      <EventDetailTabs eventId={event.id} eventName={event.name} />
      <MatchingBoardClient
        eventId={event.id}
        eventName={event.name}
        matches={matches}
        eligibleRoosters={eligibleRoosters}
        canManage={canManage}
      />
    </>
  )
}
