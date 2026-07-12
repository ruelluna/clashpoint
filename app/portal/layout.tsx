import { PortalShell } from '@/features/promoter-portal/components/portal-shell'
import { requirePortalAccess } from '@/lib/auth/permissions'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requirePortalAccess()

  return (
    <PortalShell displayName={profile.display_name ?? 'Promoter'}>
      {children}
    </PortalShell>
  )
}
