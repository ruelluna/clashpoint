'use client'

import {
  Building2,
  Calendar,
  FileBarChart,
  LayoutDashboard,
  ScrollText,
  Settings,
  Swords,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react'

export const dashboardNavIconsByHref: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/promoters': UserCircle,
  '/dashboard/owners': Building2,
  '/dashboard/events': Calendar,
  '/dashboard/fights': Swords,
  '/dashboard/users': Users,
  '/dashboard/reports': FileBarChart,
  '/dashboard/audit': ScrollText,
  '/dashboard/settings': Settings,
}

export type DashboardNavItem = {
  label: string
  href: string
  icon: LucideIcon
  disabled?: boolean
  badge?: string
}
