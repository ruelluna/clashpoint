import { notFound } from 'next/navigation'

import { PublicEventNav } from '@/features/public/components/public-event-nav'
import { PublicMatchesList } from '@/features/public/components/public-matches-list'
import { getPublicEvent, getPublicMatches } from '@/features/public/queries'

type PublicMatchesPageProps = {
  params: Promise<{ id: string }>
}

export default async function PublicMatchesPage({ params }: PublicMatchesPageProps) {
  const { id } = await params
  const [event, matches] = await Promise.all([
    getPublicEvent(id),
    getPublicMatches(id),
  ])

  if (!event) notFound()
  if (matches === null) notFound()

  return (
    <div className="space-y-6">
      <PublicEventNav event={event} />
      <PublicMatchesList matches={matches} />
    </div>
  )
}
