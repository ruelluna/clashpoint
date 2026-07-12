'use client'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
type DashboardClientLayoutProps = {
  displayName: string
  permissionIds: string[]
  children: React.ReactNode
}

export function DashboardClientLayout({
  displayName,
  permissionIds,
  children,
}: DashboardClientLayoutProps) {
  return (
    <DashboardShell displayName={displayName} permissionIds={permissionIds}>
      {children}
    </DashboardShell>
  )
}
