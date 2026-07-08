import { notFound } from 'next/navigation'
import { Box } from '@chakra-ui/react'

import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
import { getFinalizationSummary } from '@/features/winners/queries'
import { WinnersClient } from '@/features/winners/components/winners-client'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

type EventWinnersPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventWinnersPage({ params }: EventWinnersPageProps) {
  await requirePermission('events.view')
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const [summary, user] = await Promise.all([getFinalizationSummary(id), getUser()])
  const canManage = user ? await hasPermission(user.id, 'winners.manage') : false

  if (!summary) notFound()

  return (
    <Box className="space-y-6">
      <EventDetailTabs eventId={event.id} eventName={event.name} />
      <WinnersClient eventId={event.id} summary={summary} canManage={canManage} />
    </Box>
  )
}
