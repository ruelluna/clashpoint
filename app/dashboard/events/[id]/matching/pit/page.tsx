import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { notFound } from 'next/navigation'

import { getEvent } from '@/features/events/queries'
import { MatchingPitClient } from '@/features/matches/components/matching-pit-client'
import { listFightQueueByEvent } from '@/features/matches/queries'
import { getUser } from '@/lib/auth/session'
import { getProfile } from '@/lib/auth/queries'
import { canPerformEventOperation, requirePermission } from '@/lib/auth/permissions'

type MatchingPitPageProps = {
  params: Promise<{ id: string }>
}

export default async function MatchingPitPage({ params }: MatchingPitPageProps) {
  await requirePermission('events.view')
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const [queueMatches, user] = await Promise.all([listFightQueueByEvent(id), getUser()])
  const profile = user ? await getProfile(user.id) : null
  const canManagePalitada = user && profile
    ? await canPerformEventOperation(profile, user.id, [
        'matches.palitada.manage',
        'matches.manage',
      ])
    : false

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <MatchingPitClient
        eventId={event.id}
        eventName={event.name}
        queueMatches={queueMatches}
        taxPerFight={event.tax_per_fight}
        taxCommissionRate={event.tax_commission}
        canManagePalitada={canManagePalitada}
      />
    </EventPageLayout>
  )
}
