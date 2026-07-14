import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { listEntriesByEvent, getEntryIdByOwnerBarcode } from '@/features/entries/queries'
import { getEvent } from '@/features/events/queries'
import { eventFeeSettingsFromRow } from '@/features/events/fee-utils'
import { OwnersListClient } from '@/features/entries/components/owners-list-client'
import {
  PageHeader,
  PageStack,
  PanelCard,
} from '@/components/dashboard'
import { Button } from '@chakra-ui/react'
import { requireAnyPermission } from '@/lib/auth/permissions'
import {
  isOwnerBarcodeForEvent,
  normalizeOwnerBarcodeInput,
} from '@/features/entries/schema'

type OwnersListPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ barcode?: string }>
}

export default async function OwnersListPage({ params, searchParams }: OwnersListPageProps) {
  await requireAnyPermission(['owner_registration.manage', 'entries.manage', 'events.view'])
  const { id } = await params
  const { barcode: rawBarcode } = await searchParams
  const event = await getEvent(id)
  if (!event) notFound()

  if (rawBarcode && event.event_type === 'derby') {
    const barcode = normalizeOwnerBarcodeInput(rawBarcode)
    if (barcode && isOwnerBarcodeForEvent(barcode, id)) {
      const entryId = await getEntryIdByOwnerBarcode(id, barcode)
      if (entryId) {
        redirect(`/dashboard/events/${id}/owners/${entryId}`)
      }
    }
  }

  const entries = await listEntriesByEvent(id, event.cocks_per_entry)
  const eventFeeSettings = eventFeeSettingsFromRow(event)

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <PageStack>
        <PageHeader
          title="Owners"
          description="Register owners and game farms first. Add roosters on the Roosters tab — registration fees stay pending until Payments when enabled."
          actions={
            <Button asChild>
              <Link href={`/dashboard/events/${id}/owners/new`}>Register owner</Link>
            </Button>
          }
        />

        <PanelCard title="Registered owners">
          <OwnersListClient
            eventId={event.id}
            eventType={event.event_type}
            entries={entries}
            eventFeeSettings={eventFeeSettings}
          />
        </PanelCard>
      </PageStack>
    </EventPageLayout>
  )
}
