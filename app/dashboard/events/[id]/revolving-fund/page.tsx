import { notFound } from 'next/navigation'

import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { getEvent } from '@/features/events/queries'
import { RevolvingFundClient } from '@/features/revolving-fund/components/revolving-fund-client'
import {
  getRevolvingFundBalance,
  listRevolvingFundLedger,
} from '@/features/revolving-fund/service'
import {
  isSystemOwnerRole,
  requireNonStaffAnyPermission,
} from '@/lib/auth/permissions'

type RevolvingFundPageProps = {
  params: Promise<{ id: string }>
}

export default async function RevolvingFundPage({ params }: RevolvingFundPageProps) {
  const profile = await requireNonStaffAnyPermission(['events.manage'])
  const canViewBalance = isSystemOwnerRole(profile.role)
  const { id } = await params
  const event = await getEvent(id)

  if (!event) notFound()

  const entries = await listRevolvingFundLedger(id)
  const balance = canViewBalance ? await getRevolvingFundBalance(id) : 0
  const clientEntries = canViewBalance
    ? entries
    : entries.map(({ balanceAfter: _, ...entry }) => entry)

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <RevolvingFundClient
        eventName={event.name}
        canViewBalance={canViewBalance}
        initialBalance={balance}
        revolvingFundInitial={event.revolving_fund_initial}
        entries={clientEntries}
      />
    </EventPageLayout>
  )
}
