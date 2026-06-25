import { DashboardClientLayout } from '@/components/dashboard/dashboard-client-layout'
import { requireAdmin } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireAdmin()

  return (
    <DashboardClientLayout displayName={profile.display_name ?? 'Admin'}>
      {children}
    </DashboardClientLayout>
  )
}
