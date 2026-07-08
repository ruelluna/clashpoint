import { notFound, redirect } from 'next/navigation'

import { PortalEventSummaryClient } from '@/features/promoter-portal/components/portal-event-summary-client'
import { getEventSummaryForPromoter } from '@/features/promoter-portal/queries'
import { requirePortalAccess } from '@/lib/auth/permissions'

type PortalEventDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function PortalEventDetailPage({
  params,
}: PortalEventDetailPageProps) {
  const profile = await requirePortalAccess()
  const { id } = await params

  try {
    const summary = await getEventSummaryForPromoter(profile, id)
    if (!summary) notFound()
    return <PortalEventSummaryClient summary={summary} />
  } catch {
    redirect('/access-denied')
  }
}
