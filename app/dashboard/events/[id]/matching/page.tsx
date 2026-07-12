import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard'
import { getEvent } from '@/features/events/queries'
import { MatchingBoardClient } from '@/features/matches/components/matching-board-client'
import {
  getEligibleRoostersForMatching,
  listFightQueueByEvent,
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

  const [matches, queueMatches, eligibleRoosters] = await Promise.all([
    listMatchesByEvent(id),
    listFightQueueByEvent(id),
    getEligibleRoostersForMatching(id),
  ])

  const user = await getUser()
  const canManage = user ? await hasPermission(user.id, 'matches.manage') : false

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <MatchingBoardClient
        eventId={event.id}
        eventName={event.name}
        matches={matches}
        queueMatches={queueMatches}
        eligibleRoosters={eligibleRoosters}
        canManage={canManage}
      />
    </EventPageLayout>
  )
}
