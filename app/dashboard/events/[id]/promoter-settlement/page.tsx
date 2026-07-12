import { notFound } from 'next/navigation'
import { Text } from '@chakra-ui/react'
import Link from 'next/link'

import { EventPageLayout, PanelCard } from '@/components/dashboard'
import { getEventWithPrize } from '@/features/events/queries'
import { SettlementClient } from '@/features/promoter-settlements/components/settlement-client'
import { getSettlementByEvent } from '@/features/promoter-settlements/queries'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

type EventPromoterSettlementPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventPromoterSettlementPage({
  params,
}: EventPromoterSettlementPageProps) {
  await requirePermission('settlements.manage')
  const { id } = await params
  const event = await getEventWithPrize(id)

  if (!event) notFound()

  if (!event.promoter_id) {
    return (
      <EventPageLayout eventId={event.id} eventName={event.name}>
        <PanelCard title="No promoter assigned">
          <Text fontSize="sm" color="fg.muted">
            Promoter settlement applies only to events with an external promoter. Edit the
            event to assign a promoter, or return to the{' '}
            <Link href={`/dashboard/events/${event.id}`}>event overview</Link>.
          </Text>
        </PanelCard>
      </EventPageLayout>
    )
  }

  const [settlement, user] = await Promise.all([
    getSettlementByEvent(id),
    getUser(),
  ])
  const canManage = user ? await hasPermission(user.id, 'settlements.manage') : false

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <SettlementClient
        eventId={event.id}
        settlement={settlement}
        promoterName={event.promoter_name}
        canManage={canManage}
      />
    </EventPageLayout>
  )
}
