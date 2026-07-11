'use client'

import { DashboardLayoutFallback } from '@/components/dashboard/dashboard-layout-fallback'
import { ChakraClientRoot } from '@/components/chakra/client-root'
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
    <ChakraClientRoot fallback={<DashboardLayoutFallback />}>
      <DashboardShell displayName={displayName} permissionIds={permissionIds}>
        {children}
      </DashboardShell>
    </ChakraClientRoot>
  )
}
