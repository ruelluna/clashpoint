import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { notFound } from 'next/navigation'

import { getEvent } from '@/features/events/queries'
import { MatchingBoardClient } from '@/features/matches/components/matching-board-client'
import {
  getEligibleRoostersForMatching,
  listAwaitingPaymentMatches,
  listFightQueueByEvent,
} from '@/features/matches/queries'
import { listSettlingMatchesWithObligations } from '@/features/matches/match-settling-service'
import { listVerifiedResultMatchIds } from '@/features/results/queries'
import { getUser } from '@/lib/auth/session'
import { getProfile } from '@/lib/auth/queries'
import {
  canPerformEventOperation,
  hasPermission,
  isSystemOwnerRole,
  requirePermission,
} from '@/lib/auth/permissions'

type MatchingPageProps = {
  params: Promise<{ id: string }>
}

export default async function MatchingPage({ params }: MatchingPageProps) {
  await requirePermission('events.view')
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const [awaitingPaymentMatches, queueMatches, eligibleRoosters, verifiedResultMatchIds, settlingMatches, user] =
    await Promise.all([
      listAwaitingPaymentMatches(id),
      listFightQueueByEvent(id),
      getEligibleRoostersForMatching(id),
      listVerifiedResultMatchIds(id),
      listSettlingMatchesWithObligations(id),
      getUser(),
    ])

  const profile = user ? await getProfile(user.id) : null
  const canManage = user && profile
    ? await canPerformEventOperation(profile, user.id, ['matches.manage'])
    : false
  const canManagePalitada = user && profile
    ? await canPerformEventOperation(profile, user.id, [
        'matches.palitada.manage',
        'matches.manage',
      ])
    : false
  const canManageQueueOverride = Boolean(profile && isSystemOwnerRole(profile.role))
  const canSettle = canManage
  const canRecordResult = user ? await hasPermission(user.id, 'results.manage') : false

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <MatchingBoardClient
        eventId={event.id}
        eventName={event.name}
        awaitingPaymentMatches={awaitingPaymentMatches}
        queueMatches={queueMatches}
        settlingMatches={settlingMatches}
        eligibleRoosters={eligibleRoosters}
        verifiedResultMatchIds={verifiedResultMatchIds}
        taxPerFight={event.tax_per_fight}
        taxCommissionRate={event.tax_commission}
        canManage={canManage}
        canManagePalitada={canManagePalitada}
        canManageQueueOverride={canManageQueueOverride}
        canSettle={canSettle}
        canRecordResult={canRecordResult}
      />
    </EventPageLayout>
  )
}
