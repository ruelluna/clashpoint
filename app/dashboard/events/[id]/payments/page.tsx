import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { notFound } from 'next/navigation'

import { listEntriesByEvent } from '@/features/entries/queries'
import { eventFeeSettingsFromRow } from '@/features/events/fee-utils'
import { getEvent } from '@/features/events/queries'
import { listPaymentsByEvent } from '@/features/payments/service'
import { PaymentsLedgerClient } from '@/features/payments/components/payments-ledger-client'
import { requirePermission } from '@/lib/auth/permissions'

type PaymentsPageProps = {
  params: Promise<{ id: string }>
}

export default async function PaymentsPage({ params }: PaymentsPageProps) {
  await requirePermission('payments.manage')
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()

  const [entries, payments] = await Promise.all([
    listEntriesByEvent(id, event.cocks_per_entry),
    listPaymentsByEvent(id),
  ])

  const feeSettings = eventFeeSettingsFromRow(event)

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <PaymentsLedgerClient
        eventId={event.id}
        eventName={event.name}
        feeSettings={feeSettings}
        entries={entries}
        payments={payments}
      />
    </EventPageLayout>
  )
}
