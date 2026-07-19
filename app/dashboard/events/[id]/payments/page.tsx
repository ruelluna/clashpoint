import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { notFound } from 'next/navigation'

import { listEntriesByEvent } from '@/features/entries/queries'
import { eventFeeSettingsFromRow } from '@/features/events/fee-utils'
import { getEvent } from '@/features/events/queries'
import { CashierClient } from '@/features/payments/components/cashier-client'
import { listPaymentsByEvent } from '@/features/payments/service'
import { getRevolvingFundBalance } from '@/features/revolving-fund/service'
import { requirePermission } from '@/lib/auth/permissions'

type PaymentsPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ barcode?: string }>
}

export default async function PaymentsPage({ params, searchParams }: PaymentsPageProps) {
  await requirePermission('payments.manage')
  const { id } = await params
  const { barcode } = await searchParams
  const event = await getEvent(id)
  if (!event) notFound()

  const [entries, payments, revolvingFundBalance] = await Promise.all([
    listEntriesByEvent(id, event.cocks_per_entry),
    listPaymentsByEvent(id),
    getRevolvingFundBalance(id),
  ])

  const feeSettings = eventFeeSettingsFromRow(event)

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <CashierClient
        eventId={event.id}
        eventName={event.name}
        feeSettings={feeSettings}
        entries={entries}
        payments={payments}
        revolvingFundBalance={revolvingFundBalance}
        initialBarcode={barcode ?? null}
      />
    </EventPageLayout>
  )
}
