import { notFound } from 'next/navigation'

import { PublicEventNav } from '@/features/public/components/public-event-nav'
import { PublicStandingsTable } from '@/features/public/components/public-standings-table'
import { getPublicEvent, getPublicStandings } from '@/features/public/queries'

type PublicStandingsPageProps = {
  params: Promise<{ id: string }>
}

export default async function PublicStandingsPage({
  params,
}: PublicStandingsPageProps) {
  const { id } = await params
  const [event, standings] = await Promise.all([
    getPublicEvent(id),
    getPublicStandings(id),
  ])

  if (!event) notFound()
  if (standings === null) notFound()

  return (
    <div className="space-y-6">
      <PublicEventNav event={event} />
      <PublicStandingsTable standings={standings} />
    </div>
  )
}
