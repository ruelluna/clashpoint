import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { notFound, redirect } from 'next/navigation'

import { InspectionStationClient } from '@/features/inspection/components/inspection-station-client'
import { getRegistrationIdByCockEntryBarcode, listInspectionQueue } from '@/features/inspection/queries'
import { getEvent } from '@/features/events/queries'
import { eventFeeSettingsFromRow } from '@/features/events/fee-utils'
import {
  isCockEntryBarcodeForEvent,
  normalizeCockEntryBarcodeInput,
} from '@/features/entries/schema'
import { requireAnyPermission, hasPermission } from '@/lib/auth/permissions'

type InspectionPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ highlight?: string; barcode?: string }>
}

export default async function InspectionPage({ params, searchParams }: InspectionPageProps) {
  const profile = await requireAnyPermission([
    'inspection.record',
    'weighing.verify',
    'weighing.record',
    'entries.manage',
  ])
  const { id } = await params
  const { highlight: rawHighlight, barcode: rawBarcode } = await searchParams
  const event = await getEvent(id)

  if (!event) notFound()
  if (!event.physical_inspection_required) {
    redirect(`/dashboard/events/${event.id}`)
  }

  let highlightRegistrationId = rawHighlight ?? undefined

  if (!highlightRegistrationId && rawBarcode) {
    const barcode = normalizeCockEntryBarcodeInput(rawBarcode)
    if (barcode && isCockEntryBarcodeForEvent(barcode, id)) {
      const registrationId = await getRegistrationIdByCockEntryBarcode(id, barcode)
      if (registrationId) {
        highlightRegistrationId = registrationId
      }
    }
  }

  const [items, canManageEvent] = await Promise.all([
    listInspectionQueue(id),
    hasPermission(profile.id, 'events.manage'),
  ])

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <InspectionStationClient
        eventId={event.id}
        eventName={event.name}
        eventStatus={event.status}
        eventType={event.event_type}
        feeSettings={eventFeeSettingsFromRow(event)}
        canManageEvent={canManageEvent}
        items={items}
        highlightRegistrationId={highlightRegistrationId}
      />
    </EventPageLayout>
  )
}
