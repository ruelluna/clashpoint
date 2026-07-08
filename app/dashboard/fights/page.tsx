import { FightsOverviewClient } from '@/features/matches/components/fights-overview-client'
import { listOngoingFightQueueSummaries } from '@/features/matches/queries'
import { requirePermission } from '@/lib/auth/permissions'

export default async function FightsPage() {
  await requirePermission('events.view')
  const summaries = await listOngoingFightQueueSummaries()

  return <FightsOverviewClient summaries={summaries} />
}
