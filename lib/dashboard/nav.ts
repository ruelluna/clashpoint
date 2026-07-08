import { Users, Settings, ScrollText, LayoutDashboard, Calendar, Swords, UserCircle, FileBarChart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
    label: 'Promoters',
    href: '/dashboard/promoters',
    icon: UserCircle,
  },
  {
    label: 'Events',
    href: '/dashboard/events',
    icon: Calendar,
  },
  {
    label: 'Fights',
    href: '/dashboard/fights',
    icon: Swords,
  },
  {
    label: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: FileBarChart,
  },
  {
    label: 'Audit',
    href: '/dashboard/audit',
    icon: ScrollText,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]
