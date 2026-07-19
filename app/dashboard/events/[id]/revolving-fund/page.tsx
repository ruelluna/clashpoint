import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { getEvent } from '@/features/events/queries'
import { RevolvingFundClient } from '@/features/revolving-fund/components/revolving-fund-client'
import {
  getRevolvingFundBalance,
  listRevolvingFundLedger,
} from '@/features/revolving-fund/service'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requireNonStaffAnyPermission } from '@/lib/auth/permissions'

type RevolvingFundPageProps = {
  params: Promise<{ id: string }>
}

export default async function RevolvingFundPage({ params }: RevolvingFundPageProps) {
  await requireNonStaffAnyPermission(['events.manage'])
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const user = await getUser()
  const [entries, balance, canManage] = await Promise.all([
    listRevolvingFundLedger(id),
    getRevolvingFundBalance(id),
    user ? hasPermission(user.id, 'events.manage') : Promise.resolve(false),
  ])

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <RevolvingFundClient
        eventId={event.id}
        eventName={event.name}
        initialBalance={balance}
        revolvingFundInitial={event.revolving_fund_initial}
        entries={entries}
        canManage={canManage}
      />
    </EventPageLayout>
  )
}
