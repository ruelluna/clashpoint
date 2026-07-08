import { GlobalReportsClient } from '@/features/reports/components/reports-hub-client'
import { listEvents } from '@/features/events/queries'
import { requirePermission } from '@/lib/auth/permissions'

export default async function GlobalReportsPage() {
  await requirePermission('reports.view')
  const events = await listEvents()

  return <GlobalReportsClient events={events} />
}
