import { EventPageLayout } from '@/components/dashboard/event-page-layout'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PageStack } from '@/components/dashboard'
import { getEvent } from '@/features/events/queries'
import { getPaymentForEvent } from '@/features/payments/service'
import { PaymentReceiptSlip } from '@/features/printing/components/payment-receipt-slip'
import { requireAnyPermission } from '@/lib/auth/permissions'
import { Button } from '@chakra-ui/react'

type PaymentPrintPageProps = {
  params: Promise<{ id: string; paymentId: string }>
}

export default async function PaymentPrintPage({ params }: PaymentPrintPageProps) {
  await requireAnyPermission(['payments.print', 'payments.manage'])
  const { id, paymentId } = await params
  const [event, payment] = await Promise.all([
    getEvent(id),
    getPaymentForEvent(id, paymentId),
  ])

  if (!event || !payment) notFound()

  return (
    <EventPageLayout eventId={event.id} eventName={event.name}>
      <PageStack maxW="md">
        <PaymentReceiptSlip payment={{ ...payment, eventName: event.name }} />
        <Button asChild variant="outline" alignSelf="flex-start" className="no-print">
          <Link href={`/dashboard/events/${id}/payments`}>Back to payments</Link>
        </Button>
      </PageStack>
    </EventPageLayout>
  )
}
