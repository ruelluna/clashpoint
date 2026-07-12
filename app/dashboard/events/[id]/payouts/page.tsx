import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard'
import { getEventWithPrize } from '@/features/events/queries'
import { PayoutsClient } from '@/features/payouts/components/payouts-client'
import { listPayoutsByEvent } from '@/features/payouts/queries'
import { computePrizePoolForEvent } from '@/features/prizes/service'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

type EventPayoutsPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventPayoutsPage({ params }: EventPayoutsPageProps) {
  await requirePermission('payouts.manage')
  const { id } = await params
  const event = await getEventWithPrize(id)

  if (!event) notFound()

  const [payouts, prizePool, user] = await Promise.all([
    listPayoutsByEvent(id),
    computePrizePoolForEvent(event),
    getUser(),
  ])
  const canManage = user ? await hasPermission(user.id, 'payouts.manage') : false

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <PayoutsClient
        eventId={event.id}
        payouts={payouts}
        prizePool={prizePool}
        canManage={canManage}
      />
    </EventPageLayout>
  )
}
