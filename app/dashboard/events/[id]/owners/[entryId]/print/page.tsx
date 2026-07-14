import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getEntry } from '@/features/entries/queries'
import { getEvent } from '@/features/events/queries'
import { eventFeeSettingsFromRow } from '@/features/events/fee-utils'
import { OwnerBarcodeSlip } from '@/features/printing/components/owner-barcode-slip'
import { PageStack } from '@/components/dashboard'
import { Button } from '@chakra-ui/react'
import { requireAnyPermission } from '@/lib/auth/permissions'

type OwnerPrintPageProps = {
  params: Promise<{ id: string; entryId: string }>
}

export default async function OwnerPrintPage({ params }: OwnerPrintPageProps) {
  await requireAnyPermission(['owner_registration.print', 'owner_registration.manage', 'entries.manage'])
  const { id, entryId } = await params
  const [event, entry] = await Promise.all([
    getEvent(id),
    getEntry(entryId),
  ])

  if (!event || !entry || entry.event_id !== id) notFound()
  if (!entry.owner_barcode) notFound()

  const feeSettings = eventFeeSettingsFromRow(event)

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <PageStack maxW="md">
        <OwnerBarcodeSlip
          eventName={event.name}
          entryNumber={entry.entry_number}
          ownerName={entry.owner_name}
          handlerName={entry.handler_name}
          ownerBarcode={entry.owner_barcode}
          feeSettings={feeSettings}
        />
        <Button asChild variant="outline" alignSelf="flex-start" className="no-print">
          <Link href={`/dashboard/events/${id}/owners`}>Back to owners</Link>
        </Button>
      </PageStack>
    </EventPageLayout>
  )
}
