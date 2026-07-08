import { notFound } from 'next/navigation'
import { Box } from '@chakra-ui/react'

import { listEntriesByEvent } from '@/features/entries/queries'
import { EventDetailTabs } from '@/features/events/components/event-detail-tabs'
import { getEvent } from '@/features/events/queries'
import { PaymentsLedgerClient } from '@/features/payments/components/payments-ledger-client'
import { listPaymentsByEvent } from '@/features/payments/service'
import { requirePermission } from '@/lib/auth/permissions'

type EventPaymentsPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventPaymentsPage({ params }: EventPaymentsPageProps) {
  await requirePermission('payments.manage')
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const [entries, payments] = await Promise.all([
    listEntriesByEvent(id),
    listPaymentsByEvent(id),
  ])

  return (
    <Box className="space-y-6">
      <EventDetailTabs eventId={event.id} eventName={event.name} />
      <PaymentsLedgerClient
        eventId={event.id}
        eventName={event.name}
        entryFee={event.entry_fee}
        entries={entries}
        payments={payments}
      />
    </Box>
  )
}
