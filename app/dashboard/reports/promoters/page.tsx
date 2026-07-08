import { PromoterReportClient } from '@/features/reports/components/promoter-report-client'
import { getPromoterReport } from '@/features/reports/queries'
import { requirePermission } from '@/lib/auth/permissions'

export default async function PromoterReportsPage() {
  await requirePermission('reports.view')
  const rows = await getPromoterReport()

  return <PromoterReportClient rows={rows} />
}
