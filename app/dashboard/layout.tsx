import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { requireAdmin } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireAdmin()

  return (
    <DashboardShell displayName={profile.display_name ?? 'Admin'}>
      {children}
    </DashboardShell>
  )
}
