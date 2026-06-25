'use client'

import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

type DashboardShellProps = {
  displayName: string
  avatarUrl?: string | null
  children: React.ReactNode
}

export function DashboardShell({
  displayName,
  avatarUrl,
  children,
}: DashboardShellProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar displayName={displayName} avatarUrl={avatarUrl} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <span className="text-sm font-medium text-muted-foreground">
              Dashboard
            </span>
          </header>
          <div className="flex flex-1 flex-col p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
