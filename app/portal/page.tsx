import { PortalDashboardClient } from '@/features/promoter-portal/components/portal-dashboard-client'
import { getPromoterDashboard } from '@/features/promoter-portal/queries'
import { requirePortalAccess } from '@/lib/auth/permissions'

export default async function PortalPage() {
  const profile = await requirePortalAccess()
  const stats = await getPromoterDashboard(profile)

  return <PortalDashboardClient stats={stats} />
}
