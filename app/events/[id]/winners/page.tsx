import { Stack } from '@chakra-ui/react'
import { notFound } from 'next/navigation'

import { PublicEventNav } from '@/features/public/components/public-event-nav'
import { PublicWinnersList } from '@/features/public/components/public-winners-list'
import { getPublicEvent, getPublicWinners } from '@/features/public/queries'

type PublicWinnersPageProps = {
  params: Promise<{ id: string }>
}

export default async function PublicWinnersPage({ params }: PublicWinnersPageProps) {
  const { id } = await params
  const [event, winners] = await Promise.all([
    getPublicEvent(id),
    getPublicWinners(id),
  ])

  if (!event) notFound()
  if (winners === null) notFound()

  return (
    <Stack gap={6}>
      <PublicEventNav event={event} />
      <PublicWinnersList winners={winners} showAmounts={event.publish_prize_amounts} />
    </Stack>
  )
}
