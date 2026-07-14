import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { OwnerDetailClient } from '@/features/entries/components/owner-detail-client'
import { getEntry } from '@/features/entries/queries'
import { getEvent } from '@/features/events/queries'
import { eventFeeSettingsFromRow } from '@/features/events/fee-utils'
import { listPaymentsByEvent } from '@/features/payments/service'
import { getPromoter } from '@/features/promoters/queries'
import { listRegistrationsByEntry } from '@/features/registrations/queries'
import { requireAnyPermission } from '@/lib/auth/permissions'

type OwnerDetailPageProps = {
  params: Promise<{ id: string; entryId: string }>
}

export default async function OwnerDetailPage({ params }: OwnerDetailPageProps) {
  await requireAnyPermission(['owner_registration.manage', 'entries.manage', 'events.view'])
  const { id, entryId } = await params

  const [event, entry] = await Promise.all([getEvent(id), getEntry(entryId)])
  if (!event || !entry || entry.event_id !== id) notFound()

  const [registrations, payments, promoter] = await Promise.all([
    listRegistrationsByEntry(id, entryId),
    listPaymentsByEvent(id),
    entry.referred_by_promoter_id ? getPromoter(entry.referred_by_promoter_id) : null,
  ])

  const entryPayments = payments.filter((payment) => payment.entryId === entryId)

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <OwnerDetailClient
        eventId={event.id}
        eventName={event.name}
        eventType={event.event_type}
        cocksPerEntry={event.cocks_per_entry}
        entry={entry}
        promoterName={promoter?.name ?? null}
        feeSettings={eventFeeSettingsFromRow(event)}
        registrations={registrations}
        payments={entryPayments}
      />
    </EventPageLayout>
  )
}
