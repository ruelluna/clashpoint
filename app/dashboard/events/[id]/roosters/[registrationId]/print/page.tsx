import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getEntry } from '@/features/entries/queries'
import { getEvent } from '@/features/events/queries'
import { CockEntryBarcodeSlip } from '@/features/printing/components/cock-entry-barcode-slip'
import { PageStack } from '@/components/dashboard'
import { Button } from '@chakra-ui/react'
import { createClient } from '@/lib/supabase/server'
import { requireAnyPermission } from '@/lib/auth/permissions'

type CockPrintPageProps = {
  params: Promise<{ id: string; registrationId: string }>
}

export default async function CockPrintPage({ params }: CockPrintPageProps) {
  await requireAnyPermission(['cock_entry.print', 'cock_entry.manage', 'entries.manage'])
  const { id, registrationId } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const supabase = await createClient()

  const { data: registration, error } = await supabase
    .from('rooster_event_registrations')
    .select(
      'id, entry_id, band_number, cock_entry_barcode, entries ( entry_number, owner_name, entry_name )'
    )
    .eq('id', registrationId)
    .eq('event_id', id)
    .maybeSingle()

  if (error || !registration?.cock_entry_barcode) notFound()

  const entry = registration.entries as {
    entry_number: string
    owner_name: string
    entry_name: string
  } | null

  const entryRow = await getEntry(registration.entry_id as string)
  const entryName = entryRow?.entry_name ?? entry?.entry_name ?? '—'

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <PageStack maxW="md">
        <CockEntryBarcodeSlip
          eventName={event.name}
          entryNumber={entry?.entry_number ?? entryRow?.entry_number ?? '—'}
          ownerName={entry?.owner_name ?? entryRow?.owner_name ?? '—'}
          entryName={entryName}
          bandNumber={registration.band_number as string}
          cockEntryBarcode={registration.cock_entry_barcode as string}
        />
        <Button asChild variant="outline" alignSelf="flex-start" className="no-print">
          <Link href={`/dashboard/events/${id}/roosters`}>Back to roosters</Link>
        </Button>
      </PageStack>
    </EventPageLayout>
  )
}
