export type DashboardNavItemConfig = {
  label: string
  href: string
  disabled?: boolean
  badge?: string
  requiredPermissions?: string[]
}

export const dashboardNavItemConfigs: DashboardNavItemConfig[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    label: 'Promoters',
    href: '/dashboard/promoters',
    requiredPermissions: ['promoters.manage'],
  },
  {
    label: 'Roosters',
    href: '/dashboard/roosters',
    requiredPermissions: ['rooster.view', 'rooster.create'],
  },
  {
    label: 'Events',
    href: '/dashboard/events',
    requiredPermissions: ['events.view', 'events.manage'],
  },
  {
    label: 'Fights',
    href: '/dashboard/fights',
    requiredPermissions: ['matches.manage', 'events.view'],
  },
  {
    label: 'Users',
    href: '/dashboard/users',
    requiredPermissions: ['users.manage', 'users.invite'],
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    requiredPermissions: ['reports.view'],
  },
  {
    label: 'Audit',
    href: '/dashboard/audit',
    requiredPermissions: ['audit.view'],
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    requiredPermissions: ['settings.manage'],
  },
]

export function filterNavItemsByPermissions(
  items: DashboardNavItemConfig[],
  grantedPermissions: string[]
): DashboardNavItemConfig[] {
  const hasAll = grantedPermissions.includes('*')

  return items.filter((item) => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true
    }

    if (hasAll) return true

    return item.requiredPermissions.some((permission) =>
      grantedPermissions.includes(permission)
    )
  })
}
