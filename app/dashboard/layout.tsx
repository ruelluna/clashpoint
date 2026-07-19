import { DashboardClientLayout } from '@/components/dashboard/dashboard-client-layout'
import { getActiveEvent } from '@/features/events/queries'
import { getUserPermissionIds, requireDashboardAccess } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireDashboardAccess()
  const [permissionIds, activeEvent] = await Promise.all([
    getUserPermissionIds(profile.id),
    getActiveEvent(),
  ])

  return (
    <DashboardClientLayout
      displayName={profile.display_name ?? 'Admin'}
      permissionIds={permissionIds}
      activeEvent={activeEvent}
    >
      {children}
    </DashboardClientLayout>
  )
}
