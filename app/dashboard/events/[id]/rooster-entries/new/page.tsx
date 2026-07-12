import { notFound } from 'next/navigation'

import { EntryFormClient } from '@/features/entries/components/entry-form-client'
import { getEntryFormEligibilityContext } from '@/features/eligibility/registration-bridge'
import { getEvent } from '@/features/events/queries'
import { listPromoters } from '@/features/promoters/queries'
import { EventPageLayout } from '@/components/dashboard'
import { requirePermission } from '@/lib/auth/permissions'

type NewRoosterEntryPageProps = {
  params: Promise<{ id: string }>
}

export default async function NewRoosterEntryPage({ params }: NewRoosterEntryPageProps) {
  await requirePermission('entries.manage')
  const { id } = await params
  const [event, promoters, eligibilityContext] = await Promise.all([
    getEvent(id),
    listPromoters('active'),
    getEntryFormEligibilityContext(id),
  ])

  if (!event) notFound()

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <EntryFormClient
        eventId={event.id}
        eventName={event.name}
        promoters={promoters}
        cocksPerEntry={event.cocks_per_entry}
        minWeight={event.min_weight}
        maxWeight={event.max_weight}
        eligibilityContext={eligibilityContext}
      />
    </EventPageLayout>
  )
}
