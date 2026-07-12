import { notFound } from 'next/navigation'

import { EntryEditClient } from '@/features/entries/components/entry-edit-client'
import { getEntryFormEligibilityContext } from '@/features/eligibility/registration-bridge'
import { getEntry, listEntryRoostersForEdit } from '@/features/entries/queries'
import { getCompetitor } from '@/features/competitors/queries'
import { getEvent } from '@/features/events/queries'
import { listPromoters } from '@/features/promoters/queries'
import { EventPageLayout } from '@/components/dashboard'
import { resolveEventWeightLimitsGrams } from '@/features/entries/weight-utils'
import { requirePermission } from '@/lib/auth/permissions'

type EditRoosterEntryPageProps = {
  params: Promise<{ id: string; entryId: string }>
}

export default async function EditRoosterEntryPage({ params }: EditRoosterEntryPageProps) {
  await requirePermission('entries.manage')
  const { id: eventId, entryId } = await params

  const [event, entry, promoters, roosters, eligibilityContext] = await Promise.all([
    getEvent(eventId),
    getEntry(entryId),
    listPromoters('active'),
    listEntryRoostersForEdit(eventId, entryId),
    getEntryFormEligibilityContext(eventId),
  ])

  if (!event || !entry || entry.event_id !== eventId) notFound()

  const linkedCompetitor = entry.competitor_id
    ? await getCompetitor(entry.competitor_id)
    : null

  const { minWeightGrams, maxWeightGrams } = resolveEventWeightLimitsGrams(event)

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <EntryEditClient
        eventId={event.id}
        eventName={event.name}
        eventType={event.event_type}
        cocksPerEntry={event.cocks_per_entry}
        entry={entry}
        roosters={roosters}
        promoters={promoters}
        linkedCompetitor={linkedCompetitor}
        minWeightGrams={minWeightGrams}
        maxWeightGrams={maxWeightGrams}
        eligibilityContext={eligibilityContext}
      />
    </EventPageLayout>
  )
}
