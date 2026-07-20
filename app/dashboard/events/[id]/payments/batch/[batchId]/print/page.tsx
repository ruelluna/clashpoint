import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageStack } from '@/components/dashboard'
import { getEvent } from '@/features/events/queries'
import { getPaymentBatchForEvent } from '@/features/payments/service'
import { RegistrationDuesReceiptSlip } from '@/features/printing/components/registration-dues-receipt-slip'
import { requireAnyPermission } from '@/lib/auth/permissions'
import { Button } from '@chakra-ui/react'

type PaymentBatchPrintPageProps = {
  params: Promise<{ id: string; batchId: string }>
}

export default async function PaymentBatchPrintPage({ params }: PaymentBatchPrintPageProps) {
  await requireAnyPermission(['payments.print', 'payments.manage'])
  const { id, batchId } = await params
  const [event, receipt] = await Promise.all([
    getEvent(id),
    getPaymentBatchForEvent(id, batchId),
  ])

  if (!event || !receipt) notFound()

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <PageStack maxW="md">
        <RegistrationDuesReceiptSlip
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
