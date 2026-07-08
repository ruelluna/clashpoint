import { DashboardClientLayout } from '@/components/dashboard/dashboard-client-layout'
import { requireDashboardAccess } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireDashboardAccess()

  return (
    <DashboardClientLayout displayName={profile.display_name ?? 'Admin'}>
      {children}
    </DashboardClientLayout>
  )
}
