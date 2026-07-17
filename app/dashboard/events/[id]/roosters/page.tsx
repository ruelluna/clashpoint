import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { EventRoostersClient } from '@/features/event-roosters/components/event-roosters-client'
import { getEntryFormEligibilityContext } from '@/features/eligibility/registration-bridge'
import {
  getPublicReferenceOptions,
  getRoosterEntryCatalog,
} from '@/features/reference-values/catalog'
import { getEntryIdByOwnerBarcode } from '@/features/entries/queries'
import {
  isOwnerBarcodeForEvent,
  normalizeOwnerBarcodeInput,
} from '@/features/entries/schema'
import { listRegistrationsByEvent } from '@/features/registrations/queries'
import { getEvent } from '@/features/events/queries'
import { listWeighingEntrySummaries } from '@/features/weighing/queries'
import { eventFeeSettingsFromRow } from '@/features/events/fee-utils'
import { requireAnyPermission } from '@/lib/auth/permissions'

type RoostersPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ highlight?: string; entryId?: string; barcode?: string }>
}

export default async function RoostersPage({ params, searchParams }: RoostersPageProps) {
  await requireAnyPermission(['cock_entry.manage', 'entries.manage'])
  const { id } = await params
  const { highlight, entryId: rawEntryId, barcode: rawBarcode } = await searchParams
  const event = await getEvent(id)
  if (!event) notFound()

  let initialEntryId = rawEntryId ?? undefined

  if (!initialEntryId && rawBarcode) {
    const barcode = normalizeOwnerBarcodeInput(rawBarcode)
    if (barcode && isOwnerBarcodeForEvent(barcode, id)) {
      const resolvedEntryId = await getEntryIdByOwnerBarcode(id, barcode)
      if (resolvedEntryId) {
        initialEntryId = resolvedEntryId
      }
    }
  }

  const [registrations, entries, eligibilityContext, catalog] = await Promise.all([
    listRegistrationsByEvent(id),
    listWeighingEntrySummaries(id, event.cocks_per_entry),
    getEntryFormEligibilityContext(id),
    getRoosterEntryCatalog(),
  ])

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <EventRoostersClient
        eventId={event.id}
        eventName={event.name}
        eventType={event.event_type}
        cocksPerEntry={event.cocks_per_entry}
        feeSettings={eventFeeSettingsFromRow(event)}
        registrations={registrations}
        entries={entries}
        eligibilityContext={eligibilityContext}
        catalog={catalog}
        highlightId={highlight}
        initialEntryId={initialEntryId}
      />
    </EventPageLayout>
  )
}
