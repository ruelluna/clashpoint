import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import { notFound } from 'next/navigation'

import {
  getOpenCashierSessionForStaff,
  listAdminHandoverCandidates,
} from '@/features/cashier-sessions/queries'
import { eventFeeSettingsFromRow } from '@/features/events/fee-utils'
import { getEvent } from '@/features/events/queries'
import { CashierClient } from '@/features/payments/components/cashier-client'
import { listCashierSelectableEntries, listPaymentsByEvent } from '@/features/payments/service'
import { canOperateAsStaff } from '@/lib/auth/operational-access'
import { getUser } from '@/lib/auth/session'
import { hasPermission, requirePermission } from '@/lib/auth/permissions'

type PaymentsPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ barcode?: string }>
}

export default async function PaymentsPage({ params, searchParams }: PaymentsPageProps) {
  const profile = await requirePermission('payments.manage')
  const { id } = await params
  const { barcode } = await searchParams
  const event = await getEvent(id)
  if (!event) notFound()

  const user = await getUser()
  const canOperate =
    Boolean(user) &&
    canOperateAsStaff(profile) &&
    (await hasPermission(user!.id, 'payments.manage'))

  const [selectableEntries, payments, session, adminCandidates] = await Promise.all([
    listCashierSelectableEntries(id),
    listPaymentsByEvent(id),
    canOperate && user ? getOpenCashierSessionForStaff(id, user.id) : Promise.resolve(null),
    canOperate ? listAdminHandoverCandidates() : Promise.resolve([]),
  ])

  const feeSettings = eventFeeSettingsFromRow(event)

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <CashierClient
        eventId={event.id}
        eventName={event.name}
        feeSettings={feeSettings}
        selectableEntries={selectableEntries}
        payments={payments}
        canOperate={canOperate}
        cashierDisplayName={profile.display_name ?? 'Staff'}
        session={session}
        defaultOpeningFloat={event.cashier_opening_float_default}
        adminCandidates={adminCandidates}
        initialBarcode={barcode ?? null}
      />
    </EventPageLayout>
  )
}
