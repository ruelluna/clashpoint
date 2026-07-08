import { notFound } from 'next/navigation'

import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEventWithPrize } from '@/features/events/queries'
import { ResultsEntryClient } from '@/features/results/components/results-entry-client'
import {
  listMatchesPendingResults,
  listResultsForEvent,
} from '@/features/results/queries'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

type EventResultsPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventResultsPage({ params }: EventResultsPageProps) {
  await requirePermission('events.view')
  const { id } = await params
  const event = await getEventWithPrize(id)

  if (!event) notFound()

  const [results, pendingMatches, user] = await Promise.all([
    listResultsForEvent(id),
    listMatchesPendingResults(id),
    getUser(),
  ])

  const canManage = user
    ? await hasPermission(user.id, 'results.manage')
    : false

  return (
    <div className="space-y-6">
      <EventDetailTabs eventId={event.id} eventName={event.name} />
      <ResultsEntryClient
        eventId={event.id}
        pendingMatches={pendingMatches}
        results={results}
        canManage={canManage}
      />
    </div>
  )
}
