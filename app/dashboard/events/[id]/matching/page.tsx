import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { notFound } from 'next/navigation'

import { getEvent } from '@/features/events/queries'
import { MatchingBoardClient } from '@/features/matches/components/matching-board-client'
import {
  getEligibleRoostersForMatching,
  listAwaitingPaymentMatches,
  listFightQueueByEvent,
} from '@/features/matches/queries'
import { listVerifiedResultMatchIds } from '@/features/results/queries'
import { getUser } from '@/lib/auth/session'
import { canOperateAsStaff } from '@/lib/auth/operational-access'
import { getProfile } from '@/lib/auth/queries'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

type MatchingPageProps = {
  params: Promise<{ id: string }>
}

export default async function MatchingPage({ params }: MatchingPageProps) {
  await requirePermission('events.view')
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const [awaitingPaymentMatches, queueMatches, eligibleRoosters, verifiedResultMatchIds, user] =
    await Promise.all([
      listAwaitingPaymentMatches(id),
      listFightQueueByEvent(id),
      getEligibleRoostersForMatching(id),
      listVerifiedResultMatchIds(id),
      getUser(),
    ])

  const profile = user ? await getProfile(user.id) : null
  const canManage =
    Boolean(user && profile) &&
    canOperateAsStaff(profile!) &&
    (await hasPermission(user!.id, 'matches.manage'))
  const canRecordResult = user ? await hasPermission(user.id, 'results.manage') : false

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <MatchingBoardClient
        eventId={event.id}
        eventName={event.name}
        awaitingPaymentMatches={awaitingPaymentMatches}
        queueMatches={queueMatches}
        eligibleRoosters={eligibleRoosters}
        verifiedResultMatchIds={verifiedResultMatchIds}
        taxPerFight={event.tax_per_fight}
        taxCommissionRate={event.tax_commission}
        canManage={canManage}
        canRecordResult={canRecordResult}
      />
    </EventPageLayout>
  )
}
