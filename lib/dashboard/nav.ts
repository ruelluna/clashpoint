import type { LucideIcon } from 'lucide-react'
import { Calendar, LayoutDashboard, Settings, Swords } from 'lucide-react'

export type DashboardNavItem = {
  label: string
  href: string
  icon: LucideIcon
  disabled?: boolean
  badge?: string
}

export const dashboardNavItems: DashboardNavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Events',
    href: '/dashboard/events',
    icon: Calendar,
    disabled: true,
    badge: 'Soon',
  },
  {
    label: 'Fights',
    href: '/dashboard/fights',
    icon: Swords,
    disabled: true,
    badge: 'Soon',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    disabled: true,
    badge: 'Soon',
  },
]
