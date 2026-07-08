import { notFound } from 'next/navigation'

import { PromoterFormClient } from '@/features/promoters/components/promoter-form-client'
import {
  getPromoter,
  getPromoterEventHistory,
} from '@/features/promoters/queries'
import { requirePermission } from '@/lib/auth/permissions'

type PromoterDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function PromoterDetailPage({
  params,
}: PromoterDetailPageProps) {
  await requirePermission('promoters.manage')

  const { id } = await params
  const [promoter, eventHistory] = await Promise.all([
    getPromoter(id),
    getPromoterEventHistory(id),
  ])

  if (!promoter) notFound()

  return (
    <PromoterFormClient
      mode="edit"
      promoter={promoter}
      eventHistory={eventHistory}
    />
  )
}
