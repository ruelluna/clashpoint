'use client'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import type { ActiveEventNavConfig } from '@/lib/dashboard/nav'

type DashboardClientLayoutProps = {
  displayName: string
  permissionIds: string[]
  activeEvent?: ActiveEventNavConfig | null
  children: React.ReactNode
}

export function DashboardClientLayout({
  displayName,
  permissionIds,
  activeEvent = null,
  children,
}: DashboardClientLayoutProps) {
  return (
    <DashboardShell
      displayName={displayName}
      permissionIds={permissionIds}
      activeEvent={activeEvent}
    >
      {children}
    </DashboardShell>
  )
}
