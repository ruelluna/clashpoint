import { notFound } from 'next/navigation'
import { Box } from '@chakra-ui/react'

import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
import { WeighingStationClient } from '@/features/weighing/components/weighing-station-client'
import { listWeighingStationItems } from '@/features/weighing/queries'
import { requirePermission } from '@/lib/auth/permissions'

type WeighingPageProps = {
  params: Promise<{ id: string }>
}

export default async function WeighingPage({ params }: WeighingPageProps) {
  await requirePermission('weighing.manage')
  const { id: eventId } = await params

  const event = await getEvent(eventId)
  if (!event) notFound()

  const items = await listWeighingStationItems(eventId)

  return (
    <Box className="space-y-6">
      <EventDetailTabs eventId={event.id} eventName={event.name} />
      <WeighingStationClient
        eventId={event.id}
        minWeight={event.min_weight}
        maxWeight={event.max_weight}
        items={items}
      />
    </Box>
  )
}
