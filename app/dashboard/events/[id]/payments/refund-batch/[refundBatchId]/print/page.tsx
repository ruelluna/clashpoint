import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageStack } from '@/components/dashboard'
import { getEvent } from '@/features/events/queries'
import { getRefundBatchForEvent } from '@/features/payments/service'
import { RegistrationDuesRefundSlip } from '@/features/printing/components/registration-dues-refund-slip'
import { requireAnyPermission } from '@/lib/auth/permissions'
import { Button } from '@chakra-ui/react'

type PaymentRefundBatchPrintPageProps = {
  params: Promise<{ id: string; refundBatchId: string }>
}

export default async function PaymentRefundBatchPrintPage({
  params,
}: PaymentRefundBatchPrintPageProps) {
  await requireAnyPermission(['payments.print', 'payments.manage'])
  const { id, refundBatchId } = await params
  const [event, receipt] = await Promise.all([
    getEvent(id),
    getRefundBatchForEvent(id, refundBatchId),
  ])

  if (!event || !receipt) notFound()

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <PageStack maxW="md">
        <RegistrationDuesRefundSlip
          receipt={{
            ...receipt,
            eventName: event.name,
          }}
        />
        <Button asChild variant="outline" alignSelf="flex-start" className="no-print">
          <Link href={`/dashboard/events/${id}/payments`}>Back to Cashier Terminal</Link>
        </Button>
      </PageStack>
    </EventPageLayout>
  )
}
