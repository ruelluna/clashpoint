export type DashboardNavItemConfig = {
  label: string
  href: string
  disabled?: boolean
  badge?: string
  requiredPermissions?: string[]
}

export type ActiveEventNavConfig = {
  id: string
  name: string
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
    label: 'Owners',
    href: '/dashboard/owners',
    requiredPermissions: ['entries.manage', 'rooster.view'],
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

function canSeeActiveEventNav(grantedPermissions: string[]): boolean {
  if (grantedPermissions.includes('*')) return true
  return (
    grantedPermissions.includes('events.view') ||
    grantedPermissions.includes('events.manage')
  )
}

export function activeEventNavHref(eventId: string): string {
  return `/dashboard/events/${eventId}`
}

export function prependActiveEventNavItem(
  items: DashboardNavItemConfig[],
  activeEvent: ActiveEventNavConfig | null | undefined,
  grantedPermissions: string[]
): DashboardNavItemConfig[] {
  if (!activeEvent || !canSeeActiveEventNav(grantedPermissions)) {
    return items
  }

  return [
    {
      label: activeEvent.name,
      href: activeEventNavHref(activeEvent.id),
      badge: 'Active',
    },
    ...items,
  ]
}

export function isDashboardNavItemActive(
  pathname: string,
  href: string,
  activeEventHref?: string | null
): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard'
  }

  if (href === '/dashboard/events') {
    if (pathname === '/dashboard/events' || pathname.startsWith('/dashboard/events/new')) {
      return true
    }
    if (
      activeEventHref &&
      (pathname === activeEventHref || pathname.startsWith(`${activeEventHref}/`))
    ) {
      return false
    }
    return pathname.startsWith('/dashboard/events/')
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

