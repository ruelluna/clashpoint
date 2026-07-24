import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { getEvent } from '@/features/events/queries'
import { RevolvingFundClient } from '@/features/revolving-fund/components/revolving-fund-client'
import {
  getRevolvingFundBalance,
  listRevolvingFundLedger,
} from '@/features/revolving-fund/service'
import { requireNonStaffAnyPermission } from '@/lib/auth/permissions'

type RevolvingFundPageProps = {
  params: Promise<{ id: string }>
}

export default async function RevolvingFundPage({ params }: RevolvingFundPageProps) {
  await requireNonStaffAnyPermission(['events.manage'])
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const [entries, balance] = await Promise.all([
    listRevolvingFundLedger(id),
    getRevolvingFundBalance(id),
  ])

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <RevolvingFundClient
        eventName={event.name}
        initialBalance={balance}
        revolvingFundInitial={event.revolving_fund_initial}
        entries={entries}
      />
    </EventPageLayout>
  )
}
