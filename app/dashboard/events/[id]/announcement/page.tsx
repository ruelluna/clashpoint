import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard'
import { getEventWithPrize } from '@/features/events/queries'
import { listPayoutsByEvent } from '@/features/payouts/queries'
import { AnnouncementClient } from '@/features/winners/components/announcement-client'
import { getFinalizationSummary } from '@/features/winners/queries'
import { generateAnnouncementText } from '@/features/winners/utils'
import { requirePermission } from '@/lib/auth/permissions'

type EventAnnouncementPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventAnnouncementPage({
  params,
}: EventAnnouncementPageProps) {
  await requirePermission('events.view')
  const { id } = await params
  const event = await getEventWithPrize(id)

  if (!event) notFound()

  const [summary, payouts] = await Promise.all([
    getFinalizationSummary(id),
    listPayoutsByEvent(id),
  ])

  if (!summary) notFound()

  const payoutByEntry = new Map(payouts.map((row) => [row.entryId, row]))
  const championWinners = summary.winners.filter((row) => row.isChampion)

  const announcementWinners =
    championWinners.length > 0
      ? championWinners.map((winner) => {
          const payout = payoutByEntry.get(winner.entryId)
          return {
            label: payout?.rankLabel ?? `Rank ${winner.rank}`,
            entryName: winner.entryName,
            entryNumber: winner.entryNumber,
            ownerName: winner.ownerName,
            amount: payout?.amount ?? null,
            showAmounts: event.publish_prize_amounts,
          }
        })
      : summary.winners.slice(0, 3).map((winner) => {
          const payout = payoutByEntry.get(winner.entryId)
          return {
            label: payout?.rankLabel ?? `Rank ${winner.rank}`,
            entryName: winner.entryName,
            entryNumber: winner.entryNumber,
            ownerName: winner.ownerName,
            amount: payout?.amount ?? null,
            showAmounts: event.publish_prize_amounts,
          }
        })

  const announcementText = generateAnnouncementText({
    eventName: event.name,
    venue: event.venue,
    eventDate: event.event_date,
    winners: announcementWinners,
    tieBreakerRule: summary.tieBreakerRule,
    notes: summary.finalization?.notes,
  })

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <AnnouncementClient
        announcementText={announcementText}
        isFinalized={summary.finalization != null}
      />
    </EventPageLayout>
  )
}
