import { DashboardClientLayout } from '@/components/dashboard/dashboard-client-layout'
import { getUserPermissionIds, requireDashboardAccess } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireDashboardAccess()
  const permissionIds = await getUserPermissionIds(profile.id)

  return (
    <DashboardClientLayout
      displayName={profile.display_name ?? 'Admin'}
      permissionIds={permissionIds}
    >
      {children}
    </DashboardClientLayout>
  )
}
